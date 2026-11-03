import { redirect } from 'next/navigation';
import StudentSidebar from '@/components/student/StudentSidebar';
import { getSession } from '@/lib/auth';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== 'STUDENT') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white text-slate-900 selection:bg-univ-800 selection:text-white">
      {/* Responsive Sidebar (Mobile top bar + slide-over opening drawer, Desktop docked sidebar) */}
      <StudentSidebar />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-5 sm:p-8 lg:p-10 xl:p-12">
        {children}
      </main>
    </div>
  );
}
