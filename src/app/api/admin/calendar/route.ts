import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

const FIRST_SEMESTER_MILESTONES = [
  {
    week: 'Week 1',
    dateRange: 'Oct 14 – Oct 19',
    title: 'Course Registration Portal Opens',
    description: 'Online enrolment commences for fresh and returning undergraduates across all faculties.',
    category: 'REGISTRATION',
    status: 'IN_PROGRESS',
    unit: 'ICT Directorate',
    order: 1,
  },
  {
    week: 'Week 2',
    dateRange: 'Oct 21',
    title: 'Commencement of First Semester Lectures',
    description: 'Official resumption of academic teaching, distribution of course outlines and departmental timetables.',
    category: 'ACADEMIC',
    status: 'UPCOMING',
    unit: 'All Faculties',
    order: 2,
  },
  {
    week: 'Week 4',
    dateRange: 'Nov 08',
    title: 'Late Course Registration Commences',
    description: 'Standard registration window closes; late registration opens with administrative surcharge fine.',
    category: 'REGISTRATION',
    status: 'UPCOMING',
    unit: 'Academic Registry',
    order: 3,
  },
  {
    week: 'Week 5',
    dateRange: 'Nov 15',
    title: 'Final Close of Add/Drop Window',
    description: 'Strict deadline for adding or dropping enrolled courses; maximum allowable credit cap locked at 24 units.',
    category: 'REGISTRATION',
    status: 'UPCOMING',
    unit: 'Registry Academic Office',
    order: 4,
  },
  {
    week: 'Week 7',
    dateRange: 'Nov 27',
    title: 'University Matriculation Ceremony',
    description: 'Official matriculation for 100-level and Direct Entry undergraduates at Convocation Square.',
    category: 'ACADEMIC',
    status: 'UPCOMING',
    unit: "Vice Chancellor's Office",
    order: 5,
  },
  {
    week: 'Week 9',
    dateRange: 'Dec 09 – Dec 14',
    title: 'Continuous Assessment (CA) Phase 1',
    description: 'First continuous assessment test period administering initial 20% coursework scores.',
    category: 'ASSESSMENT',
    status: 'UPCOMING',
    unit: 'Departmental Examiners',
    order: 6,
  },
  {
    week: 'Mid-Term',
    dateRange: 'Dec 23 – Jan 03',
    title: 'Mid-Semester & End of Year Recess',
    description: 'University-wide academic break; lectures, laboratories and examinations suspended.',
    category: 'ACADEMIC',
    status: 'UPCOMING',
    unit: 'University Registry',
    order: 7,
  },
  {
    week: 'Week 11–12',
    dateRange: 'Jan 06 – Jan 17',
    title: 'Lecture Resumption & CA Phase 2',
    description: 'Resumption of coursework teaching and completion of final continuous assessment tests (20%).',
    category: 'ASSESSMENT',
    status: 'UPCOMING',
    unit: 'Academic Departments',
    order: 8,
  },
  {
    week: 'Week 13',
    dateRange: 'Jan 20 – Jan 24',
    title: 'Revision Week & CA Scores Audit',
    description: 'Final lectures concluded; release of verified continuous assessment marks (40%) on portal.',
    category: 'ACADEMIC',
    status: 'UPCOMING',
    unit: 'Directorate of Exams',
    order: 9,
  },
  {
    week: 'Week 14–16',
    dateRange: 'Jan 27 – Feb 15',
    title: 'First Semester Final Examinations',
    description: 'Official university-wide examinations administering final 60% semester papers.',
    category: 'EXAMINATION',
    status: 'UPCOMING',
    unit: 'Central Examination Committee',
    order: 10,
  },
  {
    week: 'Post-Exam',
    dateRange: 'Feb 17 – Feb 28',
    title: 'Departmental Score Moderation',
    description: 'Internal vetting, scoring computation and departmental board review of raw examination scripts.',
    category: 'SENATE',
    status: 'UPCOMING',
    unit: 'Faculty Examination Boards',
    order: 11,
  },
  {
    week: 'Senate',
    dateRange: 'Mar 10',
    title: 'Senate Approval & Results Release',
    description: 'University Senate ratification of official broadsheets; release of verified GPA to student accounts.',
    category: 'SENATE',
    status: 'UPCOMING',
    unit: 'University Senate',
    order: 12,
  },
];

