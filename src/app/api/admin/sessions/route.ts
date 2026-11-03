import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

const FIRST_SEMESTER_MILESTONES = [
  { week: 'Week 1', dateRange: 'Oct 14 – Oct 19', title: 'Course Registration Portal Opens', description: 'Online enrolment commences for fresh and returning undergraduates across all faculties.', category: 'REGISTRATION', status: 'IN_PROGRESS', unit: 'ICT Directorate', order: 1 },
  { week: 'Week 2', dateRange: 'Oct 21', title: 'Commencement of First Semester Lectures', description: 'Official resumption of academic teaching, distribution of course outlines and departmental timetables.', category: 'ACADEMIC', status: 'UPCOMING', unit: 'All Faculties', order: 2 },
  { week: 'Week 4', dateRange: 'Nov 08', title: 'Late Course Registration Commences', description: 'Standard registration window closes; late registration opens with administrative surcharge fine.', category: 'REGISTRATION', status: 'UPCOMING', unit: 'Academic Registry', order: 3 },
  { week: 'Week 5', dateRange: 'Nov 15', title: 'Final Close of Add/Drop Window', description: 'Strict deadline for adding or dropping enrolled courses; maximum allowable credit cap locked at 24 units.', category: 'REGISTRATION', status: 'UPCOMING', unit: 'Registry Academic Office', order: 4 },
  { week: 'Week 7', dateRange: 'Nov 27', title: 'University Matriculation Ceremony', description: 'Official matriculation for 100-level and Direct Entry undergraduates at Convocation Square.', category: 'ACADEMIC', status: 'UPCOMING', unit: "Vice Chancellor's Office", order: 5 },
  { week: 'Week 9', dateRange: 'Dec 09 – Dec 14', title: 'Continuous Assessment (CA) Phase 1', description: 'First continuous assessment test period administering initial 20% coursework scores.', category: 'ASSESSMENT', status: 'UPCOMING', unit: 'Departmental Examiners', order: 6 },
  { week: 'Mid-Term', dateRange: 'Dec 23 – Jan 03', title: 'Mid-Semester & End of Year Recess', description: 'University-wide academic break; lectures, laboratories and examinations suspended.', category: 'ACADEMIC', status: 'UPCOMING', unit: 'University Registry', order: 7 },
  { week: 'Week 11–12', dateRange: 'Jan 06 – Jan 17', title: 'Lecture Resumption & CA Phase 2', description: 'Resumption of coursework teaching and completion of final continuous assessment tests (20%).', category: 'ASSESSMENT', status: 'UPCOMING', unit: 'Academic Departments', order: 8 },
  { week: 'Week 13', dateRange: 'Jan 20 – Jan 24', title: 'Revision Week & CA Scores Audit', description: 'Final lectures concluded; release of verified continuous assessment marks (40%) on portal.', category: 'ACADEMIC', status: 'UPCOMING', unit: 'Directorate of Exams', order: 9 },
  { week: 'Week 14–16', dateRange: 'Jan 27 – Feb 15', title: 'First Semester Final Examinations', description: 'Official university-wide examinations administering final 60% semester papers.', category: 'EXAMINATION', status: 'UPCOMING', unit: 'Central Examination Committee', order: 10 },
  { week: 'Post-Exam', dateRange: 'Feb 17 – Feb 28', title: 'Departmental Score Moderation', description: 'Internal vetting, scoring computation and departmental board review of raw examination scripts.', category: 'SENATE', status: 'UPCOMING', unit: 'Faculty Examination Boards', order: 11 },
  { week: 'Senate', dateRange: 'Mar 10', title: 'Senate Approval & Results Release', description: 'University Senate ratification of official broadsheets; release of verified GPA to student accounts.', category: 'SENATE', status: 'UPCOMING', unit: 'University Senate', order: 12 },
];

