'use client';

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
  ChevronRight,
  Sparkles,
  Layers,
  GraduationCap,
} from 'lucide-react';

export interface CalendarEvent {
  id: string;
  dateRange: string;
  week: string;
  title: string;
  description: string;
  category: 'REGISTRATION' | 'ACADEMIC' | 'ASSESSMENT' | 'EXAMINATION' | 'SENATE';
  status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
  unit: string;
  order?: number;
  semesterId?: string | null;
  semester?: { id: string; name: string } | null;
}

const defaultFirstSemesterEvents: CalendarEvent[] = [
  {
    id: 'evt-1-1',
    dateRange: 'Oct 14 – Oct 19, 2024',
    week: 'Week 1',
    title: 'Course Registration Portal Opens',
    description: 'Online enrolment commences for fresh and returning undergraduates across all faculties.',
    category: 'REGISTRATION',
    status: 'COMPLETED',
    unit: 'ICT Directorate',
    order: 1,
    semester: { id: 'sem-1', name: 'FIRST' },
  },
  {
    id: 'evt-1-2',
    dateRange: 'Oct 21, 2024',
    week: 'Week 2',
    title: 'Commencement of First Semester Lectures',
    description: 'Official resumption of academic teaching, distribution of course outlines and departmental timetables.',
    category: 'ACADEMIC',
    status: 'COMPLETED',
    unit: 'All Faculties',
    order: 2,
    semester: { id: 'sem-1', name: 'FIRST' },
  },
  {
    id: 'evt-1-3',
    dateRange: 'Nov 08, 2024',
    week: 'Week 4',
    title: 'Late Course Registration Commences',
    description: 'Standard registration window closes; late registration opens with administrative surcharge fine.',
    category: 'REGISTRATION',
    status: 'COMPLETED',
    unit: 'Academic Registry',
    order: 3,
    semester: { id: 'sem-1', name: 'FIRST' },
  },
  {
    id: 'evt-1-4',
    dateRange: 'Nov 15, 2024',
    week: 'Week 5',
    title: 'Final Close of Add/Drop Window',
    description: 'Strict deadline for adding or dropping enrolled courses; maximum allowable credit cap locked at 24 units.',
    category: 'REGISTRATION',
    status: 'COMPLETED',
    unit: 'Registry Academic Office',
    order: 4,
    semester: { id: 'sem-1', name: 'FIRST' },
  },
  {
    id: 'evt-1-5',
    dateRange: 'Nov 27, 2024',
    week: 'Week 7',
    title: 'University Matriculation Ceremony',
    description: 'Official matriculation for 100-level and Direct Entry undergraduates at Convocation Square.',
    category: 'ACADEMIC',
    status: 'COMPLETED',
    unit: "Vice Chancellor's Office",
    order: 5,
    semester: { id: 'sem-1', name: 'FIRST' },
  },
  {
    id: 'evt-1-6',
    dateRange: 'Dec 09 – Dec 14, 2024',
    week: 'Week 9',
    title: 'Continuous Assessment (CA) Phase 1',
    description: 'First continuous assessment test period administering initial 20% coursework scores.',
    category: 'ASSESSMENT',
    status: 'COMPLETED',
    unit: 'Departmental Examiners',
    order: 6,
    semester: { id: 'sem-1', name: 'FIRST' },
  },
  {
    id: 'evt-1-7',
    dateRange: 'Dec 23, 2024 – Jan 03, 2025',
    week: 'Mid-Term',
    title: 'Mid-Semester & End of Year Recess',
    description: 'University-wide academic break; lectures, laboratories and examinations suspended.',
    category: 'ACADEMIC',
    status: 'COMPLETED',
    unit: 'University Registry',
    order: 7,
    semester: { id: 'sem-1', name: 'FIRST' },
  },
  {
    id: 'evt-1-8',
    dateRange: 'Jan 06 – Jan 17, 2025',
    week: 'Week 11–12',
    title: 'Lecture Resumption & CA Phase 2',
    description: 'Resumption of coursework teaching and completion of final continuous assessment tests (20%).',
    category: 'ASSESSMENT',
    status: 'COMPLETED',
    unit: 'Academic Departments',
    order: 8,
    semester: { id: 'sem-1', name: 'FIRST' },
  },
  {
    id: 'evt-1-9',
    dateRange: 'Jan 20 – Jan 24, 2025',
    week: 'Week 13',
    title: 'Revision Week & CA Scores Audit',
    description: 'Final lectures concluded; release of verified continuous assessment marks (40%) on portal.',
    category: 'ACADEMIC',
    status: 'COMPLETED',
    unit: 'Directorate of Exams',
    order: 9,
    semester: { id: 'sem-1', name: 'FIRST' },
  },
  {
    id: 'evt-1-10',
    dateRange: 'Jan 27 – Feb 15, 2025',
    week: 'Week 14–16',
    title: 'First Semester Final Examinations',
    description: 'Official university-wide examinations administering final 60% semester papers.',
    category: 'EXAMINATION',
    status: 'IN_PROGRESS',
    unit: 'Central Examination Committee',
    order: 10,
    semester: { id: 'sem-1', name: 'FIRST' },
  },
  {
    id: 'evt-1-11',
    dateRange: 'Feb 17 – Feb 28, 2025',
    week: 'Post-Exam',
    title: 'Departmental Score Moderation',
    description: 'Internal vetting, scoring computation and departmental board review of raw examination scripts.',
    category: 'SENATE',
    status: 'UPCOMING',
    unit: 'Faculty Examination Boards',
    order: 11,
    semester: { id: 'sem-1', name: 'FIRST' },
  },
  {
    id: 'evt-1-12',
    dateRange: 'Mar 10, 2025',
    week: 'Senate',
    title: 'Senate Approval & Results Release',
    description: 'University Senate ratification of official broadsheets; release of verified GPA to student accounts.',
    category: 'SENATE',
    status: 'UPCOMING',
    unit: 'University Senate',
    order: 12,
    semester: { id: 'sem-1', name: 'FIRST' },
  },
];