const SECOND_SEMESTER_MILESTONES = [
  {
    week: 'Week 1',
    dateRange: 'Mar 24',
    title: 'Commencement of Second Semester Lectures',
    description: 'Resumption of academic teaching, distribution of second semester course materials, laboratories, and lecture timetables.',
    category: 'ACADEMIC',
    status: 'UPCOMING',
    unit: 'All Faculties',
    order: 13,
  },
  {
    week: 'Week 2',
    dateRange: 'Mar 31 – Apr 05',
    title: 'Second Semester Course Verification & Add/Drop Window',
    description: 'Window for students to adjust second semester elective courses and verify registered modules on the portal.',
    category: 'REGISTRATION',
    status: 'UPCOMING',
    unit: 'ICT Directorate',
    order: 14,
  },
  {
    week: 'Week 4',
    dateRange: 'Apr 14 – Apr 19',
    title: "Students' Union Week & Cultural Carnival",
    description: 'Annual university cultural carnival, intellectual debates, and inter-faculty sporting fiesta.',
    category: 'ACADEMIC',
    status: 'UPCOMING',
    unit: 'Student Affairs Division',
    order: 15,
  },
  {
    week: 'Week 6',
    dateRange: 'Apr 28 – May 03',
    title: 'Continuous Assessment (CA) Phase 1',
    description: 'First continuous assessment test period administering initial 20% coursework evaluation for second semester.',
    category: 'ASSESSMENT',
    status: 'UPCOMING',
    unit: 'Departmental Examiners',
    order: 16,
  },
  {
    week: 'Mid-Term',
    dateRange: 'May 12 – May 16',
    title: 'Mid-Semester Break',
    description: 'Brief academic break for undergraduates; administrative and research activities remain ongoing.',
    category: 'ACADEMIC',
    status: 'UPCOMING',
    unit: 'University Registry',
    order: 17,
  },
  {
    week: 'Week 9–10',
    dateRange: 'May 19 – May 30',
    title: 'Lecture Resumption & CA Phase 2',
    description: 'Final phase of lectures and completion of mid-term assignments, tests, and laboratory assessments (20%).',
    category: 'ASSESSMENT',
    status: 'UPCOMING',
    unit: 'Academic Departments',
    order: 18,
  },
  {
    week: 'Week 12',
    dateRange: 'Jun 09 – Jun 13',
    title: 'Revision Week & Practical Examinations',
    description: 'Conclusion of lectures, project submissions, studio defences, and verification of CA marks on portal.',
    category: 'ACADEMIC',
    status: 'UPCOMING',
    unit: 'Directorate of Exams',
    order: 19,
  },
  {
    week: 'Week 13–15',
    dateRange: 'Jun 16 – Jul 05',
    title: 'Second Semester Final Examinations',
    description: 'Official university-wide examinations for graduating and non-graduating students across all faculties.',
    category: 'EXAMINATION',
    status: 'UPCOMING',
    unit: 'Central Examination Committee',
    order: 20,
  },
  {
    week: 'Post-Exam',
    dateRange: 'Jul 07 – Jul 18',
    title: 'Departmental Score Moderation & Broadsheet Compilation',
    description: 'Faculty board review, external examiners audit, and compilation of cumulative sessional GPAs.',
    category: 'SENATE',
    status: 'UPCOMING',
    unit: 'Faculty Examination Boards',
    order: 21,
  },
  {
    week: 'Senate',
    dateRange: 'Jul 28',
    title: 'Senate Approval of Sessional Results & Graduating Class',
    description: 'University Senate approval of sessional broadsheets, degree classifications, probation list, and graduation clearance.',
    category: 'SENATE',
    status: 'UPCOMING',
    unit: 'University Senate',
    order: 22,
  },
  {
    week: 'Recess',
    dateRange: 'Aug 01',
    title: 'End of Academic Session & Sessional Recess',
    description: 'Official closure of academic session; long vacation commences pending registry announcement of new session.',
    category: 'ACADEMIC',
    status: 'UPCOMING',
    unit: 'Academic Registry',
    order: 23,
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const semesterId = searchParams.get('semesterId');

    const where: any = {};
    if (sessionId) where.sessionId = sessionId;
    if (semesterId) where.semesterId = semesterId;

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        session: true,
        semester: true,
      },
    });

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Calendar GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar events.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole('ADMIN');
    const body = await req.json();

    // 1. Scaffolding default calendar template for a session (Both Semesters or Target Semester)
    if (body.action === 'GENERATE_SESSION_TEMPLATE') {
      const { sessionId, sessionName, targetSemester = 'BOTH' } = body;
      if (!sessionId) {
        return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 });
      }

      const session = await prisma.academicSession.findUnique({
        where: { id: sessionId },
        include: { semesters: true },
      });

      if (!session) {
        return NextResponse.json({ error: 'Academic session not found.' }, { status: 404 });
      }

      const firstSemester = session.semesters.find((s) => s.name === 'FIRST') || session.semesters[0];
      const secondSemester = session.semesters.find((s) => s.name === 'SECOND') || session.semesters[1];

      // If generating both, clear all existing events for session. If targeting one semester, clear that semester only.
      if (targetSemester === 'BOTH') {
        await prisma.calendarEvent.deleteMany({ where: { sessionId } });
      } else if (targetSemester === 'FIRST' && firstSemester) {
        await prisma.calendarEvent.deleteMany({ where: { sessionId, semesterId: firstSemester.id } });
      } else if (targetSemester === 'SECOND' && secondSemester) {
        await prisma.calendarEvent.deleteMany({ where: { sessionId, semesterId: secondSemester.id } });
      }

      // Extract year if available (e.g., "2024/2025" -> 2024 & 2025)
      const yearMatch = (sessionName || session.name).match(/(\d{4})\/(\d{4})/);
      const startYear = yearMatch ? yearMatch[1] : '2024';
      const endYear = yearMatch ? yearMatch[2] : '2025';

      const eventsToCreate: any[] = [];

      // 1. First Semester Milestones
      if ((targetSemester === 'BOTH' || targetSemester === 'FIRST') && firstSemester) {
        FIRST_SEMESTER_MILESTONES.forEach((m) => {
          let dateRangeWithYear = m.dateRange;
          if (m.dateRange.includes('Oct') || m.dateRange.includes('Nov') || m.dateRange.includes('Dec')) {
            dateRangeWithYear = `${m.dateRange}, ${startYear}`;
          } else {
            dateRangeWithYear = `${m.dateRange}, ${endYear}`;
          }

          eventsToCreate.push({
            sessionId,
            semesterId: firstSemester.id,
            week: m.week,
            dateRange: dateRangeWithYear,
            title: m.title,
            description: m.description,
            category: m.category,
            status: m.status,
            unit: m.unit,
            order: m.order,
          });
        });
      }

      // 2. Second Semester Milestones
      if ((targetSemester === 'BOTH' || targetSemester === 'SECOND') && secondSemester) {
        SECOND_SEMESTER_MILESTONES.forEach((m) => {
          const dateRangeWithYear = `${m.dateRange}, ${endYear}`;
          eventsToCreate.push({
            sessionId,
            semesterId: secondSemester.id,
            week: m.week,
            dateRange: dateRangeWithYear,
            title: m.title,
            description: m.description,
            category: m.category,
            status: m.status,
            unit: m.unit,
            order: m.order,
          });
        });
      }

      for (const data of eventsToCreate) {
        await prisma.calendarEvent.create({ data });
      }

      return NextResponse.json({
        success: true,
        message: `Scaffolded ${eventsToCreate.length} calendar milestones across First and Second semesters for ${session.name}.`,
      });
    }

    // 2. Create single new event
    const {
      sessionId,
      semesterId,
      week,
      dateRange,
      title,
      description,
      category,
      status,
      unit,
      order,
    } = body;

    if (!sessionId || !title || !dateRange || !week) {
      return NextResponse.json(
        { error: 'Session ID, Title, Date Range, and Week are required.' },
        { status: 400 }
      );
    }

    const highestOrder = await prisma.calendarEvent.aggregate({
      where: { sessionId },
      _max: { order: true },
    });

    const newOrder = typeof order === 'number' ? order : (highestOrder._max.order ?? 0) + 1;

    const event = await prisma.calendarEvent.create({
      data: {
        sessionId,
        semesterId: semesterId || null,
        week,
        dateRange,
        title,
        description: description || '',
        category: category || 'ACADEMIC',
        status: status || 'UPCOMING',
        unit: unit || 'Academic Registry',
        order: newOrder,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Calendar POST error:', error);
    return NextResponse.json({ error: 'Failed to create calendar event.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole('ADMIN');
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required.' }, { status: 400 });
    }

    const updated = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.dateRange !== undefined && { dateRange: data.dateRange }),
        ...(data.week !== undefined && { week: data.week }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.order !== undefined && { order: parseInt(data.order, 10) }),
        ...(data.semesterId !== undefined && { semesterId: data.semesterId || null }),
      },
    });

    return NextResponse.json({ success: true, event: updated });
  } catch (error) {
    console.error('Calendar PUT error:', error);
    return NextResponse.json({ error: 'Failed to update calendar event.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole('ADMIN');
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required.' }, { status: 400 });
    }

    await prisma.calendarEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Calendar event removed.' });
  } catch (error) {
    console.error('Calendar DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete calendar event.' }, { status: 500 });
  }
}
