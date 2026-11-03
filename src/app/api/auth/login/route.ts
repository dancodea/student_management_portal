import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username/Matric No and password are required.' },
        { status: 400 }
      );
    }

    const cleanIdentifier = String(username).trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanIdentifier },
          { email: cleanIdentifier },
        ],
      },
      include: {
        student: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid login credentials.' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid login credentials.' },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role as 'ADMIN' | 'STUDENT',
      name: user.name,
      email: user.email,
      studentId: user.student?.id,
      matricNo: user.student?.matricNo,
    });

    const redirectUrl = user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard';

    const response = NextResponse.json({
      success: true,
      role: user.role,
      redirectUrl,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        matricNo: user.student?.matricNo,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during login.' },
      { status: 500 }
    );
  }
}
