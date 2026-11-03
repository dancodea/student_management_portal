import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FUTMINNA Student Registration & Result Management System',
  description: 'Decoupled cloud-native student registration, course enrollment, and result slip portal on AWS.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
