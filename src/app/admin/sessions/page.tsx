'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Check,
  X,
  Plus,
  RotateCw,
  Edit2,
  ShieldAlert,
  Archive,
  Clock,
  BookOpen,
} from 'lucide-react';

interface Semester {
  id: string;
  name: string;
  isCurrent: boolean;
  registrationOpen: boolean;
  resultsPublished: boolean;
  registrationsCount: number;
  calendarEventsCount: number;
  milestoneStats?: {
    total: number;
    completed: number;
    inProgress: number;
    upcoming: number;
    isAllCompleted: boolean;
    completionPercentage: number;
    pendingEvents: PendingMilestone[];
  };
}

interface PendingMilestone {
  id: string;
  week: string;
  title: string;
  status: string;
  dateRange: string;
}

interface SessionItem {
  id: string;
  name: string;
  isCurrent: boolean;
  registrationsCount: number;
  isRegistrationOpen: boolean;
  semesters: Semester[];
  milestoneStats: {
    total: number;
    completed: number;
    inProgress: number;
    upcoming: number;
    pendingEvents: PendingMilestone[];
    isAllCompleted: boolean;
    completionPercentage: number;
  };
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Tab filter
  const [tabFilter, setTabFilter] = useState<'ALL' | 'ACTIVE' | 'PAST' | 'UPCOMING'>('ALL');

  // Notifications
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal: Add New Session
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [scaffoldCalendar, setScaffoldCalendar] = useState(true);

  // Modal: Edit Session Name
  const [editingSession, setEditingSession] = useState<{ id: string; name: string } | null>(null);

  // Modal / Guard: Calendar Gating Warning
  const [guardModal, setGuardModal] = useState<{
    show: boolean;
    type: 'SEMESTER' | 'SESSION';
    targetId: string;
    targetName: string;
    pendingMilestones: PendingMilestone[];
    sessionId: string;
    semesterId?: string;
  } | null>(null);

