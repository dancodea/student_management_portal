import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { calculateGrade } from '@/lib/academic';

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN');
    const { courseId, sessionId, semesterId, csvText } = await req.json();

    if (!courseId || !sessionId || !semesterId || !csvText) {
      return NextResponse.json(
        { error: 'Course, session, semester, and CSV content are required.' },
        { status: 400 }
      );
    }

    const lines = csvText.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
    if (lines.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty.' }, { status: 400 });
    }

    // Check header line
    let startIndex = 0;
    if (lines[0].toLowerCase().includes('matric')) {
      startIndex = 1;
    }

    let updatedCount = 0;
    const errors: string[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p: string) => p.trim());
      if (parts.length < 3) continue;

      const matricNo = parts[0].toUpperCase();
      const ca = parseFloat(parts[1]);
      const exam = parseFloat(parts[2]);

      if (isNaN(ca) || ca < 0 || ca > 40) {
        errors.push(`Row ${i + 1} (${matricNo}): Invalid CA score ${parts[1]}. Must be 0-40.`);
        continue;
      }

      if (isNaN(exam) || exam < 0 || exam > 60) {
        errors.push(`Row ${i + 1} (${matricNo}): Invalid Exam score ${parts[2]}. Must be 0-60.`);
        continue;
      }

      const registration = await prisma.courseRegistration.findFirst({
        where: {
          courseId,
          sessionId,
          semesterId,
          student: { matricNo },
        },
      });

      if (!registration) {
        errors.push(`Row ${i + 1} (${matricNo}): Student is not registered for this course in this term.`);
        continue;
      }

      const total = ca + exam;
      const { grade, gradePoint } = calculateGrade(total);

      await prisma.score.upsert({
        where: { registrationId: registration.id },
        update: {
          caScore: ca,
          examScore: exam,
          totalScore: total,
          grade,
          gradePoint,
        },
        create: {
          registrationId: registration.id,
          caScore: ca,
          examScore: exam,
          totalScore: total,
          grade,
          gradePoint,
        },
      });

      updatedCount++;
    }

    await prisma.activityLog.create({
      data: {
        adminId: session.userId,
        action: 'BULK_SCORE_UPLOAD',
        details: `Bulk uploaded ${updatedCount} scores for course ${courseId}. Errors: ${errors.length}`,
      },
    });

    return NextResponse.json({
      success: true,
      updatedCount,
      errors,
      message: `Processed CSV: ${updatedCount} student grades updated successfully.`,
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({ error: 'Failed to process bulk CSV upload.' }, { status: 500 });
  }
}
