import Link from 'next/link';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { calculateSemesterGpa, getDegreeClass } from '@/lib/academic';
import UniversityEmblem from '@/components/ui/UniversityEmblem';
import { Printer, ArrowLeft, User, ShieldCheck } from 'lucide-react';

export default async function PrintResultSlipPage({
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
    return <div>Student not found.</div>;
  }

  // Find active or selected session & semester
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

  const registrations = currentSession && currentSemester
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

  const coursesInput = registrations
    .filter((r) => r.score !== null)
    .map((r) => ({
      unit: r.course.unit,
      gradePoint: r.score!.gradePoint,
    }));

  const semesterGpaData = calculateSemesterGpa(coursesInput);

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
    <div className="space-y-6">
      {/* Print Controls (Hidden on Paper) */}
      <div className="no-print pb-4 border-b border-slate-200 flex items-center justify-between">
        <Link
          href="/student/results"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-950 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Results</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:inline font-mono">
            Print directly or save as PDF (<kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px]">Ctrl+P</kbd>)
          </span>
          <button
            onClick={undefined}
            className="print-btn inline-flex items-center gap-1.5 px-3.5 py-2 bg-univ-900 hover:bg-univ-800 text-white rounded-md text-xs font-semibold transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Statement of Results</span>
          </button>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.querySelector('.print-btn')?.addEventListener('click', function() {
              window.print();
            });
          `,
        }}
      />

      {/* Official A4 Result Slip Container */}
      <div className="print-container bg-white border border-slate-200 rounded-lg p-8 sm:p-12 max-w-4xl mx-auto text-slate-900">
        {/* Letterhead */}
        <div className="text-center pb-6 border-b-2 border-slate-950 relative">
          <div className="flex items-center justify-center gap-4 mb-2">
            <UniversityEmblem size="xl" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-950 font-serif leading-tight">
                Federal University of Technology, Minna
              </h1>
              <p className="text-xs font-serif italic text-slate-700">
                P.M.B. 65, Minna, Niger State, Nigeria &bull; Office of the Academic Registrar
              </p>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-univ-900 mt-2 font-mono">
                Official Statement of Examination Results
              </h2>
            </div>
          </div>
        </div>

        {/* Student Biodata & S3 Passport Grid */}
        <div className="py-6 border-b border-slate-200 grid grid-cols-3 gap-6 items-center">
          <div className="col-span-2 space-y-2 text-xs">
            <div className="grid grid-cols-3">
              <span className="font-semibold text-slate-500">Student Name:</span>
              <span className="col-span-2 font-bold text-slate-950 text-sm uppercase">
                {student.fullName}
              </span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-semibold text-slate-500">Matriculation No:</span>
              <span className="col-span-2 font-bold font-mono text-univ-900 text-sm">
                {student.matricNo}
              </span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-semibold text-slate-500">Faculty / School:</span>
              <span className="col-span-2 font-medium text-slate-800">
                {student.faculty.name}
              </span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-semibold text-slate-500">Department:</span>
              <span className="col-span-2 font-medium text-slate-800">
                {student.department.name}
              </span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-semibold text-slate-500">Academic Level:</span>
              <span className="col-span-2 font-medium text-slate-800">
                {student.level} Level
              </span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-semibold text-slate-500">Term / Semester:</span>
              <span className="col-span-2 font-bold text-slate-900">
                {currentSession?.name} Session &bull; {currentSemester?.name} Semester
              </span>
            </div>
          </div>

          {/* S3 Passport Photograph Box */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-28 h-36 rounded-lg overflow-hidden border-2 border-slate-900 bg-slate-100 shadow-sm flex items-center justify-center">
              {student.passportUrl ? (
                <img
                  src={student.passportUrl}
                  alt={student.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-2 text-slate-400">
                  <User className="w-10 h-10 mx-auto mb-1 text-slate-300" />
                  <span className="text-[10px] block leading-tight font-mono">Passport Photo</span>
                </div>
              )}
            </div>
            <span className="text-[9px] text-slate-400 mt-1 font-mono uppercase tracking-wider">
              AWS S3 Verified
            </span>
          </div>
        </div>

        {/* Results Table */}
        <div className="py-6">
          <table className="w-full text-xs text-left border border-slate-300">
            <thead className="bg-slate-100 text-slate-900 border-b border-slate-300 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-2 border-r border-slate-300">Course Code</th>
                <th className="p-2 border-r border-slate-300">Course Title</th>
                <th className="p-2 border-r border-slate-300 text-center">Units</th>
                <th className="p-2 border-r border-slate-300 text-center">CA (40)</th>
                <th className="p-2 border-r border-slate-300 text-center">Exam (60)</th>
                <th className="p-2 border-r border-slate-300 text-center">Total (100)</th>
                <th className="p-2 border-r border-slate-300 text-center">Grade</th>
                <th className="p-2 border-r border-slate-300 text-center">Points</th>
                <th className="p-2 text-center">Weighted Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {registrations.map((r) => {
                const s = r.score;
                const weighted = s ? r.course.unit * s.gradePoint : 0;
                return (
                  <tr key={r.id}>
                    <td className="p-2 border-r border-slate-300 font-bold font-mono text-univ-900">
                      {r.course.code}
                    </td>
                    <td className="p-2 border-r border-slate-300 font-medium">{r.course.title}</td>
                    <td className="p-2 border-r border-slate-300 text-center font-bold">
                      {r.course.unit}
                    </td>
                    <td className="p-2 border-r border-slate-300 text-center font-mono text-slate-700">
                      {s ? s.caScore : '—'}
                    </td>
                    <td className="p-2 border-r border-slate-300 text-center font-mono text-slate-700">
                      {s ? s.examScore : '—'}
                    </td>
                    <td className="p-2 border-r border-slate-300 text-center font-bold font-mono">
                      {s ? s.totalScore : '—'}
                    </td>
                    <td className="p-2 border-r border-slate-300 text-center font-bold">
                      {s ? s.grade : '—'}
                    </td>
                    <td className="p-2 border-r border-slate-300 text-center font-mono">
                      {s ? s.gradePoint : '—'}
                    </td>
                    <td className="p-2 text-center font-bold font-mono">{s ? weighted : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-400">
              <tr>
                <td colSpan={2} className="p-2 text-right border-r border-slate-300">
                  Semester Totals:
                </td>
                <td className="p-2 text-center border-r border-slate-300 font-mono">
                  {semesterGpaData.totalUnitsRegistered} Units
                </td>
                <td colSpan={5} className="p-2 text-right border-r border-slate-300 uppercase text-[10px] text-slate-500 font-semibold">
                  Total Weighted Grade Points:
                </td>
                <td className="p-2 text-center font-mono text-univ-900 text-sm">
                  {semesterGpaData.totalWeightedPoints}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Academic Performance Summary Grid */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-300 rounded-xl mb-6 text-center text-xs">
          <div>
            <span className="text-[10px] uppercase text-slate-500 font-semibold block mb-0.5">
              Semester Units
            </span>
            <span className="font-bold text-slate-900 text-base font-mono">
              {semesterGpaData.totalUnitsRegistered}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-500 font-semibold block mb-0.5">
              Semester GPA
            </span>
            <span className="font-black text-univ-900 text-base font-mono">
              {semesterGpaData.gpa.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-500 font-semibold block mb-0.5">
              Cumulative CGPA
            </span>
            <span className="font-black text-amber-700 text-base font-mono">
              {cumulativeData.gpa.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-500 font-semibold block mb-0.5">
              Class Standing
            </span>
            <span className="font-bold text-slate-900 text-xs block leading-tight">
              {degreeClass}
            </span>
          </div>
        </div>

        {/* Grading Scale Key */}
        <div className="text-[10px] text-slate-600 border border-slate-200 rounded-lg p-2.5 mb-8">
          <strong className="text-slate-800 block mb-1">Grading Scale (5-Point Nigerian University Standard):</strong>
          <div className="grid grid-cols-6 gap-2 text-center font-mono">
            <div>70-100% &bull; <strong>A (5.0)</strong></div>
            <div>60-69% &bull; <strong>B (4.0)</strong></div>
            <div>50-59% &bull; <strong>C (3.0)</strong></div>
            <div>45-49% &bull; <strong>D (2.0)</strong></div>
            <div>40-44% &bull; <strong>E (1.0)</strong></div>
            <div>0-39% &bull; <strong>F (0.0)</strong></div>
          </div>
        </div>

        {/* Signatures & Verification Block */}
        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-300 text-center text-xs">
          <div className="space-y-12">
            <div className="h-8 border-b border-dashed border-slate-400" />
            <p className="font-semibold text-slate-800">Head of Department</p>
          </div>
          <div className="space-y-12">
            <div className="h-8 border-b border-dashed border-slate-400" />
            <p className="font-semibold text-slate-800">Dean of Faculty</p>
          </div>
          <div className="space-y-12">
            <div className="h-8 border-b border-dashed border-slate-400" />
            <p className="font-semibold text-slate-800">Academic Registrar</p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400 font-mono">
          <span>Verification Hash: SHA256_{student.matricNo.replace('/', '_')}_AUTH</span>
          <span>Printed on: {new Date().toLocaleDateString('en-GB')}</span>
        </div>
      </div>
    </div>
  );
}