  const fetchSessions = () => {
    setLoading(true);
    fetch('/api/admin/sessions')
      .then((r) => r.json())
      .then((data) => {
        if (data.sessions) setSessions(data.sessions);
      })
      .catch(() => setError('Failed to load academic session controls.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Find active session & active semester
  const activeSession = useMemo(() => sessions.find((s) => s.isCurrent), [sessions]);
  const activeSemester = useMemo(
    () => activeSession?.semesters.find((sem) => sem.isCurrent),
    [activeSession]
  );

  // Categorize sessions into Active, Past, Upcoming
  const { currentSessions, pastSessions, upcomingSessions } = useMemo(() => {
    const active = sessions.filter((s) => s.isCurrent);
    const activeName = activeSession?.name || '';
    const past: SessionItem[] = [];
    const upcoming: SessionItem[] = [];

    sessions.forEach((s) => {
      if (s.isCurrent) return;
      if (activeName && s.name < activeName) {
        past.push(s);
      } else {
        upcoming.push(s);
      }
    });

    return {
      currentSessions: active,
      pastSessions: past,
      upcomingSessions: upcoming,
    };
  }, [sessions, activeSession]);

  // Filtered sessions for the directory list
  const displayedSessions = useMemo(() => {
    if (tabFilter === 'ACTIVE') return currentSessions;
    if (tabFilter === 'PAST') return pastSessions;
    if (tabFilter === 'UPCOMING') return upcomingSessions;
    return sessions;
  }, [tabFilter, sessions, currentSessions, pastSessions, upcomingSessions]);

  // Handler: Toggle Unified Session Course Registration (Both Semesters concurrently)
  const handleToggleSessionRegistration = async (sessionId: string, value: boolean) => {
    setError(null);
    setSuccess(null);
    setUpdatingId(sessionId + 'REG');
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_REGISTRATION', sessionId, value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update course registration.');

      setSuccess(
        data.message ||
          `Course registration window ${value ? 'unlocked and opened' : 'closed and locked'} for both semesters.`
      );
      fetchSessions();
    } catch (err: any) {
      setError(err.message || 'Error updating course registration.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Handler: Toggle Results Publication (Per-semester after each term exams)
  const handleToggleResults = async (semesterId: string, value: boolean) => {
    setError(null);
    setSuccess(null);
    setUpdatingId(semesterId + 'RES');
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_RESULTS', semesterId, value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update results publication.');

      setSuccess(`Results publication mode updated.`);
      fetchSessions();
    } catch (err: any) {
      setError(err.message || 'Error updating results publication.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Handler: Set Active Semester (Enforcing Calendar Completion Gate)
  const handleSetActiveSemester = async (
    targetSemesterId: string,
    targetSemesterName: string,
    parentSession: SessionItem,
    force = false
  ) => {
    setError(null);
    setSuccess(null);
    setUpdatingId(targetSemesterId);

    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SET_CURRENT_SEMESTER',
          semesterId: targetSemesterId,
          force,
        }),
      });

      const data = await res.json();

      // Check if blocked by calendar completion guard!
      if (!res.ok && data.blocked) {
        setGuardModal({
          show: true,
          type: 'SEMESTER',
          targetId: targetSemesterId,
          targetName: `${targetSemesterName} Semester`,
          pendingMilestones: data.pendingMilestones || parentSession.milestoneStats.pendingEvents,
          sessionId: parentSession.id,
          semesterId: data.semesterId,
        });
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Failed to activate semester.');

      setSuccess(data.message || `Activated ${targetSemesterName} Semester.`);
      setGuardModal(null);
      fetchSessions();
    } catch (err: any) {
      setError(err.message || 'Error activating semester.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Handler: Set Active Session (Enforcing Year-Transition Calendar Gate & Blocking Past Sessions)
  const handleSetActiveSession = async (
    targetSessionId: string,
    targetSessionName: string,
    targetSession: SessionItem,
    force = false
  ) => {
    // Client-side block for past sessions
    if (activeSession && targetSession.name < activeSession.name) {
      setError(`Cannot activate historical session ${targetSession.name}. Concluded past sessions are archived.`);
      return;
    }

    setError(null);
    setSuccess(null);
    setUpdatingId(targetSessionId);

    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SET_CURRENT_SESSION',
          sessionId: targetSessionId,
          force,
        }),
      });

      const data = await res.json();

      // Check if blocked by calendar completion guard!
      if (!res.ok && data.blocked) {
        setGuardModal({
          show: true,
          type: 'SESSION',
          targetId: targetSessionId,
          targetName: `${targetSessionName} Academic Session`,
          pendingMilestones: data.pendingMilestones || activeSession?.milestoneStats.pendingEvents || [],
          sessionId: activeSession?.id || targetSessionId,
        });
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Failed to activate session.');

      setSuccess(data.message || `Activated ${targetSessionName} Academic Session.`);
      setGuardModal(null);
      fetchSessions();
    } catch (err: any) {
      setError(err.message || 'Error activating session.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Handler: Mark all milestones as completed and proceed
  const handleAuthorizeAndComplete = async () => {
    if (!guardModal) return;
    setActionLoading(true);
    try {
      const completeRes = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COMPLETE_ALL_MILESTONES',
          sessionId: guardModal.sessionId,
          semesterId: guardModal.semesterId,
        }),
      });

      if (!completeRes.ok) {
        const d = await completeRes.json();
        throw new Error(d.error || 'Failed to complete milestones.');
      }

      if (guardModal.type === 'SEMESTER') {
        await handleSetActiveSemester(guardModal.targetId, guardModal.targetName, activeSession!, true);
      } else {
        await handleSetActiveSession(guardModal.targetId, guardModal.targetName, activeSession!, true);
      }
    } catch (err: any) {
      setError(err.message || 'Error authorizing transition.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Create New Session (With two semesters)
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_SESSION',
          name: newSessionName.trim(),
          scaffoldCalendar,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create academic session.');

      setSuccess(data.message || `Session ${newSessionName} created with First and Second semesters.`);
      setShowAddSessionModal(false);
      setNewSessionName('');
      fetchSessions();
    } catch (err: any) {
      setError(err.message || 'Error creating session.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Update Session Name
  const handleUpdateSessionName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession || !editingSession.name.trim()) return;

    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_SESSION',
          sessionId: editingSession.id,
          name: editingSession.name.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to rename session.');

      setSuccess(data.message || 'Session name updated.');
      setEditingSession(null);
      fetchSessions();
    } catch (err: any) {
      setError(err.message || 'Error updating session.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-univ-700 mb-1">
            System &amp; Registry Governance
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
            Session &amp; Academic Controls
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage academic years, session-wide course registration, calendar gating rules, and past session archives
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSessions}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddSessionModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Session</span>
          </button>
        </div>
      </section>

      {/* ── NOTIFICATIONS ───────────────────────────────────────────────── */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-800 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── ACTIVE SESSION COMMAND STRIP (With Unified Course Reg & Calendar Gate) ── */}
      {activeSession && (
        <section className="border border-slate-200 rounded-xl overflow-hidden bg-white divide-y divide-slate-100">
          {/* Top Live Bar */}
          <div className="px-6 py-4 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Active Live Session
                  </span>
                  <span className="text-base font-bold text-slate-950 font-mono">
                    {activeSession.name} Academic Calendar
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Current Term: <strong className="text-slate-900 font-semibold">{activeSemester?.name || 'FIRST'} Semester</strong> &bull; {activeSession.registrationsCount} Undergraduate Enrollments Recorded
                </p>
              </div>
            </div>

            {/* Calendar Completion Status Badge */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[11px] font-semibold text-slate-900 font-mono">
                  {activeSession.milestoneStats.completed} / {activeSession.milestoneStats.total} Milestones Completed
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {activeSession.milestoneStats.isAllCompleted
                    ? 'Calendar 100% finished'
                    : `${activeSession.milestoneStats.pendingEvents.length} milestones pending`}
                </div>
              </div>

              <Link
                href={`/admin/calendar?sessionId=${activeSession.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                <Calendar className="w-3.5 h-3.5 text-univ-700" />
                <span>Open Calendar Builder</span>
              </Link>
            </div>
          </div>

          {/* Unified Single Course Registration Control for the Session */}
          <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  activeSession.isRegistrationOpen
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Session Course Registration Window
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      activeSession.isRegistrationOpen
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {activeSession.isRegistrationOpen ? 'Both Semesters Unlocked' : 'Both Semesters Locked'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Single enrollment window: Undergraduates register for both First and Second semester curriculum concurrently
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggleSessionRegistration(activeSession.id, !activeSession.isRegistrationOpen)}
              disabled={updatingId === activeSession.id + 'REG'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition shrink-0 ${
                activeSession.isRegistrationOpen
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {activeSession.isRegistrationOpen ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>WINDOW OPEN (LOCK)</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>WINDOW LOCKED (OPEN)</span>
                </>
              )}
            </button>
          </div>

          {/* Milestone Progress Bar & Gating Alert */}
          {(() => {
            const activeSemStats = activeSemester?.milestoneStats || activeSession.milestoneStats;
            const termName = activeSemester?.name === 'SECOND' ? 'Second Semester' : 'First Semester';
            const nextTargetName = activeSemester?.name === 'SECOND' ? 'the next academic year' : 'Second Semester';

            return (
              <div className="px-6 py-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">
                      {termName} Milestones Gate ({activeSemStats.completed}/{activeSemStats.total} Completed)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      Year Sessional: {activeSession.milestoneStats.completed}/{activeSession.milestoneStats.total}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-700">
                    {activeSemStats.completionPercentage}% Term Complete
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      activeSemStats.isAllCompleted ? 'bg-emerald-600' : 'bg-univ-600'
                    }`}
                    style={{ width: `${activeSemStats.completionPercentage}%` }}
                  />
                </div>

                {/* Gating Notice: Explaining the business rule */}
                {!activeSemStats.isAllCompleted ? (
                  <div className="p-3 bg-amber-50/70 border border-amber-200/90 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Transition Policy Guard:</span>{' '}
                        <span>
                          You can only finish {termName} and move to {nextTargetName} once all {activeSemStats.total} milestones in the academic calendar for this semester are marked as COMPLETED.
                        </span>
                        <div className="text-[11px] text-amber-700 mt-1 font-mono">
                          Pending {termName} milestones: {activeSemStats.pendingEvents.map((e) => e.title).join(' • ')}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/admin/calendar?sessionId=${activeSession.id}`}
                      className="self-start sm:self-auto text-xs font-bold text-amber-800 underline underline-offset-4 hover:text-amber-950 shrink-0"
                    >
                      Complete in Calendar &rarr;
                    </Link>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>{termName} Calendar Ratified:</strong> All {activeSemStats.total} milestones for this term are completed. This semester is cleared for conclusion and transition to {nextTargetName}.
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </section>
      )}

      {/* ── DIRECTORY TAB NAVIGATION (All / Active / Past History / Upcoming) ─ */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            {[
              { key: 'ALL', label: `All Sessions (${sessions.length})` },
              { key: 'ACTIVE', label: `Current Active (${currentSessions.length})` },
              { key: 'PAST', label: `Past / Archive (${pastSessions.length})` },
              { key: 'UPCOMING', label: `Upcoming Prepared (${upcomingSessions.length})` },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTabFilter(key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  tabFilter === key
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 font-mono">
            {displayedSessions.length} session{displayedSessions.length !== 1 ? 's' : ''} listed
          </span>
        </div>

        {/* ── SESSIONS LIST (Flat editorial document) ─────────────────────── */}
        <div className="space-y-6">
          {displayedSessions.map((sess) => {
            const isPast = activeSession ? sess.name < activeSession.name : false;
            const isUpcoming = activeSession ? sess.name > activeSession.name : false;

            return (
              <div
                key={sess.id}
                className={`border rounded-xl overflow-hidden bg-white divide-y divide-slate-100 transition ${
                  sess.isCurrent
                    ? 'border-univ-400 ring-1 ring-univ-200'
                    : isPast
                    ? 'border-slate-200 bg-slate-50/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Session Header Bar */}
                <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        sess.isCurrent
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isPast
                          ? 'bg-slate-100 text-slate-500 border border-slate-200'
                          : 'bg-univ-50 text-univ-700 border border-univ-200'
                      }`}
                    >
                      {isPast ? <Archive className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono text-slate-950">
                          {sess.name} Academic Session
                        </span>

                        {sess.isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Live Active
                          </span>
                        ) : isPast ? (
                          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            Concluded &bull; Archived
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-univ-50 text-univ-800 border border-univ-200">
                            Upcoming Planned
                          </span>
                        )}

                        {!isPast && (
                          <button
                            type="button"
                            onClick={() => setEditingSession({ id: sess.id, name: sess.name })}
                            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
                            title="Rename Session"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {sess.semesters.length} Semesters configured &bull; {sess.registrationsCount} Student Enrolments &bull; {sess.milestoneStats.completed}/{sess.milestoneStats.total} Milestones Concluded
                      </p>
                    </div>
                  </div>

                  {/* Top Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Link
                      href={`/admin/calendar?sessionId=${sess.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Session Calendar ({sess.milestoneStats.total})</span>
                    </Link>

                    {/* Cannot activate a past session! Only upcoming sessions can be activated */}
                    {isPast ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-400 border border-slate-200 select-none">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Archived (Cannot Re-activate)</span>
                      </span>
                    ) : !sess.isCurrent ? (
                      <button
                        type="button"
                        onClick={() => handleSetActiveSession(sess.id, sess.name, sess)}
                        disabled={updatingId === sess.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition bg-slate-900 hover:bg-slate-800 text-white"
                      >
                        {updatingId === sess.id ? 'Switching...' : 'Set as Active Session'}
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Unified Course Registration Control Strip for the Session */}
                {!isPast && (
                  <div className="px-6 py-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <BookOpen className={`w-4 h-4 ${sess.isRegistrationOpen ? 'text-emerald-700' : 'text-slate-400'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            Course Registration
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                              sess.isRegistrationOpen
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {sess.isRegistrationOpen ? 'Both Semesters Open' : 'Closed'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Registers both First &amp; Second semester curriculum simultaneously
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleSessionRegistration(sess.id, !sess.isRegistrationOpen)}
                      disabled={updatingId === sess.id + 'REG'}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-mono font-semibold transition ${
                        sess.isRegistrationOpen
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {sess.isRegistrationOpen ? (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                          <span>OPEN (CLICK TO LOCK)</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>LOCKED (CLICK TO OPEN)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Semesters in Session (First and Second Semesters) */}
                <div className="divide-y divide-slate-100">
                  {sess.semesters.map((sem) => (
                    <div
                      key={sem.id}
                      className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors"
                    >
                      {/* Semester Info */}
                      <div className="flex items-start gap-3 min-w-[200px]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              {sem.name} Semester
                            </span>
                            {sem.isCurrent && (
                              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                                Active Term
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {sem.registrationsCount} Registered Courses &bull; Calendar Linked
                          </p>
                        </div>
                      </div>

                      {/* Controls Group */}
                      <div className="flex flex-wrap items-center gap-6 md:gap-8">
                        {/* Senate Results Publishing Toggle */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-[11px] font-semibold text-slate-800">
                              Senate Results
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {sem.resultsPublished ? 'Visible to students' : 'Draft / Moderation'}
                            </div>
                          </div>

                          {!isPast ? (
                            <button
                              type="button"
                              onClick={() => handleToggleResults(sem.id, !sem.resultsPublished)}
                              disabled={updatingId === sem.id + 'RES'}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                                sem.resultsPublished
                                  ? 'bg-univ-50 text-univ-800 border border-univ-200 hover:bg-univ-100'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                              }`}
                            >
                              {sem.resultsPublished ? (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-univ-700" />
                                  <span>PUBLISHED</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                                  <span>DRAFT</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              PUBLISHED &bull; ARCHIVED
                            </span>
                          )}
                        </div>

                        {/* Activate Semester Button (Gated by Calendar Completion) */}
                        <div className="w-28 text-right">
                          {isPast ? (
                            <span className="text-xs font-mono text-slate-400">
                              Archived Term
                            </span>
                          ) : !sem.isCurrent ? (
                            <button
                              type="button"
                              onClick={() => handleSetActiveSemester(sem.id, sem.name, sess)}
                              disabled={updatingId === sem.id}
                              className="text-xs px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 rounded-lg font-semibold transition"
                            >
                              {updatingId === sem.id ? 'Switching...' : 'Activate Term'}
                            </button>
                          ) : (
                            <span className="text-xs font-mono text-emerald-700 font-bold flex items-center justify-end gap-1">
                              <Check className="w-3.5 h-3.5" /> Current
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── MODAL: ADD NEW SESSION (WITH 2 SEMESTERS) ────────────────────── */}
      {showAddSessionModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-950 text-sm">Add New Academic Session</h3>
                <p className="text-[11px] text-slate-500">Initialize a new university academic year</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSessionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Academic Session Name
                </label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="e.g. 2025/2026"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-univ-700"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Standard format: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">YYYY/YYYY</code>.
                </p>
              </div>

              {/* Notice that two semesters are created automatically */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs">
                <span className="font-semibold text-slate-900 block">
                  Automated Two-Semester Setup:
                </span>
                <p className="text-[11px] text-slate-500">
                  This will automatically create both <strong className="text-slate-800 font-bold">FIRST Semester</strong> and <strong className="text-slate-800 font-bold">SECOND Semester</strong> inside this new academic session.
                </p>
              </div>

              {/* Scaffolding Checkbox */}
              <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={scaffoldCalendar}
                  onChange={(e) => setScaffoldCalendar(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-univ-700 focus:ring-univ-700"
                />
                <span>
                  <strong>Scaffold standard academic calendar template:</strong> Auto-populate the 13 institutional milestones (lectures, matriculation, CA tests, final exams, senate ratifications) for this session.
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSessionModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
                >
                  {actionLoading ? 'Creating Session...' : 'Create Academic Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: RENAME SESSION ────────────────────────────────────────── */}
      {editingSession && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-950 text-sm">Rename Academic Session</h3>
                <p className="text-[11px] text-slate-500">Update calendar year identifier</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSessionName} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Session Name
                </label>
                <input
                  type="text"
                  value={editingSession.name}
                  onChange={(e) => setEditingSession({ ...editingSession, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-univ-700"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
                >
                  {actionLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CALENDAR GATING GUARD (BLOCKING TRANSITION IF INCOMPLETE) ── */}
      {guardModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-950 text-sm">
                  Academic Calendar Gating Policy Alert
                </h3>
                <p className="text-xs text-rose-700 font-medium mt-0.5">
                  Cannot finish the semester or transition to {guardModal.targetName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGuardModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Institutional governance requires all calendar milestones for the current semester to be marked as <strong className="text-slate-900 font-bold uppercase">COMPLETED</strong> before the term can conclude or transition to the next year.
            </p>

            {/* List of Incomplete Milestones */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                {guardModal.pendingMilestones.length} Pending Milestone(s) Incomplete:
              </span>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-slate-50/50">
                {guardModal.pendingMilestones.map((m) => (
                  <div key={m.id} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-900">{m.title}</span>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                        {m.week} &bull; {m.dateRange}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setGuardModal(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>

              <Link
                href={`/admin/calendar?sessionId=${guardModal.sessionId}`}
                onClick={() => setGuardModal(null)}
                className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg text-center transition"
              >
                Manage in Calendar Builder
              </Link>

              <button
                type="button"
                onClick={handleAuthorizeAndComplete}
                disabled={actionLoading}
                className="px-4 py-2 bg-univ-900 hover:bg-univ-800 text-white text-xs font-semibold rounded-lg transition shadow-sm"
              >
                {actionLoading ? 'Authorizing...' : 'Mark All Completed & Advance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
