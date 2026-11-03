/**
 * Academic calculation utilities based on standard Nigerian University 5.0 CGPA system.
 */

export interface GradeResult {
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  gradePoint: number;
  remark: string;
}

export function calculateGrade(totalScore: number): GradeResult {
  const rounded = Math.round(totalScore * 100) / 100;
  if (rounded >= 70) return { grade: 'A', gradePoint: 5, remark: 'Excellent' };
  if (rounded >= 60) return { grade: 'B', gradePoint: 4, remark: 'Very Good' };
  if (rounded >= 50) return { grade: 'C', gradePoint: 3, remark: 'Good' };
  if (rounded >= 45) return { grade: 'D', gradePoint: 2, remark: 'Fair' };
  if (rounded >= 40) return { grade: 'E', gradePoint: 1, remark: 'Pass' };
  return { grade: 'F', gradePoint: 0, remark: 'Fail' };
}

export function getGradeBadgeColor(grade: string): string {
  switch (grade) {
    case 'A':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'B':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'C':
      return 'bg-teal-100 text-teal-800 border-teal-300';
    case 'D':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'E':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    default:
      return 'bg-rose-100 text-rose-800 border-rose-300';
  }
}

export interface CourseScoreInput {
  unit: number;
  gradePoint: number;
}

export function calculateSemesterGpa(courses: CourseScoreInput[]): {
  totalUnitsRegistered: number;
  totalUnitsPassed: number;
  totalWeightedPoints: number;
  gpa: number;
} {
  let totalUnits = 0;
  let totalUnitsPassed = 0;
  let weightedPoints = 0;

  for (const c of courses) {
    totalUnits += c.unit;
    if (c.gradePoint > 0) {
      totalUnitsPassed += c.unit;
    }
    weightedPoints += c.unit * c.gradePoint;
  }

  const gpa = totalUnits > 0 ? Math.round((weightedPoints / totalUnits) * 100) / 100 : 0.0;

  return {
    totalUnitsRegistered: totalUnits,
    totalUnitsPassed,
    totalWeightedPoints: weightedPoints,
    gpa,
  };
}

export function getDegreeClass(cgpa: number): string {
  if (cgpa >= 4.50) return 'First Class Honours';
  if (cgpa >= 3.50) return 'Second Class Honours (Upper Division)';
  if (cgpa >= 2.40) return 'Second Class Honours (Lower Division)';
  if (cgpa >= 1.50) return 'Third Class Honours';
  if (cgpa >= 1.00) return 'Pass';
  return 'Academic Probation';
}

export function ordinalSuffix(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}
