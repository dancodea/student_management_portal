import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { calculateGrade } from '@/lib/academic';

export async function GET(req: NextRequest) {
  try {
    await requireRole('ADMIN');
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const sessionId = searchParams.get('sessionId');
    const semesterId = searchParams.get('semesterId');

    if (!courseId || !sessionId || !semesterId) {
      return NextResponse.json(
        { error: 'Course, session, and semester IDs are required.' },
        { status: 400 }
      );
    }

    const registrations = await prisma.courseRegistration.findMany({
      where: {
        courseId,
        sessionId,
        semesterId,
      },
      include: {
        student: {
          include: { department: true },
        },
        score: true,
      },
      orderBy: {
        student: { matricNo: 'asc' },
      },
    });

    const enrolledStudents = registrations.map((r) => ({
      registrationId: r.id,
      studentId: r.student.id,
      matricNo: r.student.matricNo,
      fullName: r.student.fullName,
      department: r.student.department.name,
      caScore: r.score?.caScore ?? 0,
      examScore: r.score?.examScore ?? 0,
      totalScore: r.score?.totalScore ?? 0,
      grade: r.score?.grade ?? 'F',
      gradePoint: r.score?.gradePoint ?? 0,
      hasScore: Boolean(r.score),
    }));

    return NextResponse.json({ success: true, enrolledStudents });
  } catch (error) {
    console.error('Admin scores GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch course scores.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN');
    const body = await req.json();
    const { registrationId, caScore, examScore } = body;

    if (!registrationId) {
      return NextResponse.json({ error: 'Registration ID is required.' }, { status: 400 });
    }

    const ca = parseFloat(caScore) || 0;
    const exam = parseFloat(examScore) || 0;

    if (ca < 0 || ca > 40) {
      return NextResponse.json({ error: 'CA score must be between 0 and 40.' }, { status: 400 });
    }

    if (exam < 0 || exam > 60) {
      return NextResponse.json({ error: 'Exam score must be between 0 and 60.' }, { status: 400 });
    }

    const total = ca + exam;
    const { grade, gradePoint } = calculateGrade(total);

    const score = await prisma.score.upsert({
      where: { registrationId },
      update: {
        caScore: ca,
        examScore: exam,
        totalScore: total,
        grade,
        gradePoint,
      },
      create: {
        registrationId,
        caScore: ca,
        examScore: exam,
        totalScore: total,
        grade,
        gradePoint,
      },
    });

    // Log admin action
    await prisma.activityLog.create({
      data: {
        adminId: session.userId,
        action: 'UPDATE_SCORE',
        details: `Updated score for registration ${registrationId}: Total ${total} (${grade})`,
      },
    });

    return NextResponse.json({ success: true, score });
  } catch (error) {
    console.error('Admin scores POST error:', error);
    return NextResponse.json({ error: 'Failed to update score.' }, { status: 500 });
  }
}
