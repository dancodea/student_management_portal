import Link from 'next/link';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import {
  calculateSemesterGpa,
  getDegreeClass,
  getGradeBadgeColor,
} from '@/lib/academic';
import {
  BookOpen,
  Printer,
  Clock,
} from 'lucide-react';

export default async function StudentResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string; semesterId?: string }>;
}) {
  const session = await requireRole('STUDENT');
  const params = await searchParams;

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
        Student record not found.
      </div>
    );
  }

  // Fetch available sessions & semesters for the filter
  const sessions = await prisma.academicSession.findMany({
    include: { semesters: true },
    orderBy: { name: 'desc' },
  });

  const selectedSessionId =
    params.sessionId || sessions.find((s) => s.isCurrent)?.id || sessions[0]?.id;
  const currentSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  const selectedSemesterId =
    params.semesterId ||
    currentSession?.semesters.find((sem) => sem.isCurrent)?.id ||
    currentSession?.semesters[0]?.id;

  const currentSemester = currentSession?.semesters.find(
    (sem) => sem.id === selectedSemesterId
  );

  // Fetch course registrations and scores for selected session/semester
  const registrations =
    currentSession && currentSemester
      ? await prisma.courseRegistration.findMany({
          where: {
            studentId: student.id,
            sessionId: currentSession.id,
            semesterId: currentSemester.id,
          },
          include: {
            course: true,
            score: true,
          },
          orderBy: { course: { code: 'asc' } },
        })
      : [];

  const isPublished = currentSemester?.resultsPublished ?? false;

  // Calculate Semester GPA
  const coursesInput = registrations
    .filter((r) => r.score !== null)
    .map((r) => ({
      unit: r.course.unit,
      gradePoint: r.score!.gradePoint,
    }));

  const semesterGpaData = calculateSemesterGpa(coursesInput);

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

  return (
    <div className="space-y-8 pb-16">
      {/* ─────────────────────────────────────────────────────────────
          1. OPEN HEADER (No card container, sits directly on canvas)
          ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono text-univ-800 font-semibold uppercase tracking-wider">
              Senate Approved Academic Records
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-[11px] font-mono text-slate-500">
              5.0 CGPA Scale
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
            Statement of Examination Results
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {student.fullName} &bull;{' '}
            <span className="font-mono font-semibold text-slate-800">
              {student.matricNo}
            </span>{' '}
            &bull; {student.department.name}
          </p>
        </div>

        <Link
          href={`/student/print-result?sessionId=${selectedSessionId}&semesterId=${selectedSemesterId}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-univ-900 hover:bg-univ-800 text-white rounded-lg text-xs font-semibold transition"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Official Result Slip</span>
        </Link>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. ACADEMIC TERM SELECTOR (Clean open segmented filter)
          ───────────────────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 pb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono mr-2">
          Academic Term:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {sessions.map((sess) =>
            sess.semesters.map((sem) => {
              const isSelected =
                sess.id === selectedSessionId && sem.id === selectedSemesterId;
              return (
                <Link
                  key={`${sess.id}-${sem.id}`}
                  href={`/student/results?sessionId=${sess.id}&semesterId=${sem.id}`}
                  className={`text-xs px-3 py-1.5 rounded-md transition font-mono ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium'
                  }`}
                >
                  {sess.name} ({sem.name} Sem)
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* Results Published Check */}
      {!isPublished ? (
        <div className="border-l-4 border-amber-600 bg-amber-50/70 p-6 rounded-r-lg space-y-1 text-amber-950">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Results Pending Senate Publication</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed max-w-xl">
            Examination grades for {currentSession?.name} ({currentSemester?.name} Semester) are currently undergoing Departmental board moderation and have not yet been released for public viewing.
          </p>
        </div>
      ) : (
        <>
          {/* ─────────────────────────────────────────────────────────────
              3. PERFORMANCE METRICS: Horizontal Compact Strip
              ───────────────────────────────────────────────────────────── */}
          <section className="border-b border-slate-200 pb-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-slate-200/80">
            <div className="md:px-6 first:pl-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block font-mono">
                Units Registered
              </span>
              <div className="text-2xl font-bold font-mono tracking-tight text-slate-950 mt-1">
                {semesterGpaData.totalUnitsRegistered}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Enrolled courses</p>
            </div>

            <div className="md:px-6">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block font-mono">
                Units Passed
              </span>
              <div className="text-2xl font-bold font-mono tracking-tight text-emerald-700 mt-1">
                {semesterGpaData.totalUnitsPassed}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Grade A to E</p>
            </div>

            <div className="md:px-6">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block font-mono">
                Semester GPA
              </span>
              <div className="text-2xl font-bold font-mono tracking-tight text-univ-800 mt-1">
                {semesterGpaData.gpa.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Weighted on 5.0</p>
            </div>

            <div className="md:px-6 last:pr-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block font-mono">
                Cumulative CGPA
              </span>
              <div className="text-2xl font-bold font-mono tracking-tight text-amber-700 mt-1">
                {cumulativeData.gpa.toFixed(2)}
              </div>
              <p className="text-[11px] text-amber-700 font-medium truncate mt-0.5">
                {degreeClass}
              </p>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────
              4. RESULTS BREAKDOWN TABLE (Directly on canvas)
              ───────────────────────────────────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-sm font-bold text-slate-950 uppercase font-mono tracking-tight">
                Course Breakdown ({currentSession?.name} &bull; {currentSemester?.name} Semester)
              </h2>
              <span className="text-xs font-mono font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                Class: {degreeClass}
              </span>
            </div>

            {registrations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 border-t border-b border-slate-200">
                  <thead className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px] font-mono">
                    <tr>
                      <th className="py-3 pr-4">Course Code</th>
                      <th className="py-3 px-4">Course Title</th>
                      <th className="py-3 px-4 text-center">Units</th>
                      <th className="py-3 px-4 text-center">CA (40)</th>
                      <th className="py-3 px-4 text-center">Exam (60)</th>
                      <th className="py-3 px-4 text-center">Total (100)</th>
                      <th className="py-3 px-4 text-center">Grade</th>
                      <th className="py-3 px-4 text-center">Points</th>
                      <th className="py-3 pl-4 text-right">Weighted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {registrations.map((reg) => {
                      const score = reg.score;
                      const weighted = score ? reg.course.unit * score.gradePoint : 0;
                      return (
                        <tr key={reg.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 pr-4 font-mono font-semibold text-univ-900">
                            {reg.course.code}
                          </td>
                          <td className="py-3.5 px-4 text-slate-900 font-medium">
                            {reg.course.title}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                            {reg.course.unit}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                            {score ? score.caScore : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                            {score ? score.examScore : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-900">
                            {score ? score.totalScore : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {score ? (
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getGradeBadgeColor(
                                  score.grade
                                )}`}
                              >
                                {score.grade}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                Ungraded
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-medium">
                            {score ? score.gradePoint : '—'}
                          </td>
                          <td className="py-3.5 pl-4 text-right font-mono font-bold text-slate-900">
                            {score ? weighted : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t border-slate-200 text-xs font-semibold text-slate-900">
                    <tr>
                      <td colSpan={2} className="py-3.5 pr-4 text-right font-mono text-slate-500 uppercase text-[10px]">
                        Totals:
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-950">
                        {semesterGpaData.totalUnitsRegistered} Units
                      </td>
                      <td colSpan={5} className="py-3.5 px-4 text-right text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                        Total Weighted Grade Points:
                      </td>
                      <td className="py-3.5 pl-4 text-right font-mono font-bold text-univ-900 text-sm">
                        {semesterGpaData.totalWeightedPoints}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
                <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium">No results recorded for this session and semester.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