const defaultSecondSemesterEvents: CalendarEvent[] = [
  {
    id: 'evt-2-1',
    dateRange: 'Mar 24, 2025',
    week: 'Week 1',
    title: 'Commencement of Second Semester Lectures',
    description: 'Resumption of academic teaching, distribution of second semester course materials, laboratories, and lecture timetables.',
    category: 'ACADEMIC',
    status: 'UPCOMING',
    unit: 'All Faculties',
    order: 13,
    semester: { id: 'sem-2', name: 'SECOND' },
  },
  {
    id: 'evt-2-2',
    dateRange: 'Mar 31 – Apr 05, 2025',
    week: 'Week 2',
    title: 'Second Semester Course Verification & Add/Drop Window',
    description: 'Window for students to adjust second semester elective courses and verify registered modules on the portal.',
    category: 'REGISTRATION',
    status: 'UPCOMING',
    unit: 'ICT Directorate',
    order: 14,
    semester: { id: 'sem-2', name: 'SECOND' },
  },
  {
    id: 'evt-2-3',
    dateRange: 'Apr 14 – Apr 19, 2025',
    week: 'Week 4',
    title: "Students' Union Week & Cultural Carnival",
    description: 'Annual university cultural carnival, intellectual debates, and inter-faculty sporting fiesta.',
    category: 'ACADEMIC',
    status: 'UPCOMING',
    unit: 'Student Affairs Division',
    order: 15,
    semester: { id: 'sem-2', name: 'SECOND' },
  },
  {
    id: 'evt-2-4',
    dateRange: 'Apr 28 – May 03, 2025',
    week: 'Week 6',
    title: 'Continuous Assessment (CA) Phase 1',
    description: 'First continuous assessment test period administering initial 20% coursework evaluation for second semester.',
    category: 'ASSESSMENT',
    status: 'UPCOMING',
    unit: 'Departmental Examiners',
    order: 16,
    semester: { id: 'sem-2', name: 'SECOND' },
  },
  {
    id: 'evt-2-5',
    dateRange: 'May 12 – May 16, 2025',
    week: 'Mid-Term',
    title: 'Mid-Semester Break',
    description: 'Brief academic break for undergraduates; administrative and research activities remain ongoing.',
    category: 'ACADEMIC',
    status: 'UPCOMING',
    unit: 'University Registry',
    order: 17,
    semester: { id: 'sem-2', name: 'SECOND' },
  },
  {
    id: 'evt-2-6',
    dateRange: 'May 19 – May 30, 2025',
    week: 'Week 9–10',
    title: 'Lecture Resumption & CA Phase 2',
    description: 'Final phase of lectures and completion of mid-term assignments, tests, and laboratory assessments (20%).',
    category: 'ASSESSMENT',
    status: 'UPCOMING',
    unit: 'Academic Departments',
    order: 18,
    semester: { id: 'sem-2', name: 'SECOND' },
  },
  {
    id: 'evt-2-7',
    dateRange: 'Jun 09 – Jun 13, 2025',
    week: 'Week 12',
    title: 'Revision Week & Practical Examinations',
    description: 'Conclusion of lectures, project submissions, studio defences, and verification of CA marks on portal.',
    category: 'ACADEMIC',
    status: 'UPCOMING',
    unit: 'Directorate of Exams',
    order: 19,
    semester: { id: 'sem-2', name: 'SECOND' },
  },
  {
    id: 'evt-2-8',
    dateRange: 'Jun 16 – Jul 05, 2025',
    week: 'Week 13–15',
    title: 'Second Semester Final Examinations',
    description: 'Official university-wide examinations for graduating and non-graduating students across all faculties.',
    category: 'EXAMINATION',
    status: 'UPCOMING',
    unit: 'Central Examination Committee',
    order: 20,
    semester: { id: 'sem-2', name: 'SECOND' },
  },
  {
    id: 'evt-2-9',
    dateRange: 'Jul 07 – Jul 18, 2025',
    week: 'Post-Exam',
    title: 'Departmental Score Moderation & Broadsheet Compilation',
    description: 'Faculty board review, external examiners audit, and compilation of cumulative sessional GPAs.',
    category: 'SENATE',
    status: 'UPCOMING',
    unit: 'Faculty Examination Boards',
    order: 21,
    semester: { id: 'sem-2', name: 'SECOND' },
  },
  {
    id: 'evt-2-10',
    dateRange: 'Jul 28, 2025',
    week: 'Senate',
    title: 'Senate Approval of Sessional Results & Graduating Class',
    description: 'University Senate approval of sessional broadsheets, degree classifications, probation list, and graduation clearance.',
    category: 'SENATE',
    status: 'UPCOMING',
    unit: 'University Senate',
    order: 22,
    semester: { id: 'sem-2', name: 'SECOND' },
  },
  {
    id: 'evt-2-11',
    dateRange: 'Aug 01, 2025',
    week: 'Recess',
    title: 'End of Academic Session & Sessional Recess',
    description: 'Official closure of academic session; long vacation commences pending registry announcement of new session.',
    category: 'ACADEMIC',
    status: 'UPCOMING',
    unit: 'Academic Registry',
    order: 23,
    semester: { id: 'sem-2', name: 'SECOND' },
  },
];

