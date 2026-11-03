import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const faculties = await prisma.faculty.findMany({
      include: {
        departments: true,
      },
      orderBy: { name: 'asc' },
    });

    const departments = await prisma.department.findMany({
      include: { faculty: true, courses: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, faculties, departments });
  } catch (error) {
    console.error('Departments GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch departments.' }, { status: 500 });
  }
}
