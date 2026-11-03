import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, requireRole } from '@/lib/auth';

const INITIAL_STUDENT_PASSWORD = 'student123';
const EMAIL_DOMAIN = '@futminna.edu.ng';

function cleanName(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function cleanMatricNo(value: unknown) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function emailPart(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function generateStudentEmail(fullName: string, matricNo: string) {
  const nameParts = fullName.split(' ').filter(Boolean);
  const firstName = emailPart(nameParts[0] || 'student');
  const lastName = emailPart(nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0] || 'student');
  const matricSuffix = emailPart(matricNo.split('/').filter(Boolean).at(-1) || matricNo);
  return `${firstName}.${lastName}.${matricSuffix}${EMAIL_DOMAIN}`;
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'UNAUTHORIZED' || message === 'FORBIDDEN') {
    return NextResponse.json({ error: message }, { status: message === 'UNAUTHORIZED' ? 401 : 403 });
  }
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
    return NextResponse.json({ error: 'That matric number or generated school email is already in use.' }, { status: 409 });
  }
  console.error('Admin student management error:', error);
  return NextResponse.json({ error: 'Unable to complete the student request.' }, { status: 500 });
}

async function parseStudentInput(body: Record<string, unknown>) {
  const fullName = cleanName(body.fullName);
  const matricNo = cleanMatricNo(body.matricNo);
  const departmentId = typeof body.departmentId === 'string' ? body.departmentId.trim() : '';

  if (fullName.split(' ').length < 2) {
    return { error: 'Enter the student’s first and last name.' } as const;
  }
  if (!matricNo) return { error: 'Matric number is required.' } as const;
  if (!departmentId) return { error: 'Select a department.' } as const;

  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) return { error: 'The selected department was not found.' } as const;

  return {
    fullName,
    matricNo,
    departmentId: department.id,
    facultyId: department.facultyId,
    email: generateStudentEmail(fullName, matricNo),
  } as const;
}

async function generateNextMatricNo() {
  const currentSession = await prisma.academicSession.findFirst({
    where: { isCurrent: true },
    select: { name: true },
  });
  const sessionYear = currentSession?.name.match(/^(\d{4})/)?.[1];
  const cohortYear = (sessionYear || String(new Date().getFullYear())).slice(-2);
  const prefix = `UG/${cohortYear}/`;
  const existing = await prisma.student.findMany({
    where: { matricNo: { startsWith: prefix } },
    select: { matricNo: true },
  });
  const maxNumber = existing.reduce((maximum, student) => {
    const suffix = Number(student.matricNo.slice(prefix.length));
    return Number.isSafeInteger(suffix) ? Math.max(maximum, suffix) : maximum;
  }, 0);
  return `${prefix}${String(maxNumber + 1).padStart(4, '0')}`;
}

export async function GET() {
  try {
    await requireRole('ADMIN');
    return NextResponse.json({ matricNo: await generateNextMatricNo() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole('ADMIN');
    const body = await req.json();
    body.matricNo = await generateNextMatricNo();
    const input = await parseStudentInput(body);
    if ('error' in input) return NextResponse.json({ error: input.error }, { status: 400 });

    const passwordHash = await hashPassword(INITIAL_STUDENT_PASSWORD);
    const student = await prisma.user.create({
      data: {
        username: input.matricNo,
        email: input.email,
        name: input.fullName,
        passwordHash,
        role: 'STUDENT',
        student: {
          create: {
            matricNo: input.matricNo,
            fullName: input.fullName,
            email: input.email,
            departmentId: input.departmentId,
            facultyId: input.facultyId,
          },
        },
      },
      include: { student: { include: { department: true, faculty: true } } },
    });

    return NextResponse.json({ success: true, student: student.student, initialPassword: INITIAL_STUDENT_PASSWORD }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole('ADMIN');
    const body = await req.json();
    const studentId = typeof body.studentId === 'string' ? body.studentId : '';
    if (!studentId) return NextResponse.json({ error: 'Student ID is required.' }, { status: 400 });

    const existing = await prisma.student.findUnique({ where: { id: studentId }, select: { userId: true, matricNo: true } });
    if (!existing) return NextResponse.json({ error: 'Student record not found.' }, { status: 404 });

    body.matricNo = existing.matricNo;
    const input = await parseStudentInput(body);
    if ('error' in input) return NextResponse.json({ error: input.error }, { status: 400 });

    const updated = await prisma.user.update({
      where: { id: existing.userId },
      data: {
        username: input.matricNo,
        email: input.email,
        name: input.fullName,
        student: {
          update: {
            matricNo: input.matricNo,
            fullName: input.fullName,
            email: input.email,
            departmentId: input.departmentId,
            facultyId: input.facultyId,
          },
        },
      },
      include: { student: { include: { department: true, faculty: true } } },
    });

    return NextResponse.json({ success: true, student: updated.student });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole('ADMIN');
    const { studentId } = await req.json();
    if (typeof studentId !== 'string' || !studentId) {
      return NextResponse.json({ error: 'Student ID is required.' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { userId: true } });
    if (!student) return NextResponse.json({ error: 'Student record not found.' }, { status: 404 });

    // Deleting the linked user cascades to the student, course registrations, and scores.
    await prisma.user.delete({ where: { id: student.userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
