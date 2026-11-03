'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Award,
  User,
} from 'lucide-react';

const navItems = [
  {
    href: '/student/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/student/courses',
    label: 'Course Registration',
    icon: BookOpen,
  },
  {
    href: '/student/results',
    label: 'Results',
    icon: Award,
  },
  {
    href: '/student/profile',
    label: 'Profile',
    icon: User,
  },
];

export default function StudentNav({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-3 mb-2 font-mono">
        Academic Workspace
      </span>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== '/student/dashboard' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-colors ${
              isActive
                ? 'bg-slate-100 text-slate-950 font-semibold'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50 font-medium'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive
                    ? 'text-univ-700'
                    : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              <span>{item.label}</span>
            </div>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-univ-700" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