export default function SemesterAcademicCalendar({
  sessionName = '2024/2025',
  semesterName = 'First',
  events,
}: {
  sessionName?: string;
  semesterName?: string;
  events?: CalendarEvent[];
}) {
  const isSecondSemesterCurrent = semesterName?.toUpperCase().includes('SECOND');
  const [semesterTab, setSemesterTab] = useState<'FIRST' | 'SECOND' | 'ALL'>(
    isSecondSemesterCurrent ? 'SECOND' : 'FIRST'
  );
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'ACTIVE' | 'EXAMS' | 'ACADEMIC'>('ALL');

  // If no DB events provided, assemble default events for both semesters
  const sourceEvents =
    events && events.length > 0
      ? events
      : [...defaultFirstSemesterEvents, ...defaultSecondSemesterEvents];

  // Helper to determine if an event belongs to Second Semester
  const isSecondSemesterEvent = (evt: CalendarEvent) => {
    if (evt.semester?.name === 'SECOND') return true;
    if (evt.semester?.name === 'FIRST') return false;
    if (typeof evt.order === 'number' && evt.order >= 13) return true;
    const lowerTitle = evt.title.toLowerCase();
    if (lowerTitle.includes('second semester') && !lowerTitle.includes('resumption')) return true;
    return false;
  };

  const firstSemEvents = sourceEvents.filter((e) => !isSecondSemesterEvent(e));
  const secondSemEvents = sourceEvents.filter((e) => isSecondSemesterEvent(e));

  // Partition by selected semester tab
  const tabEvents =
    semesterTab === 'FIRST'
      ? firstSemEvents
      : semesterTab === 'SECOND'
      ? secondSemEvents
      : sourceEvents;

  // Apply category filter
  const filteredEvents = tabEvents.filter((evt) => {
    if (categoryFilter === 'ACTIVE') return evt.status === 'IN_PROGRESS' || evt.status === 'UPCOMING';
    if (categoryFilter === 'EXAMS') return evt.category === 'EXAMINATION' || evt.category === 'ASSESSMENT';
    if (categoryFilter === 'ACADEMIC') return evt.category === 'ACADEMIC' || evt.category === 'REGISTRATION';
    return true;
  });

  // Find currently active milestone for the viewed scope (or overall)
  const activeEvent =
    tabEvents.find((e) => e.status === 'IN_PROGRESS') ||
    sourceEvents.find((e) => e.status === 'IN_PROGRESS');

  return (
    <section className="space-y-6 pt-4">
      {/* ─────────────────────────────────────────────────────────────
          1. CALENDAR HEADER (Flat editorial style sitting directly on canvas)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-univ-800">
              {sessionName} Session Calendar
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-[11px] font-mono text-slate-500">
              Senate Approved Dual-Semester Schedule
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
            Academic Calendar &amp; Institutional Schedule
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Key dates, teaching periods, continuous assessments, examination windows, and Senate publications
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-md font-mono text-[11px] transition ${
              categoryFilter === 'ALL'
                ? 'bg-slate-950 text-white font-semibold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            All Milestones ({tabEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-md font-mono text-[11px] transition ${
              categoryFilter === 'ACTIVE'
                ? 'bg-slate-950 text-white font-semibold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Active &amp; Upcoming
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('EXAMS')}
            className={`px-3 py-1.5 rounded-md font-mono text-[11px] transition ${
              categoryFilter === 'EXAMS'
                ? 'bg-slate-950 text-white font-semibold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Exams &amp; Tests
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SEMESTER SWITCHER TABS (First Semester vs Second Semester vs Sessional)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200/80">
        <div className="flex items-center gap-1.5">
          {/* First Semester Tab */}
          <button
            type="button"
            onClick={() => setSemesterTab('FIRST')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              semesterTab === 'FIRST'
                ? 'bg-white text-slate-950 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
            }`}
          >
            <span>First Semester</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
              {firstSemEvents.length}
            </span>
            {!isSecondSemesterCurrent && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Term
              </span>
            )}
          </button>

          {/* Second Semester Tab */}
          <button
            type="button"
            onClick={() => setSemesterTab('SECOND')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              semesterTab === 'SECOND'
                ? 'bg-white text-slate-950 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
            }`}
          >
            <span>Second Semester</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
              {secondSemEvents.length}
            </span>
            {isSecondSemesterCurrent && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Term
              </span>
            )}
          </button>

          {/* Full Academic Year Tab */}
          <button
            type="button"
            onClick={() => setSemesterTab('ALL')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              semesterTab === 'ALL'
                ? 'bg-white text-slate-950 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Full Sessional Year</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
              {sourceEvents.length}
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-500 px-2">
          <span>Viewing:</span>
          <span className="font-semibold text-slate-900">
            {semesterTab === 'FIRST'
              ? 'First Semester Key Dates'
              : semesterTab === 'SECOND'
              ? 'Second Semester Key Dates'
              : 'Complete Institutional Schedule (Both Terms)'}
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ACTIVE PHASE HIGHLIGHT BANNER (When a milestone is ongoing)
          ───────────────────────────────────────────────────────────── */}
      {activeEvent && (
        <div className="p-4 border-l-4 border-emerald-600 bg-emerald-50/70 rounded-r-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse mt-1 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-800">
                  Current Active Milestone
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-xs font-mono font-semibold text-emerald-900">
                  {activeEvent.dateRange}
                </span>
                {activeEvent.semester && (
                  <>
                    <span className="text-slate-300">&bull;</span>
                    <span className="text-[10px] font-mono font-semibold text-emerald-800 uppercase">
                      {activeEvent.semester.name} SEMESTER
                    </span>
                  </>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-950 mt-0.5">
                {activeEvent.title} ({activeEvent.week})
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">{activeEvent.description}</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[11px] font-mono text-emerald-800 font-semibold bg-emerald-100/80 px-2.5 py-1 rounded">
              {activeEvent.unit}
            </span>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. CALENDAR TIMELINE / SCHEDULE TABLE (Sitting directly on canvas)
          ───────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 border-t border-b border-slate-200">
          <thead className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px] font-mono">
            <tr>
              <th className="py-3.5 pr-4 w-44">Date / Duration</th>
              <th className="py-3.5 px-3 w-24">Week</th>
              {semesterTab === 'ALL' && <th className="py-3.5 px-3 w-28 text-center">Semester</th>}
              <th className="py-3.5 px-4">Academic Event &amp; Details</th>
              <th className="py-3.5 px-3 w-40">Directorate / Unit</th>
              <th className="py-3.5 pl-4 w-32 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEvents.map((event) => {
              const isOngoing = event.status === 'IN_PROGRESS';
              const isCompleted = event.status === 'COMPLETED';
              const isSecondSem = isSecondSemesterEvent(event);

              return (
                <tr
                  key={event.id}
                  className={`transition-colors ${
                    isOngoing
                      ? 'bg-emerald-50/40 hover:bg-emerald-50/60 font-medium'
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Date Column */}
                  <td className="py-4 pr-4 font-mono font-semibold text-slate-900 align-top">
                    {event.dateRange}
                  </td>

                  {/* Week Tag */}
                  <td className="py-4 px-3 align-top font-mono text-slate-500">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-700">
                      {event.week}
                    </span>
                  </td>

                  {/* Semester Tag (in ALL view) */}
                  {semesterTab === 'ALL' && (
                    <td className="py-4 px-3 align-top text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider ${
                          isSecondSem
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        {isSecondSem ? '2nd Sem' : '1st Sem'}
                      </span>
                    </td>
                  )}

                  {/* Event Title & Description */}
                  <td className="py-4 px-4 align-top">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-950 text-xs">{event.title}</span>
                      {isOngoing && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Ongoing Now
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {event.description}
                    </p>
                  </td>

                  {/* Responsible Unit */}
                  <td className="py-4 px-3 align-top font-mono text-[11px] text-slate-600">
                    {event.unit}
                  </td>

                  {/* Status Indicator */}
                  <td className="py-4 pl-4 text-right align-top">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Completed</span>
                      </span>
                    ) : isOngoing ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700">
                        <Clock className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400">
                        <span>Scheduled</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. CALENDAR LEGEND / METADATA FOOTER
          ───────────────────────────────────────────────────────────── */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span>Past Events</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Current Term Milestone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Upcoming Senate Key Date</span>
          </div>
        </div>

        <span>Source: FUTMINNA Academic Planning Directorate &bull; Official Registry Record</span>
      </div>
    </section>
  );
}
