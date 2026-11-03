'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UniversityEmblem from '@/components/ui/UniversityEmblem';
import SignOutButton from '@/components/student/SignOutButton';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Award,
  Settings,
  Calendar,
  Menu,
  X,
  Shield,
} from 'lucide-react';

const navGroups = [
  {
    label: 'Operations',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/students', label: 'Enrolled Students', icon: Users },
    ],
  },
  {
    label: 'Examination & Grading',
    items: [
      { href: '/admin/scores', label: 'Gradebook & Scores', icon: FileSpreadsheet },
      { href: '/admin/broadsheet', label: 'Class Broadsheet', icon: Award },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { href: '/admin/sessions', label: 'Session & Controls', icon: Settings },
      { href: '/admin/calendar', label: 'Academic Calendar', icon: Calendar },
    ],
  },
];

interface AdminSidebarProps {
  user: {
    name: string;
    email?: string;
    role: string;
  };
  activeSession?: {
    name: string;
  } | null;
  activeSemester?: {
    name: string;
  } | null;
}

export default function AdminSidebar({
  user,
  activeSession,
  activeSemester,
}: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderNav = (onNavigate?: () => void) => (
    <nav className="space-y-6">
      {navGroups.map((group) => (
        <div key={group.label}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-3 mb-1.5 font-mono">
            {group.label}
          </span>
          <div className="space-y-1">
            {group.items.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-950 font-semibold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 transition-colors shrink-0 ${
                        isActive ? 'text-univ-700' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span>{label}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-univ-700 shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. MOBILE TOP HEADER (Visible only on < md screens)
          ───────────────────────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between no-print">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <UniversityEmblem size="sm" />
          <div className="flex flex-col">
            <span className="font-bold text-xs tracking-tight text-slate-950">
              FUTMINNA <span className="text-univ-700 font-semibold">Portal</span>
            </span>
            <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">
              Admin Console
            </span>
          </div>
        </Link>

        {/* Hamburger Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
          aria-label="Open administration menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. MOBILE SLIDE-OVER DRAWER (Slide in and out on < md)
          ───────────────────────────────────────────────────────────── */}
      <div
        className={`md:hidden fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
          isOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible delay-300'
        }`}
        aria-hidden={!isOpen}
      >
        {/* Backdrop overlay */}
        <div
          onClick={() => setIsOpen(false)}
          className={`fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />

        {/* Drawer content panel */}
        <div
          className={`relative w-72 max-w-[85vw] bg-white h-full p-6 shadow-2xl flex flex-col justify-between z-10 transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="space-y-6">
            {/* Drawer Top: Brand & Close button */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <Link
                href="/admin/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5"
              >
                <UniversityEmblem size="sm" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs tracking-tight text-slate-950">
                    FUTMINNA <span className="text-univ-700 font-semibold">Portal</span>
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">
                    Admin Console
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Session Pill in mobile */}
            {activeSession && (
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                <span className="text-[11px] text-slate-700 font-mono font-medium truncate">
                  {activeSession.name} &bull; {activeSemester?.name ?? '—'} Sem
                </span>
              </div>
            )}

            {/* Navigation Menu */}
            {renderNav(() => setIsOpen(false))}
          </div>

          {/* Bottom: User Profile & Sign Out */}
          <div className="pt-4 border-t border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2.5 px-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <Shield className="w-4 h-4 text-univ-700" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
                <div className="text-[10px] text-slate-400 font-mono uppercase">System Admin</div>
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. DESKTOP DOCKED SIDEBAR (Visible on md: screens and up)
          ───────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 lg:w-72 shrink-0 no-print md:sticky md:top-0 md:h-screen flex-col justify-between border-r border-slate-200/80 px-6 py-7 bg-white">
        <div className="space-y-6">
          {/* Brand + session context */}
          <div className="pb-5 border-b border-slate-200">
            <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
              <UniversityEmblem size="sm" />
              <div className="flex flex-col">
                <span className="font-bold text-xs tracking-tight text-slate-950 group-hover:text-univ-800 transition">
                  FUTMINNA <span className="text-univ-700">Portal</span>
                </span>
                <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">
                  Admin Console
                </span>
              </div>
            </Link>

            {activeSession && (
              <div className="mt-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                <span className="text-[11px] text-slate-600 font-mono font-medium">
                  {activeSession.name} &bull; {activeSemester?.name ?? '—'} Sem
                </span>
              </div>
            )}
          </div>

          {/* Navigation Groups */}
          {renderNav()}
        </div>

        {/* Bottom of Sidebar: Administrator Profile & Sign Out */}
        <div className="pt-4 mt-6 border-t border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2.5 px-3 py-1">
            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
              <Shield className="w-3.5 h-3.5 text-univ-700" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-900 truncate">{user.name}</div>
              <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">
                System Admin
              </div>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>
    </>
  );
}
