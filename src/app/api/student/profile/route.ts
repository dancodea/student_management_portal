import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { getMissingStudentProfileFields } from '@/lib/student-profile';

export async function GET() {
  try {
    const session = await requireRole('STUDENT');

    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      include: {
        department: true,
        faculty: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student record not found.' }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized or failed to fetch profile.' },
      { status: 401 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireRole('STUDENT');

    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student record not found.' }, { status: 404 });
    }

    const body = await req.json();

    const requiredProfile = {
      phone: body.phone ?? student.phone,
      address: body.address ?? student.address,
      state: body.state ?? student.state,
      lga: body.lga ?? student.lga,
      placeOfBirth: body.placeOfBirth ?? student.placeOfBirth,
      maritalStatus: body.maritalStatus ?? student.maritalStatus,
      tribe: body.tribe ?? student.tribe,
      religion: body.religion ?? student.religion,
    };
    const missingFields = getMissingStudentProfileFields(requiredProfile);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Complete these required profile fields: ${missingFields.join(', ')}.` },
        { status: 400 },
      );
    }

    const {
      phone,
      address,
      state,
      lga,
      maritalStatus,
      tribe,
      religion,
      placeOfBirth,
      nextOfKinName,
      nextOfKinRelationship,
      nextOfKinAddress,
      nextOfKinPhone,
      nextOfKinEmail,
      passportUrl,
      signatureUrl,
    } = body;

    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        phone: requiredProfile.phone.trim(),
        address: requiredProfile.address.trim(),
        state: requiredProfile.state.trim(),
        lga: requiredProfile.lga.trim(),
        maritalStatus: requiredProfile.maritalStatus.trim(),
        tribe: requiredProfile.tribe.trim(),
        religion: requiredProfile.religion.trim(),
        placeOfBirth: requiredProfile.placeOfBirth.trim(),
        nextOfKinName: nextOfKinName !== undefined ? nextOfKinName : student.nextOfKinName,
        nextOfKinRelationship:
          nextOfKinRelationship !== undefined
            ? nextOfKinRelationship
            : student.nextOfKinRelationship,
        nextOfKinAddress:
          nextOfKinAddress !== undefined ? nextOfKinAddress : student.nextOfKinAddress,
        nextOfKinPhone:
          nextOfKinPhone !== undefined ? nextOfKinPhone : student.nextOfKinPhone,
        nextOfKinEmail:
          nextOfKinEmail !== undefined ? nextOfKinEmail : student.nextOfKinEmail,
        passportUrl: passportUrl !== undefined ? passportUrl : student.passportUrl,
        signatureUrl: signatureUrl !== undefined ? signatureUrl : student.signatureUrl,
      },
      include: {
        department: true,
        faculty: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      student: updatedStudent,
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update student profile.' },
      { status: 500 }
    );
  }
}