const SECOND_SEMESTER_MILESTONES = [
  { week: 'Week 1', dateRange: 'Mar 24', title: 'Commencement of Second Semester Lectures', description: 'Resumption of academic teaching, distribution of second semester course materials, laboratories, and lecture timetables.', category: 'ACADEMIC', status: 'UPCOMING', unit: 'All Faculties', order: 13 },
  { week: 'Week 2', dateRange: 'Mar 31 – Apr 05', title: 'Second Semester Course Verification & Add/Drop Window', description: 'Window for students to adjust second semester elective courses and verify registered modules on the portal.', category: 'REGISTRATION', status: 'UPCOMING', unit: 'ICT Directorate', order: 14 },
  { week: 'Week 4', dateRange: 'Apr 14 – Apr 19', title: "Students' Union Week & Cultural Carnival", description: 'Annual university cultural carnival, intellectual debates, and inter-faculty sporting fiesta.', category: 'ACADEMIC', status: 'UPCOMING', unit: 'Student Affairs Division', order: 15 },
  { week: 'Week 6', dateRange: 'Apr 28 – May 03', title: 'Continuous Assessment (CA) Phase 1', description: 'First continuous assessment test period administering initial 20% coursework evaluation for second semester.', category: 'ASSESSMENT', status: 'UPCOMING', unit: 'Departmental Examiners', order: 16 },
  { week: 'Mid-Term', dateRange: 'May 12 – May 16', title: 'Mid-Semester Break', description: 'Brief academic break for undergraduates; administrative and research activities remain ongoing.', category: 'ACADEMIC', status: 'UPCOMING', unit: 'University Registry', order: 17 },
  { week: 'Week 9–10', dateRange: 'May 19 – May 30', title: 'Lecture Resumption & CA Phase 2', description: 'Final phase of lectures and completion of mid-term assignments, tests, and laboratory assessments (20%).', category: 'ASSESSMENT', status: 'UPCOMING', unit: 'Academic Departments', order: 18 },
  { week: 'Week 12', dateRange: 'Jun 09 – Jun 13', title: 'Revision Week & Practical Examinations', description: 'Conclusion of lectures, project submissions, studio defences, and verification of CA marks on portal.', category: 'ACADEMIC', status: 'UPCOMING', unit: 'Directorate of Exams', order: 19 },
  { week: 'Week 13–15', dateRange: 'Jun 16 – Jul 05', title: 'Second Semester Final Examinations', description: 'Official university-wide examinations for graduating and non-graduating students across all faculties.', category: 'EXAMINATION', status: 'UPCOMING', unit: 'Central Examination Committee', order: 20 },
  { week: 'Post-Exam', dateRange: 'Jul 07 – Jul 18', title: 'Departmental Score Moderation & Broadsheet Compilation', description: 'Faculty board review, external examiners audit, and compilation of cumulative sessional GPAs.', category: 'SENATE', status: 'UPCOMING', unit: 'Faculty Examination Boards', order: 21 },
  { week: 'Senate', dateRange: 'Jul 28', title: 'Senate Approval of Sessional Results & Graduating Class', description: 'University Senate approval of sessional broadsheets, degree classifications, probation list, and graduation clearance.', category: 'SENATE', status: 'UPCOMING', unit: 'University Senate', order: 22 },
  { week: 'Recess', dateRange: 'Aug 01', title: 'End of Academic Session & Sessional Recess', description: 'Official closure of academic session; long vacation commences pending registry announcement of new session.', category: 'ACADEMIC', status: 'UPCOMING', unit: 'Academic Registry', order: 23 },
];

