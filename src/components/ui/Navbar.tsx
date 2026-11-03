'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import UniversityEmblem from './UniversityEmblem';
import {
  GraduationCap,
  ShieldCheck,
  LogOut,
  User,
  Menu,
  X,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

interface NavbarProps {
  user?: {
    name: string;
    role: 'ADMIN' | 'STUDENT';
    matricNo?: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const isPublicPage = pathname === '/' || pathname === '/login';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 no-print">
      <div className="w-full px-6 lg:px-8 h-15 py-3 flex items-center justify-between">
        {/* Brand & Emblem */}
        <Link href="/" className="flex items-center gap-3.5 group">
          <UniversityEmblem size="md" />
          <div className="flex flex-col">
            <span className="font-bold text-sm sm:text-base tracking-tight text-slate-950 group-hover:text-univ-800 transition">
              FUTMINNA <span className="text-univ-700 font-semibold">Portal</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase hidden sm:block">
              Student Registration &amp; Academic Records
            </span>
          </div>
        </Link>

        {/* Desktop Nav - Public Navigation */}
        {isPublicPage && !user && (
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <Link
              href="/login"
              className="hover:text-univ-800 transition"
            >
              Student Portal
            </Link>
            <a
              href="#about-portal"
              className="hover:text-univ-800 transition"
            >
              About the Portal
            </a>
            <a
              href="#academic-services"
              className="hover:text-univ-800 transition"
            >
              Academic Services
            </a>
            <a
              href="#features"
              className="hover:text-univ-800 transition"
            >
              Capabilities
            </a>
          </nav>
        )}

        {/* User State or Auth CTAs */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href={user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard'}
                className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 border border-slate-200/90 rounded-md transition text-xs"
              >
                {user.role === 'ADMIN' ? (
                  <span className="w-4 h-4 rounded bg-gold-100 text-gold-800 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="w-4 h-4 rounded bg-univ-100 text-univ-800 flex items-center justify-center font-bold">
                    <User className="w-3 h-3" />
                  </span>
                )}
                <div className="text-left">
                  <span className="font-semibold text-slate-900 block leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {user.role === 'ADMIN' ? 'Administrator' : user.matricNo}
                  </span>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-rose-700 hover:bg-rose-50/60 border border-slate-200/90 rounded-md px-2.5 py-1.5 transition font-medium"
                title="Sign out of portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="text-xs bg-univ-700 hover:bg-univ-800 text-white font-semibold px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <span>Sign In to Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Mobile hamburger toggle */}
          {isPublicPage && !user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && isPublicPage && !user && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-dropdown">
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-800 hover:text-univ-800 py-1"
          >
            Student Portal
          </Link>
          <a
            href="#about-portal"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-800 hover:text-univ-800 py-1"
          >
            About the Portal
          </a>
          <a
            href="#academic-services"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-800 hover:text-univ-800 py-1"
          >
            Academic Services
          </a>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-800 hover:text-univ-800 py-1"
          >
            Capabilities
          </a>
          <div className="pt-3 border-t border-slate-100">
            <Link
              href="/login"
              className="block text-center text-xs font-semibold py-2 px-3 bg-univ-700 text-white rounded-lg"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
