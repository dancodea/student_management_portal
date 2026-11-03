'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UniversityEmblem from '@/components/ui/UniversityEmblem';
import StudentNav from '@/components/student/StudentNav';
import SignOutButton from '@/components/student/SignOutButton';
import { Menu, X } from 'lucide-react';

export default function StudentSidebar() {
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

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. MOBILE TOP HEADER (Visible only on < md screens)
          ───────────────────────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between no-print">
        <Link href="/student/dashboard" className="flex items-center gap-2.5">
          <UniversityEmblem size="sm" />
          <div className="flex flex-col">
            <span className="font-bold text-xs tracking-tight text-slate-950">
              FUTMINNA <span className="text-univ-700 font-semibold">Portal</span>
            </span>
            <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">
              Student Workspace
            </span>
          </div>
        </Link>

        {/* Hamburger Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
          aria-label="Open navigation menu"
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

        {/* Drawer content panel (slides in from left, slides out to left) */}
        <div
          className={`relative w-72 max-w-[85vw] bg-white h-full p-6 shadow-2xl flex flex-col justify-between z-10 transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="space-y-6">
            {/* Drawer Top: Brand & Close button */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <Link
                href="/student/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5"
              >
                <UniversityEmblem size="sm" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs tracking-tight text-slate-950">
                    FUTMINNA <span className="text-univ-700 font-semibold">Portal</span>
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">
                    Student Workspace
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

            {/* Navigation Menu */}
            <StudentNav onNavigate={() => setIsOpen(false)} />
          </div>

          {/* Bottom: Sign Out Action */}
          <div className="pt-4 border-t border-slate-200/70">
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. DESKTOP DOCKED SIDEBAR (Visible on md: screens and up)
          ───────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 lg:w-72 shrink-0 no-print md:sticky md:top-0 md:h-screen flex-col justify-between border-r border-slate-200/80 p-6 lg:p-7 bg-white">
        <div className="space-y-6">
          {/* University Emblem & Brand Header */}
          <Link
            href="/student/dashboard"
            className="flex items-center gap-3 group pb-4 border-b border-slate-100"
          >
            <UniversityEmblem size="md" />
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-slate-950 group-hover:text-univ-800 transition">
                FUTMINNA <span className="text-univ-700 font-semibold">Portal</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                Student Portal
              </span>
            </div>
          </Link>

          {/* Navigation Menu */}
          <StudentNav />
        </div>

        {/* Bottom of Sidebar: Sign Out Action docked at the very bottom */}
        <div className="pt-4 mt-6 border-t border-slate-200/70">
          <SignOutButton />
        </div>
      </aside>
    </>
  );
}
