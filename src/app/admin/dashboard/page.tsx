import Link from 'next/link';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import {
  Users,
  BookOpen,
  FileSpreadsheet,
  Award,
  Calendar,
  History,
  Building,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  await requireRole('ADMIN');

  const [
    totalStudents,
    totalDepartments,
    totalCourses,
    totalScores,
    activeSession,
    activityLogs,
    departments,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.department.count(),
    prisma.course.count(),
    prisma.score.count(),
    prisma.academicSession.findFirst({
      where: { isCurrent: true },
      include: { semesters: { where: { isCurrent: true } } },
    }),
    prisma.activityLog.findMany({ take: 8, orderBy: { timestamp: 'desc' } }),
    prisma.department.findMany({ include: { students: true, courses: true } }),
  ]);

  const activeSemester = activeSession?.semesters[0];

  return (
    <div className="space-y-12 pb-16">

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-7 border-b border-slate-200">
        <div>
          <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-univ-700 mb-1">
            {activeSession?.name ?? '—'} &bull; {activeSemester?.name ?? '—'} Semester
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
            School Operations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Federal University of Technology, Minna &bull; Academic Registry &amp; Records
          </p>
        </div>
        <Link
          href="/admin/sessions"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition shrink-0"
        >
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          Manage Session
        </Link>
      </section>

      {/* ── KPI METRICS (horizontal divider-separated row) ───────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
        {[
          {
            label: 'Total Students',
            value: totalStudents,
            sub: 'Undergraduate profiles',
            icon: Users,
            color: 'text-univ-700',
          },
          {
            label: 'Departments',
            value: totalDepartments,
            sub: 'Academic programs',
            icon: Building,
            color: 'text-blue-600',
          },
          {
            label: 'Available Courses',
            value: totalCourses,
            sub: '100L – 500L curriculum',
            icon: BookOpen,
            color: 'text-sky-600',
          },
          {
            label: 'Graded Entries',
            value: totalScores,
            sub: 'Computed scores in DB',
            icon: FileSpreadsheet,
            color: 'text-amber-600',
          },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="px-6 py-5 flex flex-col gap-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                {label}
              </span>
              <Icon className={`w-4 h-4 ${color} opacity-70`} />
            </div>
            <span className={`text-3xl font-bold font-mono tracking-tight ${color}`}>
              {value}
            </span>
            <span className="text-[11px] text-slate-500">{sub}</span>
          </div>
        ))}
      </section>

      {/* ── PORTAL STATUS STRIP ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-950">
              Session &amp; Portal Status
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live operational flags for the student-facing portal
            </p>
          </div>
          <Link
            href="/admin/sessions"
            className="text-xs font-semibold text-univ-700 hover:text-univ-900 flex items-center gap-1 transition"
          >
            Modify <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
          {/* Cell 1 */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Current Session
            </p>
            <p className="text-base font-bold text-slate-900">
              {activeSession?.name ?? '—'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Approved academic calendar</p>
          </div>

          {/* Cell 2 */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Active Term
            </p>
            <p className="text-base font-bold text-slate-900">
              {activeSemester?.name ?? '—'} Semester
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Undergraduate lectures &amp; exams</p>
          </div>

          {/* Cell 3 */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Course Registration
            </p>
            {activeSemester?.registrationOpen ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                <Unlock className="w-3.5 h-3.5" /> Open
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                <Lock className="w-3.5 h-3.5" /> Locked
              </span>
            )}
            <p className="text-[11px] text-slate-500 mt-1.5">
              {activeSemester?.registrationOpen ? 'Students can enroll courses' : 'Enrollment window closed'}
            </p>
          </div>

          {/* Cell 4 */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Results Release
            </p>
            {activeSemester?.resultsPublished ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
                <Eye className="w-3.5 h-3.5" /> Published
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                <EyeOff className="w-3.5 h-3.5" /> Draft
              </span>
            )}
            <p className="text-[11px] text-slate-500 mt-1.5">
              {activeSemester?.resultsPublished ? 'Visible on student slips' : 'Hidden pending moderation'}
            </p>
          </div>
        </div>
      </section>

      {/* ── QUICK ACTIONS ────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold tracking-tight text-slate-950">
          Administrative Actions
        </h2>

        <div className="divide-y divide-slate-100 border-t border-b border-slate-200">
          {[
            {
              href: '/admin/scores',
              icon: FileSpreadsheet,
              iconBg: 'bg-univ-50 text-univ-800',
              title: 'Enter Course Scores',
              desc: 'Grade registered students by course (CA & Exam) or upload CSV rosters.',
            },
            {
              href: '/admin/broadsheet',
              icon: Award,
              iconBg: 'bg-amber-50 text-amber-700',
              title: 'Class Broadsheet',
              desc: 'View departmental results, student rankings and export reports.',
            },
            {
              href: '/admin/students',
              icon: Users,
              iconBg: 'bg-blue-50 text-blue-700',
              title: 'Student Directory',
              desc: 'Browse enrolled students, academic records and passport photographs.',
            },
            {
              href: '/admin/sessions',
              icon: Calendar,
              iconBg: 'bg-slate-100 text-slate-600',
              title: 'Manage Academic Terms',
              desc: 'Configure session calendars, registration windows and results publishing.',
            },
          ].map(({ href, icon: Icon, iconBg, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 py-4 hover:bg-slate-50/60 -mx-4 px-4 transition-colors"
            >
              <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 group-hover:text-univ-800 transition-colors">
                  {title}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-univ-600 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── BOTTOM SPLIT: DEPARTMENTS + ACTIVITY ──────────────────────── */}
      <div className="grid lg:grid-cols-12 gap-10">

        {/* Departmental Distribution */}
        <section className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-950">
                Departmental Distribution
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Student count &amp; curriculum catalog by department
              </p>
            </div>
            <Link
              href="/admin/students"
              className="text-xs font-semibold text-univ-700 hover:text-univ-900 flex items-center gap-1 transition"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-t border-b border-slate-200">
              <thead className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px] font-mono">
                <tr>
                  <th className="py-3 pr-4">Department</th>
                  <th className="py-3 px-4 text-center">Code</th>
                  <th className="py-3 px-4 text-center">Courses</th>
                  <th className="py-3 pl-4 text-right">Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 pr-4 font-semibold text-slate-900">{d.name}</td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">{d.code}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                      {d.courses.length}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-univ-50 text-univ-800 border border-univ-100">
                        {d.students.length}
                      </span>
                    </td>
                  </tr>
                ))}
                {departments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                      No departments configured.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="border-t border-slate-200">
                <tr>
                  <td className="py-3 pr-4 text-[11px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
                    Total
                  </td>
                  <td />
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                    {totalCourses}
                  </td>
                  <td className="py-3 pl-4 text-right font-mono font-bold text-slate-900">
                    {totalStudents}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Activity Trail */}
        <section className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-950 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                Audit &amp; Activity Trail
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">Security Log</p>
            </div>
          </div>

          {activityLogs.length > 0 ? (
            <div className="divide-y divide-slate-100 border-t border-b border-slate-200">
              {activityLogs.map((log) => (
                <div key={log.id} className="py-3.5 hover:bg-slate-50/50 -mx-1 px-1 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{log.details}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs border-t border-slate-200">
              No recent administrative activity recorded.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
