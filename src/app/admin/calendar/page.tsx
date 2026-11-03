'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  X,
  ChevronDown,
  Sparkles,
  Eye,
  SlidersHorizontal,
  Building,
  RotateCw,
  Layers,
  GraduationCap,
} from 'lucide-react';
import SemesterAcademicCalendar, { CalendarEvent } from '@/components/student/SemesterAcademicCalendar';

interface SessionItem {
  id: string;
  name: string;
  isCurrent: boolean;
  semesters: { id: string; name: string; isCurrent: boolean }[];
}

export default function AdminCalendarPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [viewMode, setViewMode] = useState<'BUILDER' | 'STUDENT_PREVIEW'>('BUILDER');
  const [semesterTab, setSemesterTab] = useState<'ALL' | 'FIRST' | 'SECOND'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Notifications
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit / Create Event Modal state
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    semesterId: '',
    week: 'Week 1',
    dateRange: '',
    title: '',
    description: '',
    category: 'ACADEMIC' as CalendarEvent['category'],
    status: 'UPCOMING' as CalendarEvent['status'],
    unit: 'Academic Registry',
  });

  // Load Sessions
  const loadSessions = async () => {
    try {
      const res = await fetch('/api/admin/sessions');
      const data = await res.json();
      if (data.sessions && data.sessions.length > 0) {
        setSessions(data.sessions);
        if (!selectedSessionId) {
          const current = data.sessions.find((s: SessionItem) => s.isCurrent) || data.sessions[0];
          setSelectedSessionId(current.id);
          loadEvents(current.id);
        }
      }
    } catch {
      setError('Failed to fetch academic sessions.');
    } finally {
      setLoading(false);
    }
  };

  // Load Events for a session
  const loadEvents = async (sessionId: string) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/calendar?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
      }
    } catch {
      setError('Failed to load session calendar events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const currentSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId),
    [sessions, selectedSessionId]
  );

  const firstSemester = useMemo(
    () => currentSession?.semesters.find((s) => s.name === 'FIRST') || currentSession?.semesters[0],
    [currentSession]
  );

  const secondSemester = useMemo(
    () => currentSession?.semesters.find((s) => s.name === 'SECOND') || currentSession?.semesters[1],
    [currentSession]
  );

  // Helper to determine if an event belongs to Second Semester
  const isSecondSemesterEvent = (evt: CalendarEvent) => {
    if (evt.semester?.name === 'SECOND') return true;
    if (evt.semester?.name === 'FIRST') return false;
    if (typeof evt.order === 'number' && evt.order >= 13) return true;
    const lowerTitle = evt.title.toLowerCase();
    if (lowerTitle.includes('second semester') && !lowerTitle.includes('resumption')) return true;
    return false;
  };

  // Partitioned lists
  const firstSemEvents = useMemo(() => events.filter((e) => !isSecondSemesterEvent(e)), [events]);
  const secondSemEvents = useMemo(() => events.filter((e) => isSecondSemesterEvent(e)), [events]);

  // Tab Events
  const tabEvents = useMemo(() => {
    if (semesterTab === 'FIRST') return firstSemEvents;
    if (semesterTab === 'SECOND') return secondSemEvents;
    return events;
  }, [semesterTab, firstSemEvents, secondSemEvents, events]);

  // Filtered Events by category
  const filteredEvents = useMemo(() => {
    if (categoryFilter === 'ALL') return tabEvents;
    return tabEvents.filter((e) => e.category === categoryFilter);
  }, [tabEvents, categoryFilter]);

  // Metric counts
  const completedCount = tabEvents.filter((e) => e.status === 'COMPLETED').length;
  const inProgressCount = tabEvents.filter((e) => e.status === 'IN_PROGRESS').length;
  const upcomingCount = tabEvents.filter((e) => e.status === 'UPCOMING').length;

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingEventId(null);
    const defaultSemId =
      semesterTab === 'SECOND'
        ? secondSemester?.id || ''
        : firstSemester?.id || '';

    setFormData({
      semesterId: defaultSemId,
      week: `Week ${tabEvents.length + 1}`,
      dateRange: '',
      title: '',
      description: '',
      category: 'ACADEMIC',
      status: 'UPCOMING',
      unit: 'Academic Registry',
    });
    setShowEventModal(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (event: CalendarEvent) => {
    setEditingEventId(event.id);
    setFormData({
      semesterId: event.semesterId || (isSecondSemesterEvent(event) ? secondSemester?.id || '' : firstSemester?.id || ''),
      week: event.week,
      dateRange: event.dateRange,
      title: event.title,
      description: event.description,
      category: event.category,
      status: event.status,
      unit: event.unit,
    });
    setShowEventModal(true);
  };

  // Submit Add / Edit
  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingEventId) {
        // Update
        const res = await fetch('/api/admin/calendar', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingEventId,
            ...formData,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update milestone.');
        setSuccess('Milestone updated successfully.');
      } else {
        // Create
        const res = await fetch('/api/admin/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: selectedSessionId,
            ...formData,
            order: events.length + 1,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create milestone.');
        setSuccess('New calendar milestone created.');
      }

      setShowEventModal(false);
      loadEvents(selectedSessionId);
    } catch (err: any) {
      setError(err.message || 'Error saving milestone.');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick toggle status
  const handleCycleStatus = async (event: CalendarEvent) => {
    const nextStatus: Record<CalendarEvent['status'], CalendarEvent['status']> = {
      UPCOMING: 'IN_PROGRESS',
      IN_PROGRESS: 'COMPLETED',
      COMPLETED: 'UPCOMING',
    };

    const newStatus = nextStatus[event.status];
    try {
      const res = await fetch('/api/admin/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: event.id,
          status: newStatus,
        }),
      });
      if (res.ok) {
        setEvents((prev) =>
          prev.map((e) => (e.id === event.id ? { ...e, status: newStatus } : e))
        );
      }
    } catch {
      setError('Failed to update status.');
    }
  };

  // Delete event
  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to remove this academic milestone?')) return;
    try {
      const res = await fetch(`/api/admin/calendar?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setSuccess('Milestone removed from calendar.');
      } else {
        const data = await res.json();
        throw new Error(data.error);
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting milestone.');
    }
  };

  // Scaffold default template for both semesters
  const handleScaffoldTemplate = async (target = 'BOTH') => {
    if (!selectedSessionId || !currentSession) return;
    if (
      events.length > 0 &&
      !confirm(
        `Reset and scaffold default standard university calendar milestones across BOTH First and Second semesters for ${currentSession.name}? This will overwrite existing events for this session.`
      )
    ) {
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'GENERATE_SESSION_TEMPLATE',
          sessionId: selectedSessionId,
          sessionName: currentSession.name,
          targetSemester: target,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to scaffold template.');

      setSuccess(data.message);
      loadEvents(selectedSessionId);
    } catch (err: any) {
      setError(err.message || 'Error scaffolding calendar template.');
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
            Institutional Calendar &amp; Sessional Controls
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
            Academic Calendar Builder
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Prepare, schedule, and moderate institutional milestones for First and Second semesters
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('BUILDER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'BUILDER'
                  ? 'bg-white text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Builder</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('STUDENT_PREVIEW')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'STUDENT_PREVIEW'
                  ? 'bg-white text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Student Live Preview</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleScaffoldTemplate('BOTH')}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
            title="Populate standard 2-semester milestone sequence"
          >
            <Sparkles className="w-3.5 h-3.5 text-univ-700" />
            <span>Generate Full Year (Both Semesters)</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Milestone</span>
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

      {/* ── SESSION SELECTION & CONTROLS ─────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
              Academic Session Being Prepared
            </label>
            <div className="relative min-w-56">
              <select
                value={selectedSessionId}
                onChange={(e) => {
                  setSelectedSessionId(e.target.value);
                  loadEvents(e.target.value);
                }}
                className="w-full appearance-none px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-univ-700 pr-8"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} Academic Session {s.isCurrent ? '(Active Live)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
              Category Filter
            </label>
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-univ-700 pr-8"
              >
                <option value="ALL">All Categories ({tabEvents.length})</option>
                <option value="REGISTRATION">Registration Milestones</option>
                <option value="ACADEMIC">Teaching &amp; Resumptions</option>
                <option value="ASSESSMENT">Continuous Assessments (CA)</option>
                <option value="EXAMINATION">Final Examinations</option>
                <option value="SENATE">Senate Approvals &amp; Results</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadEvents(selectedSessionId)}
          className="self-start sm:self-end inline-flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold transition"
        >
          <RotateCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload</span>
        </button>
      </section>

      {/* ── SEMESTER TABS ───────────────────────────────────────────────── */}
      <section className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          {/* All Semesters */}
          <button
            type="button"
            onClick={() => setSemesterTab('ALL')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              semesterTab === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Both Semesters ({events.length})</span>
          </button>

          {/* First Semester */}
          <button
            type="button"
            onClick={() => setSemesterTab('FIRST')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              semesterTab === 'FIRST'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>First Semester ({firstSemEvents.length})</span>
            {firstSemester?.isCurrent && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Second Semester */}
          <button
            type="button"
            onClick={() => setSemesterTab('SECOND')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              semesterTab === 'SECOND'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>Second Semester ({secondSemEvents.length})</span>
            {secondSemester?.isCurrent && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
          <span>First: <strong className="text-slate-900">{firstSemEvents.length}</strong></span>
          <span>&bull;</span>
          <span>Second: <strong className="text-slate-900">{secondSemEvents.length}</strong></span>
        </div>
      </section>

      {/* ── METRIC STRIP ────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
        <div className="px-5 py-3.5">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            {semesterTab === 'ALL' ? 'Total Milestones' : `${semesterTab === 'FIRST' ? '1st Sem' : '2nd Sem'} Milestones`}
          </p>
          <p className="text-xl font-bold font-mono text-slate-950">{tabEvents.length}</p>
          <p className="text-[11px] text-slate-500">Scheduled calendar events</p>
        </div>

        <div className="px-5 py-3.5">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Completed
          </p>
          <p className="text-xl font-bold font-mono text-emerald-700">{completedCount}</p>
          <p className="text-[11px] text-slate-500">Concluded university phases</p>
        </div>

        <div className="px-5 py-3.5">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Currently In Progress
          </p>
          <p className="text-xl font-bold font-mono text-univ-800">{inProgressCount}</p>
          <p className="text-[11px] text-slate-500">Active institutional window</p>
        </div>

        <div className="px-5 py-3.5">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Upcoming Phases
          </p>
          <p className="text-xl font-bold font-mono text-slate-600">{upcomingCount}</p>
          <p className="text-[11px] text-slate-500">Pending semester schedule</p>
        </div>
      </section>

      {/* ── MAIN CONTENT VIEW (Builder Table OR Student Dashboard Preview) ── */}
      {viewMode === 'BUILDER' ? (
        <section>
          <div className="flex items-center justify-between pb-3">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-950">
                Milestones Sequence &bull; {semesterTab === 'FIRST' ? 'First Semester' : semesterTab === 'SECOND' ? 'Second Semester' : 'Full Session'} ({filteredEvents.length})
              </h2>
              <p className="text-xs text-slate-500">
                Click on any status badge to advance lifecycle (UPCOMING &rarr; IN PROGRESS &rarr; COMPLETED)
              </p>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Senate Approved Calendar Standard
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 border-t border-slate-200">
              <div className="w-6 h-6 border-2 border-univ-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading academic calendar...</p>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-t border-b border-slate-200">
                <thead className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px] font-mono">
                  <tr>
                    <th className="py-3 px-3 text-center w-20">Week / Phase</th>
                    <th className="py-3 px-3 text-center w-24">Semester</th>
                    <th className="py-3 px-4 w-44">Date Window</th>
                    <th className="py-3 px-4">Milestone Title &amp; Description</th>
                    <th className="py-3 px-3 text-center w-28">Category</th>
                    <th className="py-3 px-3 text-center w-28">Status</th>
                    <th className="py-3 px-4 w-44">Responsible Unit</th>
                    <th className="py-3 pl-4 text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEvents.map((evt) => {
                    const isSecond = isSecondSemesterEvent(evt);

                    return (
                      <tr key={evt.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Week Badge */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {evt.week}
                          </span>
                        </td>

                        {/* Semester Badge */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider ${
                              isSecond
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                            }`}
                          >
                            {isSecond ? '2nd Sem' : '1st Sem'}
                          </span>
                        </td>

                        {/* Date Range */}
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-900 text-xs">
                          {evt.dateRange}
                        </td>

                        {/* Title & Description */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-950 text-xs">{evt.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 max-w-xl line-clamp-2">
                            {evt.description}
                          </div>
                        </td>

                        {/* Category Badge */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-200">
                            {evt.category}
                          </span>
                        </td>

                        {/* Clickable Status Badge */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleCycleStatus(evt)}
                            title="Click to advance status"
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition ${
                              evt.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                : evt.status === 'IN_PROGRESS'
                                ? 'bg-univ-50 text-univ-800 border border-univ-200 hover:bg-univ-100'
                                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {evt.status === 'IN_PROGRESS' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-univ-700 animate-pulse" />
                            )}
                            <span>{evt.status.replace('_', ' ')}</span>
                          </button>
                        </td>

                        {/* Responsible Unit */}
                        <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{evt.unit}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 pl-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(evt)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition"
                              title="Edit Milestone"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(evt.id)}
                              className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                              title="Delete Milestone"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center border-t border-slate-200 space-y-3">
              <Calendar className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs text-slate-500 font-medium">
                No calendar milestones defined yet for {semesterTab === 'ALL' ? 'this session' : `${semesterTab === 'FIRST' ? 'First' : 'Second'} Semester`}.
              </p>
              <button
                type="button"
                onClick={() => handleScaffoldTemplate('BOTH')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Scaffold Standard Both-Semester Template</span>
              </button>
            </div>
          )}
        </section>
      ) : (
        /* ── STUDENT DASHBOARD STYLE PREVIEW ────────────────────────── */
        <section className="space-y-4">
          <div className="p-4 bg-univ-50/70 border border-univ-200 rounded-xl flex items-center justify-between text-xs text-univ-950">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-univ-700 shrink-0" />
              <span>
                <strong>Live Student View:</strong> Below is the interactive dual-semester calendar undergraduates see on their portal dashboard with live status indicators and Senate schedules.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('BUILDER')}
              className="text-xs font-bold text-univ-800 hover:text-univ-950 underline underline-offset-4 shrink-0"
            >
              Back to Builder
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl p-6 bg-white">
            <SemesterAcademicCalendar
              sessionName={currentSession?.name || '2024/2025'}
              semesterName={currentSession?.semesters.find((s) => s.isCurrent)?.name || 'FIRST'}
              events={events}
            />
          </div>
        </section>
      )}

      {/* ── ADD / EDIT MILESTONE MODAL ───────────────────────────────────── */}
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-950 text-sm">
                  {editingEventId ? 'Edit Academic Milestone' : 'New Calendar Milestone'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {currentSession?.name} Academic Session Schedule
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEventModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvent} className="space-y-4">
              {/* Semester Selector */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Target Academic Semester
                </label>
                <select
                  value={formData.semesterId}
                  onChange={(e) => setFormData({ ...formData, semesterId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-univ-700"
                  required
                >
                  <option value="">Select Semester...</option>
                  {currentSession?.semesters.map((sem) => (
                    <option key={sem.id} value={sem.id}>
                      {sem.name === 'FIRST' ? 'First Semester' : 'Second Semester'} {sem.isCurrent ? '(Active Live Term)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Week / Phase
                  </label>
                  <input
                    type="text"
                    value={formData.week}
                    onChange={(e) => setFormData({ ...formData, week: e.target.value })}
                    placeholder="e.g. Week 1, Mid-Term, Week 13–15, Senate"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-univ-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Date Range
                  </label>
                  <input
                    type="text"
                    value={formData.dateRange}
                    onChange={(e) => setFormData({ ...formData, dateRange: e.target.value })}
                    placeholder="e.g. Oct 14 – Oct 19, 2024"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-univ-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Milestone Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Commencement of Lectures / Examinations"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-univ-700"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed guidelines or procedural instructions for students and faculties..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-univ-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as CalendarEvent['category'] })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-univ-700"
                  >
                    <option value="REGISTRATION">REGISTRATION</option>
                    <option value="ACADEMIC">ACADEMIC</option>
                    <option value="ASSESSMENT">ASSESSMENT (CA)</option>
                    <option value="EXAMINATION">EXAMINATION</option>
                    <option value="SENATE">SENATE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as CalendarEvent['status'] })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-univ-700"
                  >
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Responsible Administrative Unit
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g. ICT Directorate, Academic Registry, Central Examination Committee"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-univ-700"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
                >
                  {actionLoading ? 'Saving...' : editingEventId ? 'Update Milestone' : 'Add Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
