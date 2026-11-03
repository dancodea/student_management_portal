'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  History,
  Info,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Send,
} from 'lucide-react';

interface Course {
  id: string;
  code: string;
  title: string;
  unit: number;
  level: number;
  semester: string;
}

interface Score {
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  gradePoint: number;
}

interface Registration {
  id: string;
  course: Course;
  score: Score | null;
}

interface SemesterInfo {
  id: string;
  name: string;
  isCurrent: boolean;
  registrationOpen: boolean;
  resultsPublished: boolean;
}

interface PastSemester {
  id: string;
  name: string;
  registrationOpen: boolean;
  resultsPublished: boolean;
  registrations: Registration[];
}

interface PastSession {
  id: string;
  name: string;
  semesters: PastSemester[];
}

export default function StudentCoursesPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'register' | 'history'>('register');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const [student, setStudent] = useState<any>(null);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [semesters, setSemesters] = useState<SemesterInfo[]>([]);
  const [coursesBySemester, setCoursesBySemester] = useState<Record<string, Course[]>>({});
  // selections: { [semesterId]: Set<courseId> }
  const [selections, setSelections] = useState<Record<string, Set<string>>>({});
  // staged: what's been fetched from DB
  const [savedSelections, setSavedSelections] = useState<Record<string, string[]>>({});
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);

  useEffect(() => {
    fetch('/api/student/courses')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setStudent(data.student);
          setCurrentSession(data.currentSession);
          setSemesters(data.semesters || []);
          setCoursesBySemester(data.coursesBySemester || {});
          setPastSessions(data.pastSessions || []);
          const saved = data.registeredCourseIds || {};
          setSavedSelections(saved);
          // Initialise local selections to match saved
          const initial: Record<string, Set<string>> = {};
          for (const [semId, ids] of Object.entries(saved)) {
            initial[semId] = new Set(ids as string[]);
          }
          setSelections(initial);
          if (data.pastSessions?.length > 0) {
            setExpandedSession(data.pastSessions[0].id);
          }
        }
      })
      .catch(() => setError('Failed to load course registration data.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleCourse = (semesterId: string, courseId: string) => {
    setError(null);
    setSuccess(null);
    setSelections((prev) => {
      const current = new Set(prev[semesterId] ?? []);
      const isSaved = (savedSelections[semesterId] ?? []).includes(courseId);
      if (isSaved && current.has(courseId)) return prev;
      if (current.has(courseId)) {
        current.delete(courseId);
      } else {
        current.add(courseId);
      }
      return { ...prev, [semesterId]: current };
    });
  };

  const selectAll = (semesterId: string, semesterName: string) => {
    const courses = coursesBySemester[semesterName] ?? [];
    setSelections((prev) => ({
      ...prev,
      [semesterId]: new Set(courses.map((c) => c.id)),
    }));
  };

  const clearAll = (semesterId: string) => {
    setSelections((prev) => ({
      ...prev,
      [semesterId]: new Set(savedSelections[semesterId] ?? []),
    }));
  };

  const resetToSaved = () => {
    const reset: Record<string, Set<string>> = {};
    for (const [semId, ids] of Object.entries(savedSelections)) {
      reset[semId] = new Set(ids);
    }
    setSelections(reset);
    setError(null);
    setSuccess(null);
  };

  const totalUnitsBySemester = useMemo(() => {
    const result: Record<string, number> = {};
    for (const sem of semesters) {
      const courses = coursesBySemester[sem.name] ?? [];
      const selected = selections[sem.id] ?? new Set();
      result[sem.id] = courses
        .filter((c) => selected.has(c.id))
        .reduce((sum, c) => sum + c.unit, 0);
    }
    return result;
  }, [semesters, coursesBySemester, selections]);

  const hasChanges = useMemo(() => {
    for (const sem of semesters) {
      const saved = new Set(savedSelections[sem.id] ?? []);
      const current = selections[sem.id] ?? new Set();
      if (saved.size !== current.size) return true;
      for (const id of current) {
        if (!saved.has(id)) return true;
      }
    }
    return false;
  }, [semesters, savedSelections, selections]);

  const anyRegistrationOpen = semesters.some((s) => s.registrationOpen);
  const incompleteOpenSemesters = semesters.filter((semester) => {
    if (!semester.registrationOpen || !(coursesBySemester[semester.name]?.length)) return false;
    const units = totalUnitsBySemester[semester.id] ?? 0;
    return units < 15 || units > 24;
  });
  const canSubmitRegistration = hasChanges && incompleteOpenSemesters.length === 0;

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!hasChanges) {
      setError('Select or unselect at least one course before saving your registration.');
      return;
    }
    if (incompleteOpenSemesters.length > 0) {
      setError(`Select between 15 and 24 units for each open semester before registering. Incomplete: ${incompleteOpenSemesters.map((semester) => `${semester.name} Semester`).join(', ')}.`);
      return;
    }

    const courseSelections: Record<string, string[]> = {};
    for (const sem of semesters) {
      if (sem.registrationOpen) {
        courseSelections[sem.id] = Array.from(selections[sem.id] ?? []);
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/student/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSelections }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed.');
      if (data.warning) setError(`${data.message} ${data.warning}`);
      else setSuccess(data.message);
      // Reconcile local state with the registrations actually saved by the server.
      const persisted = data.registeredCourseIds || savedSelections;
      setSavedSelections(persisted);
      const persistedSelections: Record<string, Set<string>> = {};
      for (const [semId, ids] of Object.entries(persisted) as [string, string[]][]) {
        persistedSelections[semId] = new Set(ids);
      }
      setSelections(persistedSelections);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 text-xs font-mono">
        <div className="w-5 h-5 border-2 border-univ-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span>Loading departmental curriculum...</span>
      </div>
    );
  }

  const totalAllUnits = Object.values(totalUnitsBySemester).reduce((s, u) => s + u, 0);

  return (
    <div className="space-y-8 pb-16">
      {/* ── PAGE HEADER ────────────────────────────────────────────── */}
      <section className="pb-6 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-mono text-univ-800 font-semibold uppercase tracking-wider">
            {currentSession?.name ?? 'No Active Session'} &bull; Course Management
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
          Course Enrollment &amp; Registration
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Department of {student?.department?.name} &bull; {student?.level} Level &bull; Matric No:{' '}
          <strong className="text-slate-800 font-mono">{student?.matricNo}</strong>
        </p>

        {/* Level Policy Notice */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2.5 text-xs text-slate-700">
          <Info className="w-4 h-4 text-univ-700 shrink-0" />
          <span>
            <strong>Level-Restricted Enrollment Policy:</strong> You are enrolled in <strong className="text-univ-800">{student?.level} Level</strong>. In accordance with university academic regulations, you may only register courses designated for your current level. Courses above or below your level cannot be selected.
          </span>
        </div>
      </section>

      {/* ── TABS ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {[
          { key: 'register', label: 'Register Courses', icon: ClipboardList },
          { key: 'history', label: 'Past Sessions', icon: History },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key as 'register' | 'history')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === key
                ? 'border-univ-700 text-univ-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── ALERTS ─────────────────────────────────────────────────── */}
      {error && (
        <div className="p-3 border-l-4 border-rose-600 bg-rose-50/70 rounded-r-lg flex items-center gap-2.5 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 border-l-4 border-emerald-600 bg-emerald-50/70 rounded-r-lg flex items-center gap-2.5 text-emerald-800 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: REGISTER COURSES
          ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'register' && (
        <div className="space-y-10">
          {!currentSession ? (
            <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
              <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs">No active academic session is configured.</p>
            </div>
          ) : (
            <>
              {/* ── SESSION-WIDE SUMMARY & REGISTER BUTTON ─────────── */}
              <section className="border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                    Session Total Credit Load
                  </p>
                  <p className="text-2xl font-bold font-mono tracking-tight text-slate-950">
                    {totalAllUnits} Units
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      across {semesters.length} semester{semesters.length !== 1 ? 's' : ''}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {Object.values(selections).reduce((s, set) => s + set.size, 0)} courses
                    selected — registered courses are locked; you can change new selections before saving.
                  </p>
                  {anyRegistrationOpen && incompleteOpenSemesters.length > 0 && (
                    <p className="text-[11px] font-medium text-amber-700">
                      Select 15–24 units in each open semester to enable registration.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                  {hasChanges && (
                    <button
                      type="button"
                      onClick={resetToSaved}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-medium transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset
                    </button>
                  )}
                  {anyRegistrationOpen && (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting || !canSubmitRegistration}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-univ-900 hover:bg-univ-800 disabled:opacity-40 text-white text-xs font-semibold transition"
                    >
                      {submitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Registering...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>{Object.values(savedSelections).some((ids) => ids.length > 0) ? 'Update Registration' : 'Register for Session'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </section>

              {/* ── SEMESTER SECTIONS (one per semester) ────────────── */}
              {semesters.map((sem) => {
                const semCourses = coursesBySemester[sem.name] ?? [];
                const selectedSet = selections[sem.id] ?? new Set();
                const totalUnits = totalUnitsBySemester[sem.id] ?? 0;
                const isCreditValid = totalUnits >= 15 && totalUnits <= 24;

                return (
                  <section key={sem.id} className="space-y-4">
                    {/* Semester Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-sm font-bold uppercase tracking-tight text-slate-950 font-mono">
                            {sem.name} Semester
                          </h2>
                          {sem.isCurrent && (
                            <span className="text-[10px] font-mono font-semibold bg-univ-50 text-univ-800 border border-univ-200 px-2 py-0.5 rounded">
                              Current
                            </span>
                          )}
                          {!sem.registrationOpen && (
                            <span className="text-[10px] font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" /> Registration Closed
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-3 mt-1">
                          <span className="text-xl font-bold font-mono text-slate-900">
                            {totalUnits} Units
                          </span>
                          <span
                            className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
                              isCreditValid
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                                : 'bg-amber-50 text-amber-700 border-amber-200/60'
                            }`}
                          >
                            {isCreditValid ? 'Valid (15–24)' : 'Min 15 – Max 24 Units'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {selectedSet.size} of {semCourses.length} courses selected
                        </p>
                      </div>

                      {sem.registrationOpen && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => selectAll(sem.id, sem.name)}
                            className="text-xs px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium transition"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => clearAll(sem.id)}
                            className="text-xs px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium transition"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Course Table */}
                    {semCourses.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700 border-t border-b border-slate-200">
                          <thead className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px] font-mono">
                            <tr>
                              <th className="py-3 pr-4 w-10 text-center">
                                <Info className="w-3 h-3 text-slate-400 mx-auto" />
                              </th>
                              <th className="py-3 px-4">Course Code</th>
                              <th className="py-3 px-4">Course Title</th>
                              <th className="py-3 px-4 text-center">Units</th>
                              <th className="py-3 pl-4 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {semCourses.map((c) => {
                              const isSelected = selectedSet.has(c.id);
                              const isSaved = (savedSelections[sem.id] ?? []).includes(c.id);
                              const isModified = isSelected !== isSaved;

                              return (
                                <tr
                                  key={c.id}
                                  onClick={() => sem.registrationOpen && !isSaved && toggleCourse(sem.id, c.id)}
                                  className={`transition-colors ${
                                    sem.registrationOpen && !isSaved ? 'cursor-pointer' : 'cursor-default'
                                  } ${
                                    isSelected
                                      ? 'bg-univ-50/40 hover:bg-univ-50/60'
                                      : 'hover:bg-slate-50/70'
                                  }`}
                                >
                                  <td className="py-3.5 pr-4 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      disabled={!sem.registrationOpen || isSaved}
                                      title={isSaved ? 'Already registered; this course is locked.' : undefined}
                                      onChange={() => toggleCourse(sem.id, c.id)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-4 h-4 text-univ-700 rounded border-slate-300 focus:ring-univ-700 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                  </td>
                                  <td className="py-3.5 px-4 font-mono font-semibold text-univ-900">
                                    <div className="flex items-center gap-2">
                                      <span>{c.code}</span>
                                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                        {c.level}L
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-900 font-medium">
                                    {c.title}
                                  </td>
                                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                                    {c.unit}
                                  </td>
                                  <td className="py-3.5 pl-4 text-right">
                                    {isSelected ? (
                                      <span
                                        className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                                          isModified
                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                            : 'bg-emerald-50 text-emerald-700'
                                        }`}
                                      >
                                        <CheckCircle2 className="w-3 h-3" />
                                        {isModified ? 'Staged' : 'Registered'}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {isModified ? 'Removal Staged' : 'Not Selected'}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="border-t-2 border-slate-200 bg-slate-50/60">
                            <tr>
                              <td />
                              <td colSpan={2} className="py-3 px-4 text-[11px] font-mono font-semibold text-slate-600 uppercase tracking-wider">
                                {sem.name} Semester Total
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`font-mono font-bold text-sm ${
                                  (totalUnitsBySemester[sem.id] ?? 0) >= 15 && (totalUnitsBySemester[sem.id] ?? 0) <= 24
                                    ? 'text-emerald-700'
                                    : 'text-amber-700'
                                }`}>
                                  {totalUnitsBySemester[sem.id] ?? 0}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono ml-1">
                                  / {semCourses.reduce((s, c) => s + c.unit, 0)} units
                                </span>
                              </td>
                              <td className="py-3 pl-4 text-right text-[11px] font-mono text-slate-500">
                                {selectedSet.size} of {semCourses.length} courses
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div className="py-10 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
                        <BookOpen className="w-7 h-7 mx-auto text-slate-300 mb-2" />
                        <p className="text-xs">No {sem.name.toLowerCase()} semester courses configured for your level.</p>
                      </div>
                    )}
                  </section>
                );
              })}

              {/* Sticky register bar hint */}
              {anyRegistrationOpen && hasChanges && (
                <div className="fixed bottom-6 right-6 z-40">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || incompleteOpenSemesters.length > 0}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-univ-900 hover:bg-univ-800 disabled:opacity-50 text-white text-xs font-semibold shadow-xl transition"
                  >
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{Object.values(savedSelections).some((ids) => ids.length > 0) ? 'Update Registration' : 'Register for Session'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: PAST SESSIONS HISTORY
          ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {pastSessions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
              <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs">No past session records found.</p>
            </div>
          ) : (
            pastSessions.map((ps) => (
              <div key={ps.id} className="border border-slate-200 rounded-xl overflow-hidden">
                {/* Session accordion header */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedSession(expandedSession === ps.id ? null : ps.id)
                  }
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50/70 transition-colors"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-950 font-mono">{ps.name} Session</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {ps.semesters.reduce((s, sem) => s + sem.registrations.length, 0)} courses
                      across {ps.semesters.length} semester{ps.semesters.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {expandedSession === ps.id ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {/* Expanded semester tables */}
                {expandedSession === ps.id && (
                  <div className="border-t border-slate-200 divide-y divide-slate-100">
                    {ps.semesters.map((sem) => (
                      <div key={sem.id} className="p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                            {sem.name} Semester
                          </h3>
                          {sem.resultsPublished && (
                            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                              Results Published
                            </span>
                          )}
                        </div>

                        {sem.registrations.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">
                            No courses registered this semester.
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left text-slate-700 border-t border-slate-200">
                              <thead className="text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                                <tr>
                                  <th className="py-2.5 pr-4">Code</th>
                                  <th className="py-2.5 px-4">Title</th>
                                  <th className="py-2.5 px-4 text-center">Units</th>
                                  {sem.resultsPublished && (
                                    <>
                                      <th className="py-2.5 px-4 text-center">Score</th>
                                      <th className="py-2.5 pl-4 text-right">Grade</th>
                                    </>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {sem.registrations.map((r) => (
                                  <tr key={r.id} className="hover:bg-slate-50/50">
                                    <td className="py-3 pr-4 font-mono font-semibold text-univ-900">
                                      {r.course.code}
                                    </td>
                                    <td className="py-3 px-4 text-slate-800 font-medium">
                                      {r.course.title}
                                    </td>
                                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                                      {r.course.unit}
                                    </td>
                                    {sem.resultsPublished && (
                                      <>
                                        <td className="py-3 px-4 text-center font-mono text-slate-700">
                                          {r.score ? r.score.totalScore.toFixed(1) : '—'}
                                        </td>
                                        <td className="py-3 pl-4 text-right">
                                          {r.score ? (
                                            <span
                                              className={`inline-block font-mono font-bold text-xs px-2 py-0.5 rounded ${
                                                r.score.grade === 'A'
                                                  ? 'bg-emerald-50 text-emerald-700'
                                                  : r.score.grade === 'B'
                                                  ? 'bg-blue-50 text-blue-700'
                                                  : r.score.grade === 'C'
                                                  ? 'bg-amber-50 text-amber-700'
                                                  : 'bg-rose-50 text-rose-700'
                                              }`}
                                            >
                                              {r.score.grade}
                                            </span>
                                          ) : (
                                            <span className="text-slate-400">—</span>
                                          )}
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="border-t border-slate-200 text-[11px] font-mono text-slate-500">
                                <tr>
                                  <td colSpan={2} className="py-2.5 pr-4">
                                    Total
                                  </td>
                                  <td className="py-2.5 px-4 text-center font-bold text-slate-900">
                                    {sem.registrations.reduce((s, r) => s + r.course.unit, 0)} Units
                                  </td>
                                  {sem.resultsPublished && <td colSpan={2} />}
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
