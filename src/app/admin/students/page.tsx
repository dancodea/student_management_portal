import Link from 'next/link';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { Search, User, BookOpen } from 'lucide-react';
import { AddStudentButton, StudentRowActions } from '@/components/admin/StudentManagementActions';

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; dept?: string; level?: string; page?: string }>;
}) {
  await requireRole('ADMIN');
  const params = await searchParams;

  const query = params.q?.trim() || '';
  const selectedDept = params.dept || '';
  const selectedLevel = params.level ? parseInt(params.level, 10) : undefined;
  const pageSize = 20;
  const requestedPage = Math.max(1, parseInt(params.page || '1', 10) || 1);

  const studentWhere = {
    AND: [
      query
        ? { OR: [{ fullName: { contains: query } }, { matricNo: { contains: query } }, { email: { contains: query } }] }
        : {},
      selectedDept ? { departmentId: selectedDept } : {},
      selectedLevel ? { level: selectedLevel } : {},
    ],
  };
  const [departments, totalStudents] = await Promise.all([
    prisma.department.findMany({ include: { faculty: true }, orderBy: { name: 'asc' } }),
    prisma.student.count({ where: studentWhere }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalStudents / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const students = await prisma.student.findMany({
    where: studentWhere,
    include: {
      department: true,
      faculty: true,
      courses: { include: { score: true } },
    },
    orderBy: { fullName: 'asc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  const pageHref = (targetPage: number) => {
    const search = new URLSearchParams();
    if (query) search.set('q', query);
    if (selectedDept) search.set('dept', selectedDept);
    if (params.level) search.set('level', params.level);
    search.set('page', String(targetPage));
    return `/admin/students?${search.toString()}`;
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-univ-700 mb-1">
            Enrolment &amp; Registry Records
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
            Student Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {totalStudents} registered student{totalStudents !== 1 ? 's' : ''} across all departmental programs
          </p>
        </div>
        <AddStudentButton departments={departments} />
      </section>

      {/* ── FILTER BAR ──────────────────────────────────────────────── */}
      <section className="no-print">
        <form method="GET" className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by name, matric number or email..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-univ-700"
            />
          </div>

          <select
            name="dept"
            defaultValue={selectedDept}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-univ-700"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            name="level"
            defaultValue={params.level || ''}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-univ-700"
          >
            <option value="">All Levels</option>
            {[100, 200, 300, 400, 500].map((l) => (
              <option key={l} value={l}>{l} Level</option>
            ))}
          </select>

          <button
            type="submit"
            className="px-5 py-2 bg-univ-900 hover:bg-univ-800 text-white rounded-lg text-xs font-semibold transition"
          >
            Filter
          </button>
        </form>
      </section>
      {/* ── STUDENTS TABLE ──────────────────────────────────────────── */}
      <section>
        {students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-t border-b border-slate-200">
              <thead className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px] font-mono">
                <tr>
                  <th className="py-3 pr-4">Student</th>
                  <th className="py-3 px-4">Matric No</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Level</th>
                  <th className="py-3 px-4 text-center">Courses</th>
                  <th className="py-3 pl-4 text-right">Status</th>
                  <th className="py-3 pl-4 text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-10 rounded-md bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {st.passportUrl ? (
                            <img src={st.passportUrl} alt={st.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{st.fullName}</div>
                          <div className="text-[11px] text-slate-400">{st.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-univ-900">{st.matricNo}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{st.department.name}</div>
                      <div className="text-[10px] text-slate-400">{st.faculty.name}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-600">{st.level}L</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600">
                        <BookOpen className="w-3 h-3 text-univ-600" />
                        {st.courses.length}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide ${
                        st.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {st.status}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 text-right no-print">
                      <StudentRowActions
                        student={{
                          id: st.id,
                          fullName: st.fullName,
                          matricNo: st.matricNo,
                          email: st.email,
                          departmentId: st.departmentId,
                          facultyId: st.facultyId,
                        }}
                        departments={departments}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-slate-200">
                <tr>
                  <td colSpan={4} className="py-3 pr-4 text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                    Total
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                    {students.reduce((s, st) => s + st.courses.length, 0)}
                  </td>
                  <td colSpan={2} className="py-3 pl-4 text-right font-mono font-bold text-slate-900">
                    {students.length} students
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center border-t border-slate-200">
            <User className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs text-slate-400">No students found matching your criteria.</p>
          </div>
        )}
      </section>
      {totalPages > 1 && (
        <nav aria-label="Student pages" className="flex items-center justify-between text-xs text-slate-600">
          <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalStudents)} of {totalStudents} students</span>
          <div className="flex gap-2">
            <Link aria-disabled={page <= 1} className={`rounded border px-3 py-1.5 ${page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'}`} href={pageHref(Math.max(1, page - 1))}>Previous</Link>
            <span className="px-2 py-1.5">Page {page} of {totalPages}</span>
            <Link aria-disabled={page >= totalPages} className={`rounded border px-3 py-1.5 ${page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'}`} href={pageHref(Math.min(totalPages, page + 1))}>Next</Link>
          </div>
        </nav>
      )}
    </div>
  );
}
