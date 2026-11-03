import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { calculateSemesterGpa, getDegreeClass, ordinalSuffix } from '@/lib/academic';
import { Award, ChevronDown, Search } from 'lucide-react';
import PrintButton from '@/components/admin/PrintButton';

export default async function AdminBroadsheetPage({
  searchParams,
}: {
  searchParams: Promise<{ deptId?: string; level?: string; sessionId?: string; semesterId?: string; page?: string; q?: string }>;
}) {
  await requireRole('ADMIN');
  const params = await searchParams;

  const [departments, sessions] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: 'asc' } }),
    prisma.academicSession.findMany({
      include: { semesters: true },
      orderBy: { name: 'desc' },
    }),
  ]);

  const selectedDeptId = params.deptId || departments[0]?.id;
  const selectedLevel = params.level ? parseInt(params.level, 10) : 300;
  const query = params.q?.trim() || '';
  const pageSize = 20;
  const requestedPage = Math.max(1, parseInt(params.page || '1', 10) || 1);

  const selectedSessionId =
    params.sessionId || sessions.find((s) => s.isCurrent)?.id || sessions[0]?.id;
  const currentSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  const selectedSemesterId =
    params.semesterId ||
    currentSession?.semesters.find((sem) => sem.isCurrent)?.id ||
    currentSession?.semesters[0]?.id;
  const currentSemester = currentSession?.semesters.find((sem) => sem.id === selectedSemesterId);

  // Fetch all curriculum courses for this department, level and semester
  const courses = selectedDeptId
    ? await prisma.course.findMany({
        where: {
          departmentId: selectedDeptId,
          level: selectedLevel,
          semester: currentSemester?.name || 'FIRST',
        },
        orderBy: { code: 'asc' },
      })
    : [];

  // Fetch all students in this department and level
  const students = selectedDeptId
    ? await prisma.student.findMany({
        where: {
          departmentId: selectedDeptId,
          level: selectedLevel,
        },
        include: {
          courses: {
            where: {
              sessionId: selectedSessionId,
              semesterId: selectedSemesterId,
            },
            include: {
              score: true,
              course: true,
            },
          },
        },
        orderBy: { fullName: 'asc' },
      })
    : [];

  // Calculate GPA and compute class ranking
  const studentRows = students.map((st) => {
    const courseMap: Record<string, { total: number; grade: string; points: number; unit: number }> = {};
    const inputForGpa: { unit: number; gradePoint: number }[] = [];

    st.courses.forEach((reg) => {
      if (reg.score) {
        courseMap[reg.courseId] = {
          total: reg.score.totalScore,
          grade: reg.score.grade,
          points: reg.score.gradePoint,
          unit: reg.course.unit,
        };
        inputForGpa.push({ unit: reg.course.unit, gradePoint: reg.score.gradePoint });
      }
    });

    const gpaData = calculateSemesterGpa(inputForGpa);
    return {
      student: st,
      courseMap,
      gpaData,
    };
  });

  // Sort by GPA descending to assign class rankings
  studentRows.sort((a, b) => b.gpaData.gpa - a.gpaData.gpa);

  let currentRank = 1;
  let prevGpa: number | null = null;
  const rankedRows = studentRows.map((row, index) => {
    if (prevGpa !== null && row.gpaData.gpa < prevGpa) {
      currentRank = index + 1;
    }
    prevGpa = row.gpaData.gpa;
    return {
      ...row,
      rank: currentRank,
    };
  });
  const matchingRows = query
    ? rankedRows.filter(({ student }) =>
        student.fullName.toLocaleLowerCase().includes(query.toLocaleLowerCase()) ||
        student.matricNo.toLocaleLowerCase().includes(query.toLocaleLowerCase())
      )
    : rankedRows;
  const totalPages = Math.max(1, Math.ceil(matchingRows.length / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const pageRows = matchingRows.slice((page - 1) * pageSize, page * pageSize);
  const pageHref = (targetPage: number) => {
    const search = new URLSearchParams();
    if (selectedDeptId) search.set('deptId', selectedDeptId);
    search.set('level', String(selectedLevel));
    if (selectedSessionId) search.set('sessionId', selectedSessionId);
    if (selectedSemesterId) search.set('semesterId', selectedSemesterId);
    if (query) search.set('q', query);
    search.set('page', String(targetPage));
    return `/admin/broadsheet?${search.toString()}`;
  };

  const selectedDepartment = departments.find((d) => d.id === selectedDeptId);

  const highestGpa = rankedRows.length > 0 ? rankedRows[0].gpaData.gpa.toFixed(2) : '0.00';
  const averageGpa =
    rankedRows.length > 0
      ? (rankedRows.reduce((acc, r) => acc + r.gpaData.gpa, 0) / rankedRows.length).toFixed(2)
      : '0.00';

  return (
    <div className="space-y-8 pb-16">
      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-univ-700 mb-1">
            Senate &amp; Faculty Examination Records
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
            Class Examination Broadsheet
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {selectedDepartment?.name ?? 'Department'} &bull; {selectedLevel} Level &bull; {currentSession?.name} ({currentSemester?.name} Semester)
          </p>
        </div>

        <PrintButton label="Print Broadsheet" />
      </section>

      {/* ── FILTER CONTROLS ─────────────────────────────────────────────── */}
      <section className="no-print">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
              Department
            </label>
            <div className="relative">
              <select
                name="deptId"
                defaultValue={selectedDeptId}
                className="w-full appearance-none px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-univ-700 pr-8"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
              Academic Level
            </label>
            <div className="relative">
              <select
                name="level"
                defaultValue={String(selectedLevel)}
                className="w-full appearance-none px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-univ-700 pr-8"
              >
                {[100, 200, 300, 400, 500].map((l) => (
                  <option key={l} value={l}>
                    {l} Level
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
              Session
            </label>
            <div className="relative">
              <select
                name="sessionId"
                defaultValue={selectedSessionId}
                className="w-full appearance-none px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-univ-700 pr-8"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isCurrent ? '(Active)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
              Semester
            </label>
            <div className="relative">
              <select
                name="semesterId"
                defaultValue={selectedSemesterId}
                className="w-full appearance-none px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-univ-700 pr-8"
              >
                {currentSession?.semesters.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    {sem.name} Semester {sem.isCurrent ? '(Active)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="broadsheet-student-search" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
              Find Student
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="broadsheet-student-search"
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Name or matric no."
                className="w-full py-2 pl-9 pr-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-univ-700"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
            >
              Generate Broadsheet
            </button>
          </div>
        </form>
      </section>

      {/* ── METRIC STRIP ────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
        <div className="px-5 py-3.5">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Class Enrollment
          </p>
          <p className="text-xl font-bold font-mono text-slate-950">{rankedRows.length}</p>
          <p className="text-[11px] text-slate-500">Students ranked in cohort</p>
        </div>

        <div className="px-5 py-3.5">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Curriculum Courses
          </p>
          <p className="text-xl font-bold font-mono text-univ-800">{courses.length}</p>
          <p className="text-[11px] text-slate-500">Examined curriculum units</p>
        </div>

        <div className="px-5 py-3.5">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Highest GPA
          </p>
          <p className="text-xl font-bold font-mono text-emerald-700">{highestGpa}</p>
          <p className="text-[11px] text-slate-500">Top cohort academic standing</p>
        </div>

        <div className="px-5 py-3.5">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Cohort Mean GPA
          </p>
          <p className="text-xl font-bold font-mono text-slate-900">{averageGpa}</p>
          <p className="text-[11px] text-slate-500">Class aggregate grade point</p>
        </div>
      </section>

      {/* ── BROADSHEET MATRIX TABLE ─────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between pb-3">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-950">
              Master Examination Results Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Official faculty broadsheet &bull; Ranking computed by cumulative semester points
            </p>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Nigerian 5.0 CGPA Standard
          </span>
        </div>

        {matchingRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-t border-b border-slate-200">
              <thead className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px] font-mono">
                <tr>
                  <th className="py-3 px-3 text-center border-r border-slate-200 w-12">Pos</th>
                  <th className="py-3 px-4 border-r border-slate-200 min-w-44">Student Name</th>
                  <th className="py-3 px-4 border-r border-slate-200 font-mono">Matric No</th>
                  {courses.map((c) => (
                    <th
                      key={c.id}
                      className="py-3 px-3 text-center border-r border-slate-200 font-mono"
                      title={c.title}
                    >
                      <div>{c.code}</div>
                      <div className="text-[9px] text-slate-400 font-normal">({c.unit}U)</div>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center border-r border-slate-200">U.Reg</th>
                  <th className="py-3 px-3 text-center border-r border-slate-200">U.Pass</th>
                  <th className="py-3 px-3 text-center border-r border-slate-200">W.Pts</th>
                  <th className="py-3 px-4 text-center border-r border-slate-200 bg-slate-50/70 text-slate-950 font-bold">
                    GPA
                  </th>
                  <th className="py-3 px-4 text-left">Class Standing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((row) => {
                  const degreeClass = getDegreeClass(row.gpaData.gpa);
                  return (
                    <tr key={row.student.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 text-center font-bold font-mono text-slate-900 border-r border-slate-100 bg-slate-50/40">
                        {ordinalSuffix(row.rank)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 border-r border-slate-100">
                        {row.student.fullName}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-univ-900 border-r border-slate-100">
                        {row.student.matricNo}
                      </td>
                      {courses.map((c) => {
                        const item = row.courseMap[c.id];
                        return (
                          <td
                            key={c.id}
                            className="py-3 px-3 text-center border-r border-slate-100 font-mono"
                          >
                            {item ? (
                              <div className="inline-flex items-center gap-1">
                                <span className="font-bold text-slate-900">{item.total}</span>
                                <span
                                  className={`text-[9px] font-bold px-1 rounded ${
                                    item.grade === 'A'
                                      ? 'bg-emerald-50 text-emerald-800'
                                      : item.grade === 'B' || item.grade === 'C'
                                      ? 'bg-blue-50 text-blue-800'
                                      : item.grade === 'D' || item.grade === 'E'
                                      ? 'bg-amber-50 text-amber-800'
                                      : 'bg-rose-50 text-rose-800'
                                  }`}
                                >
                                  {item.grade}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-3 px-3 text-center font-bold font-mono border-r border-slate-100">
                        {row.gpaData.totalUnitsRegistered}
                      </td>
                      <td className="py-3 px-3 text-center font-bold font-mono text-emerald-800 border-r border-slate-100">
                        {row.gpaData.totalUnitsPassed}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800 border-r border-slate-100">
                        {row.gpaData.totalWeightedPoints}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black text-univ-900 bg-slate-50/50 border-r border-slate-100 text-sm">
                        {row.gpaData.gpa.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-left">
                        <span className="text-[11px] font-medium text-slate-700">
                          {degreeClass}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-slate-200">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                    Cohort Statistics
                  </td>
                  <td colSpan={courses.length} className="py-3 px-3 text-center font-mono text-slate-500 text-xs">
                    {courses.length} Courses Evaluated
                  </td>
                  <td colSpan={3} className="py-3 px-3 text-center font-mono text-slate-500 text-xs">
                    Mean Class GPA: <strong className="text-slate-900 font-bold">{averageGpa}</strong>
                  </td>
                  <td colSpan={2} className="py-3 px-4 text-right font-mono text-slate-900 text-xs font-bold">
                    {rankedRows.length} Students Ranked
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center border-t border-slate-200">
            <Award className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs text-slate-500 font-medium">
              {query ? `No students match “${query}” in this department and level.` : 'No examination records found for this department and level selection.'}
            </p>
          </div>
        )}
        {totalPages > 1 && (
          <nav aria-label="Broadsheet pages" className="mt-4 flex items-center justify-between text-xs text-slate-600">
            <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, matchingRows.length)} of {matchingRows.length} matching students</span>
            <div className="flex gap-2">
              <a aria-disabled={page <= 1} className={`rounded border px-3 py-1.5 ${page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'}`} href={pageHref(Math.max(1, page - 1))}>Previous</a>
              <span className="px-2 py-1.5">Page {page} of {totalPages}</span>
              <a aria-disabled={page >= totalPages} className={`rounded border px-3 py-1.5 ${page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'}`} href={pageHref(Math.min(totalPages, page + 1))}>Next</a>
            </div>
          </nav>
        )}
      </section>
    </div>
  );
}
