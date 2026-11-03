'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function SignOutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
      window.location.href = '/login';
    }
  };

  return (
    <button
      onClick={handleLogout}
      type="button"
      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-700 hover:bg-rose-50/70 transition-colors group"
      title="Sign out of student portal"
    >
      <div className="flex items-center gap-2.5">
        <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
        <span className="font-semibold text-slate-700 group-hover:text-rose-700">Sign Out</span>
      </div>
      <span className="text-[10px] font-mono text-slate-400 group-hover:text-rose-600">
        Exit
      </span>
    </button>
  );
}