export async function GET() {
  try {
    await requireRole('ADMIN');

    const rawSessions = await prisma.academicSession.findMany({
      include: {
        semesters: {
          include: {
            _count: {
              select: { registrations: true, calendarEvents: true },
            },
          },
          orderBy: { name: 'asc' },
        },
        calendarEvents: {
          include: { semester: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { name: 'desc' },
    });

    // Compute status, milestone stats & completion gate for each session and semester
    const sessions = rawSessions.map((sess) => {
      const totalEvents = sess.calendarEvents.length;
      const completedEvents = sess.calendarEvents.filter((e) => e.status === 'COMPLETED').length;
      const inProgressEvents = sess.calendarEvents.filter((e) => e.status === 'IN_PROGRESS').length;
      const upcomingEvents = sess.calendarEvents.filter((e) => e.status === 'UPCOMING').length;

      const pendingEvents = sess.calendarEvents
        .filter((e) => e.status !== 'COMPLETED')
        .map((e) => ({
          id: e.id,
          week: e.week,
          title: e.title,
          status: e.status,
          dateRange: e.dateRange,
          semesterName: e.semester?.name || 'General',
        }));

      const isAllCompleted = totalEvents > 0 ? completedEvents === totalEvents : true;
      const completionPercentage = totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 100;

      return {
        id: sess.id,
        name: sess.name,
        isCurrent: sess.isCurrent,
        registrationsCount: sess._count.registrations,
        isRegistrationOpen: sess.semesters.some((sem) => sem.registrationOpen),
        semesters: sess.semesters.map((sem) => {
          const semEvents = sess.calendarEvents.filter((e) => e.semesterId === sem.id);
          const semTotal = semEvents.length;
          const semCompleted = semEvents.filter((e) => e.status === 'COMPLETED').length;
          const semPending = semEvents.filter((e) => e.status !== 'COMPLETED');

          return {
            id: sem.id,
            name: sem.name,
            isCurrent: sem.isCurrent,
            registrationOpen: sem.registrationOpen,
            resultsPublished: sem.resultsPublished,
            registrationsCount: sem._count.registrations,
            calendarEventsCount: sem._count.calendarEvents,
            milestoneStats: {
              total: semTotal,
              completed: semCompleted,
              inProgress: semEvents.filter((e) => e.status === 'IN_PROGRESS').length,
              upcoming: semEvents.filter((e) => e.status === 'UPCOMING').length,
              isAllCompleted: semTotal > 0 ? semCompleted === semTotal : true,
              completionPercentage: semTotal > 0 ? Math.round((semCompleted / semTotal) * 100) : 100,
              pendingEvents: semPending.map((e) => ({
                id: e.id,
                week: e.week,
                title: e.title,
                status: e.status,
                dateRange: e.dateRange,
                semesterName: sem.name,
              })),
            },
          };
        }),
        calendarEvents: sess.calendarEvents,
        milestoneStats: {
          total: totalEvents,
          completed: completedEvents,
          inProgress: inProgressEvents,
          upcoming: upcomingEvents,
          pendingEvents,
          isAllCompleted,
          completionPercentage,
        },
      };
    });

    return NextResponse.json({ success: true, sessions });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHORIZED' ? 401 : 403 });
    }
    console.error('Admin sessions GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve academic sessions.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN');
    const body = await req.json();
    const { action, sessionId, semesterId, value, name, force, scaffoldCalendar } = body;

    // 1. CREATE NEW SESSION (With two semesters inside it)
    if (action === 'CREATE_SESSION') {
      const cleanName = (name || '').trim();
      if (!cleanName) {
        return NextResponse.json({ error: 'Session name is required (e.g. 2025/2026).' }, { status: 400 });
      }

      const existing = await prisma.academicSession.findUnique({
        where: { name: cleanName },
      });
      if (existing) {
        return NextResponse.json({ error: `Session "${cleanName}" already exists.` }, { status: 400 });
      }

      const newSession = await prisma.academicSession.create({
        data: {
          name: cleanName,
          isCurrent: false,
          semesters: {
            create: [
              { name: 'FIRST', isCurrent: false, registrationOpen: true, resultsPublished: false },
              { name: 'SECOND', isCurrent: false, registrationOpen: false, resultsPublished: false },
            ],
          },
        },
        include: { semesters: true },
      });

      // Optionally scaffold calendar events for both semesters
      if (scaffoldCalendar) {
        const firstSem = newSession.semesters.find((s) => s.name === 'FIRST') || newSession.semesters[0];
        const secondSem = newSession.semesters.find((s) => s.name === 'SECOND') || newSession.semesters[1];
        const yearMatch = cleanName.match(/(\d{4})\/(\d{4})/);
        const startYear = yearMatch ? yearMatch[1] : '2025';
        const endYear = yearMatch ? yearMatch[2] : '2026';

        // 1. First Semester Milestones
        if (firstSem) {
          for (const m of FIRST_SEMESTER_MILESTONES) {
            const dateWithYear =
              m.dateRange.includes('Oct') || m.dateRange.includes('Nov') || m.dateRange.includes('Dec')
                ? `${m.dateRange}, ${startYear}`
                : `${m.dateRange}, ${endYear}`;

            await prisma.calendarEvent.create({
              data: {
                sessionId: newSession.id,
                semesterId: firstSem.id,
                week: m.week,
                dateRange: dateWithYear,
                title: m.title,
                description: m.description,
                category: m.category,
                status: m.status,
                unit: m.unit,
                order: m.order,
              },
            });
          }
        }

        // 2. Second Semester Milestones
        if (secondSem) {
          for (const m of SECOND_SEMESTER_MILESTONES) {
            const dateWithYear = `${m.dateRange}, ${endYear}`;
            await prisma.calendarEvent.create({
              data: {
                sessionId: newSession.id,
                semesterId: secondSem.id,
                week: m.week,
                dateRange: dateWithYear,
                title: m.title,
                description: m.description,
                category: m.category,
                status: m.status,
                unit: m.unit,
                order: m.order,
              },
            });
          }
        }
      }

      await prisma.activityLog.create({
        data: {
          adminId: session.userId,
          action: 'CREATE_SESSION',
          details: `Created new academic session ${cleanName} with 2 semesters.`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Academic Session ${cleanName} created with First and Second semesters.`,
        session: newSession,
      });
    }

    // 2. UPDATE SESSION NAME
    if (action === 'UPDATE_SESSION') {
      const cleanName = (name || '').trim();
      if (!sessionId || !cleanName) {
        return NextResponse.json({ error: 'Session ID and new name are required.' }, { status: 400 });
      }

      const updated = await prisma.academicSession.update({
        where: { id: sessionId },
        data: { name: cleanName },
      });

      await prisma.activityLog.create({
        data: {
          adminId: session.userId,
          action: 'UPDATE_SESSION',
          details: `Renamed academic session ${sessionId} to ${cleanName}`,
        },
      });

      return NextResponse.json({ success: true, message: `Session renamed to ${cleanName}.`, session: updated });
    }

    // 3. TOGGLE COURSE REGISTRATION (Unified at Session level for both semesters)
    if (action === 'TOGGLE_REGISTRATION' || action === 'TOGGLE_SESSION_REGISTRATION') {
      const targetSessionId = sessionId;
      if (targetSessionId) {
        await prisma.semester.updateMany({
          where: { sessionId: targetSessionId },
          data: { registrationOpen: Boolean(value) },
        });

        await prisma.activityLog.create({
          data: {
            adminId: session.userId,
            action: 'TOGGLE_SESSION_REGISTRATION',
            details: `Set course registration window to ${Boolean(value) ? 'OPEN' : 'CLOSED'} for both semesters in session ${targetSessionId}`,
          },
        });

        return NextResponse.json({
          success: true,
          message: `Course registration window ${Boolean(value) ? 'opened' : 'closed'} for the academic session (both semesters).`,
        });
      } else if (semesterId) {
        const sem = await prisma.semester.findUnique({ where: { id: semesterId } });
        if (sem) {
          await prisma.semester.updateMany({
            where: { sessionId: sem.sessionId },
            data: { registrationOpen: Boolean(value) },
          });
        }
        return NextResponse.json({ success: true, message: `Course registration updated.` });
      }
      return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 });
    }

    // 4. TOGGLE RESULTS PUBLISHING
    if (action === 'TOGGLE_RESULTS') {
      const updated = await prisma.semester.update({
        where: { id: semesterId },
        data: { resultsPublished: Boolean(value) },
      });
      await prisma.activityLog.create({
        data: {
          adminId: session.userId,
          action: 'TOGGLE_RESULTS',
          details: `Set resultsPublished to ${Boolean(value)} for semester ${semesterId}`,
        },
      });
      return NextResponse.json({ success: true, semester: updated });
    }

    // 5. SET ACTIVE SEMESTER (WITH CALENDAR COMPLETION GUARD)
    if (action === 'SET_CURRENT_SEMESTER') {
      // Find current active semester
      const activeSem = await prisma.semester.findFirst({
        where: { isCurrent: true },
        include: { session: true },
      });

      // Target semester to activate
      const targetSem = await prisma.semester.findUnique({
        where: { id: semesterId },
      });

      if (!targetSem) {
        return NextResponse.json({ error: 'Target semester not found.' }, { status: 404 });
      }

      // If there is an active semester different from target semester, check calendar completion!
      if (activeSem && activeSem.id !== targetSem.id && !force) {
        // Check calendar events specifically for active semester
        let pendingMilestones = await prisma.calendarEvent.findMany({
          where: {
            sessionId: activeSem.sessionId,
            semesterId: activeSem.id,
            status: { not: 'COMPLETED' },
          },
          orderBy: { order: 'asc' },
        });

        // Fallback: if no events specifically marked with semesterId, check all events for session
        if (pendingMilestones.length === 0) {
          const hasAnySemEvents = await prisma.calendarEvent.count({
            where: { sessionId: activeSem.sessionId, semesterId: activeSem.id },
          });
          if (hasAnySemEvents === 0) {
            pendingMilestones = await prisma.calendarEvent.findMany({
              where: {
                sessionId: activeSem.sessionId,
                status: { not: 'COMPLETED' },
              },
              orderBy: { order: 'asc' },
            });
          }
        }

        if (pendingMilestones.length > 0) {
          const names = pendingMilestones.map((m) => `"${m.title}" (${m.week})`).slice(0, 3).join(', ');
          const moreCount = pendingMilestones.length > 3 ? ` and ${pendingMilestones.length - 3} more` : '';
          return NextResponse.json(
            {
              error: `Cannot conclude ${activeSem.name} Semester: ${pendingMilestones.length} milestone(s) in the ${activeSem.name} Semester calendar are still incomplete (${names}${moreCount}). All ${activeSem.name} Semester calendar events must be marked as COMPLETED before closing the semester.`,
              blocked: true,
              pendingCount: pendingMilestones.length,
              pendingMilestones,
              semesterId: activeSem.id,
            },
            { status: 400 }
          );
        }
      }

      await prisma.$transaction([
        prisma.semester.updateMany({ data: { isCurrent: false } }),
        prisma.semester.update({
          where: { id: semesterId },
          data: { isCurrent: true },
        }),
      ]);

      await prisma.activityLog.create({
        data: {
          adminId: session.userId,
          action: 'SET_CURRENT_SEMESTER',
          details: `Activated semester ${targetSem.name} (id: ${semesterId})`,
        },
      });

      return NextResponse.json({ success: true, message: `Active semester updated to ${targetSem.name} Semester.` });
    }

    // 6. SET ACTIVE SESSION (WITH YEAR-TRANSITION CALENDAR COMPLETION GUARD)
    if (action === 'SET_CURRENT_SESSION') {
      const activeSess = await prisma.academicSession.findFirst({
        where: { isCurrent: true },
        include: { semesters: true },
      });

      const targetSess = await prisma.academicSession.findUnique({
        where: { id: sessionId },
        include: { semesters: true },
      });

      if (!targetSess) {
        return NextResponse.json({ error: 'Target session not found.' }, { status: 404 });
      }

      // Guard: Cannot activate past sessions
      if (activeSess && targetSess.name < activeSess.name) {
        return NextResponse.json(
          {
            error: `Cannot activate historical session ${targetSess.name}. Concluded past sessions are archived and cannot be re-activated.`,
          },
          { status: 400 }
        );
      }

      // If moving from current session to another session, verify all calendar events are complete!
      if (activeSess && activeSess.id !== targetSess.id && !force) {
        const pendingMilestones = await prisma.calendarEvent.findMany({
          where: {
            sessionId: activeSess.id,
            status: { not: 'COMPLETED' },
          },
          orderBy: { order: 'asc' },
        });

        if (pendingMilestones.length > 0) {
          const names = pendingMilestones.map((m) => `"${m.title}"`).slice(0, 3).join(', ');
          const moreCount = pendingMilestones.length > 3 ? ` and ${pendingMilestones.length - 3} more` : '';
          return NextResponse.json(
            {
              error: `Cannot transition to new academic year (${targetSess.name}): ${pendingMilestones.length} milestone(s) in the current ${activeSess.name} session calendar are still incomplete (${names}${moreCount}). The academic year calendar must be 100% completed before advancing to the next year.`,
              blocked: true,
              pendingCount: pendingMilestones.length,
              pendingMilestones,
            },
            { status: 400 }
          );
        }
      }

      await prisma.$transaction([
        prisma.academicSession.updateMany({ data: { isCurrent: false } }),
        prisma.academicSession.update({
          where: { id: sessionId },
          data: { isCurrent: true },
        }),
        prisma.semester.updateMany({ data: { isCurrent: false } }),
        prisma.semester.updateMany({
          where: { sessionId, name: 'FIRST' },
          data: { isCurrent: true },
        }),
      ]);

      await prisma.activityLog.create({
        data: {
          adminId: session.userId,
          action: 'SET_CURRENT_SESSION',
          details: `Activated session ${targetSess.name} (id: ${sessionId})`,
        },
      });

      return NextResponse.json({ success: true, message: `Active academic session updated to ${targetSess.name}.` });
    }

    // 7. COMPLETE ALL CALENDAR MILESTONES IN BATCH
    if (action === 'COMPLETE_ALL_MILESTONES') {
      const { sessionId, semesterId } = body;
      const where: any = {};
      if (sessionId) where.sessionId = sessionId;
      if (semesterId) where.semesterId = semesterId;

      if (!sessionId && !semesterId) {
        return NextResponse.json({ error: 'Session ID or Semester ID is required.' }, { status: 400 });
      }

      const updated = await prisma.calendarEvent.updateMany({
        where,
        data: { status: 'COMPLETED' },
      });

      await prisma.activityLog.create({
        data: {
          adminId: session.userId,
          action: 'COMPLETE_ALL_MILESTONES',
          details: `Marked all ${updated.count} calendar events as COMPLETED (sessionId: ${sessionId}, semesterId: ${semesterId})`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `All ${updated.count} milestones marked as COMPLETED.`,
      });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHORIZED' ? 401 : 403 });
    }
    console.error('Admin sessions POST error:', error);
    return NextResponse.json({ error: 'Failed to update session settings.' }, { status: 500 });
  }
}
