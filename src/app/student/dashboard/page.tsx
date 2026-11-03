import Link from 'next/link';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { calculateSemesterGpa, getDegreeClass, getGradeBadgeColor } from '@/lib/academic';
import SemesterAcademicCalendar from '@/components/student/SemesterAcademicCalendar';
import { getMissingStudentProfileFields } from '@/lib/student-profile';
import {
  BookOpen,
  Award,
  CheckCircle2,
  AlertCircle,
  Printer,
  Calendar,
  User,
  ChevronRight,
  Clock,
  ArrowUpRight,
  FileText,
  BadgeCheck,
} from 'lucide-react';

export default async function StudentDashboardPage() {
  const session = await requireRole('STUDENT');

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    include: {
      department: true,
      faculty: true,
    },
  });

  if (!student) {
    return (
      <div className="py-12 text-center text-slate-500 text-sm">
        Student profile record not found.
      </div>
    );
  }

  const missingProfileFields = getMissingStudentProfileFields(student);

  // Active session and semester
  const activeSession = await prisma.academicSession.findFirst({
    where: { isCurrent: true },
    include: {
      semesters: { where: { isCurrent: true } },
    },
  });

  const activeSemester = activeSession?.semesters[0];

  // Fetch student's course registrations for current semester
  const [currentRegistrations, dbCalendarEvents] = await Promise.all([
    activeSession && activeSemester
      ? prisma.courseRegistration.findMany({
          where: {
            studentId: student.id,
            sessionId: activeSession.id,
            semesterId: activeSemester.id,
          },
          include: {
            course: true,
            score: true,
          },
          orderBy: { course: { code: 'asc' } },
        })
      : Promise.resolve([]),
    activeSession
      ? prisma.calendarEvent.findMany({
          where: { sessionId: activeSession.id },
          include: { semester: true },
          orderBy: { order: 'asc' },
        })
      : Promise.resolve([]),
  ]);

  // Calculate GPA for current semester
  const currentCoursesInput = currentRegistrations
    .filter((r) => r.score !== null)
    .map((r) => ({
      unit: r.course.unit,
      gradePoint: r.score!.gradePoint,
    }));

  const currentGpaData = calculateSemesterGpa(currentCoursesInput);

  // Calculate Cumulative CGPA across all recorded scores for student
  const allRegistrations = await prisma.courseRegistration.findMany({
    where: { studentId: student.id },
    include: {
      course: true,
      score: true,
    },
  });

  const allCoursesInput = allRegistrations
    .filter((r) => r.score !== null)
    .map((r) => ({
      unit: r.course.unit,
      gradePoint: r.score!.gradePoint,
    }));

  const cumulativeData = calculateSemesterGpa(allCoursesInput);
  const degreeClass = getDegreeClass(cumulativeData.gpa);

  const totalRegisteredUnits = currentRegistrations.reduce(
    (sum, r) => sum + r.course.unit,
    0
  );

  return (
    <div className="space-y-10 pb-16">
      {/* ─────────────────────────────────────────────────────────────
          1. OPEN PROFILE HEADER (No surrounding card, sits directly on canvas)
          ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Identity & Department */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
              {student.passportUrl ? (
                <img
                  src={student.passportUrl}
                  alt={student.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-slate-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active Student
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-[11px] font-mono text-slate-500 uppercase">
                  {student.level} Level
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
                {student.fullName}
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-1">
                <span className="font-mono font-semibold text-univ-800">
                  {student.matricNo}
                </span>
                <span className="text-slate-300">&bull;</span>
                <span>{student.department.name}</span>
                <span className="text-slate-300 hidden sm:inline">&bull;</span>
                <span className="text-slate-500 hidden sm:inline">
                  {student.faculty.name}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs & Academic Standing */}
          <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-3 pt-2 lg:pt-0">
            <div className="flex items-center gap-2 lg:text-right">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Standing:
              </span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200/60 font-mono">
                {degreeClass}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/student/courses"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-univ-900 hover:bg-univ-800 text-white text-xs font-semibold transition"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Course Registration</span>
              </Link>
              <Link
                href="/student/print-result"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Result Slip</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Academic Session & Registration Status Sub-bar */}
        <div className="pt-3 pb-3 border-y border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono">
              Academic Term:{' '}
              <strong className="text-slate-900 font-semibold">
                {activeSession?.name || '2024/2025'} Session
              </strong>{' '}
              &bull; {activeSemester?.name || 'First'} Semester
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] uppercase tracking-wider font-mono">
              Course Enrollment:
            </span>
            {activeSemester?.registrationOpen ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Window Open
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Window Closed
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. ACADEMIC OVERVIEW: Compact Horizontal Metrics Layout
             (Unified row with subtle vertical dividers, no floating cards)
          ───────────────────────────────────────────────────────────── */}
      <section>
        <div className="border-y border-slate-200 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-slate-200/80">
          {/* Registered Load */}
          <div className="md:px-6 first:pl-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Registered Load
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tracking-tight text-slate-950">
                {totalRegisteredUnits}
              </span>
              <span className="text-xs font-mono text-slate-400">/ 24 Units</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {currentRegistrations.length} courses enrolled this term
            </p>
          </div>

          {/* Semester GPA */}
          <div className="md:px-6">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Semester GPA
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tracking-tight text-univ-800">
                {currentGpaData.gpa.toFixed(2)}
              </span>
              <span className="text-xs font-mono text-slate-400">/ 5.00</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {currentCoursesInput.length} of {currentRegistrations.length} graded
            </p>
          </div>

          {/* Cumulative CGPA */}
          <div className="md:px-6">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Cumulative CGPA
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tracking-tight text-amber-700">
                {cumulativeData.gpa.toFixed(2)}
              </span>
              <span className="text-xs font-mono text-slate-400">/ 5.00</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 truncate">
              {degreeClass}
            </p>
          </div>

          {/* Units Passed */}
          <div className="md:px-6 last:pr-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Units Passed
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tracking-tight text-emerald-700">
                {currentGpaData.totalUnitsPassed}
              </span>
              <span className="text-xs font-mono text-slate-400">Credits</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Grade A through E passed
            </p>
          </div>
        </div>
      </section>

      {/* Profile completion reminder */}
      {missingProfileFields.length > 0 && (
        <div className="flex flex-col items-stretch justify-between gap-3 rounded-r-lg border-l-4 border-amber-600 bg-amber-50/70 p-4 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div className="text-xs leading-relaxed text-amber-900">
              <strong className="font-semibold">Profile details incomplete:</strong> Please add your {missingProfileFields.join(', ')} to your student profile. You can continue using the portal.
            </div>
          </div>
          <Link
            href="/student/profile"
            className="shrink-0 self-start rounded-md bg-amber-800 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-900 sm:self-auto"
          >
            Update Profile &rarr;
          </Link>
        </div>
      )}

      {totalRegisteredUnits === 0 && activeSemester?.registrationOpen && (
        <div className="p-4 border-l-4 border-amber-600 bg-amber-50/70 rounded-r-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="font-semibold">Course Registration Pending:</strong> You have not registered any courses for {activeSession?.name} ({activeSemester?.name} Semester). Minimum allowable credit load is 15 units.
            </div>
          </div>
          <Link
            href="/student/courses"
            className="px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-md text-xs font-semibold shrink-0 transition"
          >
            Register Now &rarr;
          </Link>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. ACADEMIC SERVICES & RECENT ACTIVITY (Open two-column layout)
          ───────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Academic Services (Clean Action Rows) */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-950 uppercase font-mono">
              Academic Services
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official registration, assessment and transcript utilities
            </p>
          </div>

          <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
            {/* Service 1: Course Registration */}
            <Link
              href="/student/courses"
              className="group py-3.5 flex items-center justify-between hover:bg-slate-50/70 px-2 -mx-2 rounded-lg transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 group-hover:bg-univ-50 group-hover:text-univ-700 transition-colors flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 group-hover:text-univ-800 transition-colors">
                    Course Registration &amp; Enrolment
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select departmental courses, manage elective credits (15 - 24 units limit)
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-univ-700 transition-colors shrink-0" />
            </Link>

            {/* Service 2: Examination Results */}
            <Link
              href="/student/results"
              className="group py-3.5 flex items-center justify-between hover:bg-slate-50/70 px-2 -mx-2 rounded-lg transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 group-hover:bg-amber-50 group-hover:text-amber-700 transition-colors flex items-center justify-center shrink-0 mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 group-hover:text-univ-800 transition-colors">
                    Examination Results &amp; Continuous Assessment
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    View continuous assessment tests (40%), semester exams (60%) and Senate grades
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-univ-700 transition-colors shrink-0" />
            </Link>

            {/* Service 3: Profile */}
            <Link
              href="/student/profile"
              className="group py-3.5 flex items-center justify-between hover:bg-slate-50/70 px-2 -mx-2 rounded-lg transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 group-hover:bg-slate-200 group-hover:text-slate-900 transition-colors flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 group-hover:text-univ-800 transition-colors">
                    Profile
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    View and update your personal details, next of kin &amp; documents
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-univ-700 transition-colors shrink-0" />
            </Link>

          </div>
        </div>

        {/* Right: Recent Academic Activity (Minimal Timeline) */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-950 uppercase font-mono">
              Recent Activity
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Registry and departmental milestone log
            </p>
          </div>

          <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
            {/* Timeline item 1 */}
            <div className="relative">
              <span className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-4 ring-white" />
              <div className="text-xs font-semibold text-slate-900">
                {currentRegistrations.length > 0
                  ? `${currentRegistrations.length} Courses Registered for ${activeSession?.name || 'Current Term'}`
                  : 'Enrollment Open for Current Semester'}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Total load: {totalRegisteredUnits} units confirmed by ICT Directorate
              </p>
              <span className="text-[10px] font-mono text-slate-400 block mt-1">
                {activeSession?.name || '2024/2025'} &bull; First Semester
              </span>
            </div>

            {/* Timeline item 2 */}
            <div className="relative">
              <span className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-univ-600 ring-4 ring-white" />
              <div className="text-xs font-semibold text-slate-900">
                Continuous Assessment Grades Recorded
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {currentCoursesInput.length} course results recorded with Semester GPA of {currentGpaData.gpa.toFixed(2)}
              </p>
              <span className="text-[10px] font-mono text-slate-400 block mt-1">
                Departmental Board Moderation
              </span>
            </div>

            {/* Timeline item 3 */}
            <div className="relative">
              <span className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-slate-400 ring-4 ring-white" />
              <div className="text-xs font-semibold text-slate-900">
                Biometric Passport Verified on S3
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Encrypted student image linked to Matriculation No: {student.matricNo}
              </p>
              <span className="text-[10px] font-mono text-slate-400 block mt-1">
                Institutional SSO Security Check
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. SEMESTER ACADEMIC CALENDAR & KEY DATES
             (Replaces enrolled course table with chronological schedule)
          ───────────────────────────────────────────────────────────── */}
      <SemesterAcademicCalendar
        sessionName={activeSession?.name || '2024/2025'}
        semesterName={activeSemester?.name || 'First'}
        events={dbCalendarEvents.length > 0 ? (dbCalendarEvents as any) : undefined}
      />
    </div>
  );
}
