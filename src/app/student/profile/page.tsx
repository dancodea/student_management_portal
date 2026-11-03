import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { calculateSemesterGpa, getDegreeClass } from '@/lib/academic';
import StudentProfileManager from '@/components/student/StudentProfileManager';

export default async function StudentProfilePage() {
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

  const activeSession = await prisma.academicSession.findFirst({
    where: { isCurrent: true },
    include: {
      semesters: { where: { isCurrent: true } },
    },
  });

  const activeSemester = activeSession?.semesters[0];

  // Calculate Cumulative CGPA
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
    <StudentProfileManager
      initialStudent={student}
      activeSessionName={activeSession?.name || '2024/2025'}
      activeSemesterName={activeSemester?.name || 'First'}
      degreeClass={degreeClass}
    />
  );
}
