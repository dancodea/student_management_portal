import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  const activeSession = await prisma.academicSession.findFirst({
    where: { isCurrent: true },
    include: { semesters: { where: { isCurrent: true } } },
  });

  const activeSemester = activeSession?.semesters[0];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white text-slate-900">
      {/* ── SIDEBAR (Desktop docked & Mobile responsive drawer) ──── */}
      <AdminSidebar
        user={{
          name: session.name,
          email: session.email,
          role: session.role,
        }}
        activeSession={activeSession ? { name: activeSession.name } : null}
        activeSemester={activeSemester ? { name: activeSemester.name } : null}
      />

      {/* ── MAIN CONTENT ────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 px-6 lg:px-10 py-8">{children}</main>
    </div>
  );
}
