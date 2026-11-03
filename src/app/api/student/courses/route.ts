import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET() {
  try {
    const session = await requireRole('STUDENT');

    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      include: { department: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student record not found.' }, { status: 404 });
    }

    // ── Current active session with BOTH semesters ────────────────────────────
    const currentSession = await prisma.academicSession.findFirst({
      where: { isCurrent: true },
      include: {
        semesters: { orderBy: { name: 'asc' } },
      },
    });

    // ── Past sessions with their registrations ────────────────────────────────
    const pastSessions = await prisma.academicSession.findMany({
      where: { isCurrent: false },
      orderBy: { name: 'desc' },
      include: {
        semesters: {
          orderBy: { name: 'asc' },
          include: {
            registrations: {
              where: { studentId: student.id },
              include: { course: true, score: true },
            },
          },
        },
      },
    });

    const serializePastSessions = (sessions: typeof pastSessions) =>
      sessions.map((ps) => ({
        id: ps.id,
        name: ps.name,
        semesters: ps.semesters.map((sem) => ({
          id: sem.id,
          name: sem.name,
          registrationOpen: sem.registrationOpen,
          resultsPublished: sem.resultsPublished,
          registrations: sem.registrations.map((r) => ({
            id: r.id,
            course: r.course,
            score: r.score,
          })),
        })),
      }));

    if (!currentSession) {
      return NextResponse.json({
        student,
        currentSession: null,
        semesters: [],
        coursesBySemester: {},
        registeredCourseIds: {},
        pastSessions: serializePastSessions(pastSessions),
      });
    }

    // ── Available courses for both semesters at student's level ───────────────
    const availableCourses = await prisma.course.findMany({
      where: {
        departmentId: student.departmentId,
        level: student.level,
      },
      orderBy: { code: 'asc' },
    });

    const coursesBySemester: Record<string, typeof availableCourses> = {};
    for (const c of availableCourses) {
      if (!coursesBySemester[c.semester]) coursesBySemester[c.semester] = [];
      coursesBySemester[c.semester].push(c);
    }

    // ── Existing registrations for current session ────────────────────────────
    const existingRegs = await prisma.courseRegistration.findMany({
      where: { studentId: student.id, sessionId: currentSession.id },
      include: { course: true, score: true, semester: true },
    });

    const registeredCourseIds: Record<string, string[]> = {};
    for (const sem of currentSession.semesters) {
      registeredCourseIds[sem.id] = existingRegs
        .filter((r) => r.semesterId === sem.id)
        .map((r) => r.courseId);
    }

    return NextResponse.json({
      student,
      currentSession: { id: currentSession.id, name: currentSession.name },
      semesters: currentSession.semesters.map((s) => ({
        id: s.id,
        name: s.name,
        isCurrent: s.isCurrent,
        registrationOpen: s.registrationOpen,
        resultsPublished: s.resultsPublished,
      })),
      coursesBySemester,
      registeredCourseIds,
      pastSessions: serializePastSessions(pastSessions),
    });
  } catch (error) {
    console.error('Course registration GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve course registration details.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authSession = await requireRole('STUDENT');
    const { courseSelections } = await req.json() as { courseSelections: Record<string, string[]> };

    if (!courseSelections || typeof courseSelections !== 'object') {
      return NextResponse.json({ error: 'Invalid course selection payload.' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: authSession.userId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student record not found.' }, { status: 404 });
    }

    const currentSession = await prisma.academicSession.findFirst({
      where: { isCurrent: true },
      include: { semesters: true },
    });

    if (!currentSession) {
      return NextResponse.json({ error: 'No active academic session is configured.' }, { status: 400 });
    }

    const semesterMap = Object.fromEntries(currentSession.semesters.map((s) => [s.id, s]));

    for (const semId of Object.keys(courseSelections)) {
      if (!semesterMap[semId]) {
        return NextResponse.json({ error: `Semester ${semId} does not belong to the current session.` }, { status: 400 });
      }
      if (!semesterMap[semId].registrationOpen) {
        return NextResponse.json(
          { error: `Registration for the ${semesterMap[semId].name} semester is currently closed.` },
          { status: 403 }
        );
      }
    }

    const allCourseIds = Object.values(courseSelections).flat();
    const allCourses = await prisma.course.findMany({ where: { id: { in: allCourseIds } } });
    const courseMap = Object.fromEntries(allCourses.map((c) => [c.id, c]));

    for (const [semId, ids] of Object.entries(courseSelections)) {
      const semester = semesterMap[semId];
      if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) {
        return NextResponse.json({ error: 'Invalid course selection for this semester.' }, { status: 400 });
      }
      for (const courseId of ids) {
        const course = courseMap[courseId];
        if (!course || course.departmentId !== student.departmentId || course.level !== student.level || course.semester !== semester.name) {
          return NextResponse.json(
            { error: 'One or more selected courses do not belong to your department, level, and semester.' },
            { status: 400 },
          );
        }
      }
    }

    for (const semester of currentSession.semesters.filter((item) => item.registrationOpen)) {
      const availableCourseCount = await prisma.course.count({
        where: {
          departmentId: student.departmentId,
          level: student.level,
          semester: semester.name,
        },
      });
      if (availableCourseCount === 0) continue;

      const ids = courseSelections[semester.id] ?? [];
      const totalUnits = ids.reduce((sum, courseId) => sum + (courseMap[courseId]?.unit ?? 0), 0);
      if (totalUnits < 15 || totalUnits > 24) {
        return NextResponse.json(
          { error: `${semester.name} Semester must have between 15 and 24 selected units before registration. Current total: ${totalUnits}.` },
          { status: 400 }
        );
      }
    }

    const blockedByRegistered: string[] = [];
    await prisma.$transaction(async (tx) => {
      for (const [semId, ids] of Object.entries(courseSelections)) {
        const currentRegs = await tx.courseRegistration.findMany({
          where: { studentId: student.id, sessionId: currentSession.id, semesterId: semId },
          include: { score: true, course: true },
        });

        for (const reg of currentRegs) {
          if (!ids.includes(reg.courseId)) {
            blockedByRegistered.push(reg.course.code);
          }
        }

        for (const courseId of ids) {
          const exists = currentRegs.find((r) => r.courseId === courseId);
          if (!exists) {
            await tx.courseRegistration.create({
              data: { studentId: student.id, courseId, sessionId: currentSession.id, semesterId: semId },
            });
          }
        }
      }
    });

    const remainingRegistrations = await prisma.courseRegistration.findMany({
      where: { studentId: student.id, sessionId: currentSession.id },
      select: { semesterId: true, courseId: true },
    });
    const registeredCourseIds: Record<string, string[]> = Object.fromEntries(
      currentSession.semesters.map((semester) => [semester.id, []]),
    );
    for (const registration of remainingRegistrations) {
      registeredCourseIds[registration.semesterId]?.push(registration.courseId);
    }
    const warning = blockedByRegistered.length > 0
      ? `Already registered courses cannot be removed: ${[...new Set(blockedByRegistered)].join(', ')}.`
      : undefined;

    return NextResponse.json({
      success: true,
      message: `Course registration updated. ${remainingRegistrations.length} course(s) are currently registered for this session.`,
      warning,
      registeredCourseIds,
    });
  } catch (error) {
    console.error('Course registration POST error:', error);
    return NextResponse.json({ error: 'Failed to complete course registration.' }, { status: 500 });
  }
}
