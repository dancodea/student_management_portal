'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UniversityEmblem from '@/components/ui/UniversityEmblem';
import {
  GraduationCap,
  ShieldCheck,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [username, setUsername] = useState('UG/20/1042');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to login.');
      }

      router.push(data.redirectUrl || '/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (newRole: 'student' | 'admin') => {
    setRole(newRole);
    setError(null);
    if (newRole === 'student') {
      setUsername('UG/20/1042');
      setPassword('password123');
    } else {
      setUsername('admin');
      setPassword('admin123');
    }
  };

  const loadDemoCredentials = (targetRole: 'student' | 'admin') => {
    handleRoleChange(targetRole);
  };

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 grid grid-cols-1 lg:grid-cols-12 selection:bg-univ-800 selection:text-white">
      {/* ─────────────────────────────────────────────────────────────
          LEFT PANEL: Institutional Brand Anchor & Academic Authority
          ───────────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 bg-univ-950 text-white relative overflow-hidden flex-col justify-between p-8 sm:p-12 lg:p-14 border-r border-univ-900/80">
        {/* Subtle Architectural Grid Background Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(#15803d_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-univ-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top: University Brand */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3.5 group">
            <UniversityEmblem size="lg" />
            <div>
              <span className="text-xl font-black tracking-tight text-white block leading-tight">
                FUTMINNA <span className="text-amber-400 font-semibold text-base">Portal</span>
              </span>
              <span className="text-[11px] text-univ-200 font-mono tracking-wider uppercase block">
                Federal University of Technology, Minna
              </span>
            </div>
          </Link>

          <div className="mt-4 text-xs italic font-serif text-amber-300/80 tracking-wide">
            &ldquo;Technology for Self-Reliance&rdquo; &bull; Est. 1983
          </div>
        </div>

        {/* Middle: Editorial Pillars & Academic State */}
        <div className="relative z-10 my-10 lg:my-0 space-y-8">
          {/* Active Session Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-univ-900/80 border border-univ-700/50 text-xs font-mono text-univ-100">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>2024/2025 Session &bull; First Semester Active</span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Unified Academic &amp; Examination Records
            </h2>
            <p className="mt-3 text-sm text-univ-200/80 leading-relaxed max-w-md">
              Secure institutional single sign-on for undergraduate course registration, continuous assessment scoring, Senate-approved broadsheets, and printable academic statements.
            </p>
          </div>

          {/* Minimal Editorial Checklist (No Chunky Cards) */}
          <div className="space-y-4 pt-2 border-t border-univ-800/80 text-xs text-univ-200">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">Senate-Verified Grading Engine</strong>
                <span>Automated 5.0 CGPA weighted credit calculations &amp; official transcript generation.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">AWS Cloud S3 Biometrics</strong>
                <span>Encrypted passport image repository for tamper-proof examination slips.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">Role-Based Access Control</strong>
                <span>Dedicated workflows for student registration and administrative broadsheet approvals.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Institutional Accreditation */}
        <div className="relative z-10 pt-6 border-t border-univ-900 text-[11px] text-univ-300/70 flex flex-col gap-1">
          <span className="font-semibold text-univ-200">
            Information &amp; Communication Technology Directorate (ICTD)
          </span>
          <span>Main Campus, Gidan Kwanu, P.M.B. 65, Minna, Niger State, Nigeria</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT PANEL: Clean Direct Canvas (NO NESTED CARDS OR BOXES)
          ───────────────────────────────────────────────────────────── */}
      <div className="col-span-1 lg:col-span-7 xl:col-span-7 flex flex-col justify-between p-6 sm:p-12 lg:p-16 min-h-screen">
        {/* Top Utility Bar */}
        <div className="flex items-center justify-between text-xs">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-univ-900 transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Portal Homepage</span>
          </Link>
          <span className="text-slate-400 font-mono text-[11px]">
            Security Verified &bull; TLS 1.3
          </span>
        </div>

        {/* Center Canvas Form */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          {/* Mobile Institutional Branding (Visible only on small screens when side banner is hidden) */}
          <div className="lg:hidden flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
            <UniversityEmblem size="md" />
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 block leading-tight">
                FUTMINNA <span className="text-univ-700 font-semibold text-sm">Portal</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase block">
                Federal University of Technology, Minna
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-univ-700 block mb-1">
              Account Authentication
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              Sign In to Your Portal
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
              Please enter your credentials to proceed to your academic dashboard.
            </p>
          </div>

          {/* Integrated Segmented Role Switcher (Replaces nested cards) */}
          <div className="mt-7 p-1 bg-slate-100 rounded-lg grid grid-cols-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleRoleChange('student')}
              className={`py-2 px-3 rounded-md transition flex items-center justify-center gap-2 ${
                role === 'student'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className={`w-4 h-4 ${role === 'student' ? 'text-univ-700' : 'text-slate-400'}`} />
              <span>Undergrad Student</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`py-2 px-3 rounded-md transition flex items-center justify-center gap-2 ${
                role === 'admin'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${role === 'admin' ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>Staff / Administrator</span>
            </button>
          </div>

          {/* Discreet Demo Autofill Helper */}
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Testing access?</span>
            <button
              type="button"
              onClick={() => loadDemoCredentials(role)}
              className="inline-flex items-center gap-1 text-univ-800 hover:text-univ-950 font-semibold underline underline-offset-2 transition"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Fill demo {role === 'student' ? 'Student (UG/20/1042)' : 'Admin (admin)'}</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-5 p-3 bg-rose-50 border-l-4 border-rose-600 text-rose-900 text-xs rounded-r-md flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                {role === 'student' ? 'Matriculation Number' : 'Staff Username'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={role === 'student' ? 'e.g. UG/20/1042' : 'e.g. admin'}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-univ-700 focus:border-univ-700 transition font-mono font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Please contact the ICT Directorate support desk (helpdesk@futminna.edu.ng) with your matriculation credentials to reset your portal password.');
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-univ-700 focus:border-univ-700 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-univ-900 hover:bg-univ-800 active:bg-univ-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-univ-700 disabled:opacity-50 transition shadow-sm mt-3"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {role === 'student' ? 'Student' : 'Administrator'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>


        </div>

        {/* Bottom Disclaimers */}
        <div className="text-center text-[11px] text-slate-400 pt-6">
          <span>Official Academic &amp; Grading Portal &bull; Federal University of Technology, Minna</span>
        </div>
      </div>
    </div>
  );
}
