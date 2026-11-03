'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Save,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  X as ClearIcon,
} from 'lucide-react';

interface EnrolledStudent {
  registrationId: string;
  studentId: string;
  matricNo: string;
  fullName: string;
  department: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  gradePoint: number;
  hasScore: boolean;
}

export default function AdminScoresPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const pageSize = 20;
  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLocaleLowerCase();
    if (!query) return students;
    return students.filter((student) =>
      student.fullName.toLocaleLowerCase().includes(query) || student.matricNo.toLocaleLowerCase().includes(query)
    );
  }, [students, studentSearch]);
  const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const visibleStudents = filteredStudents.slice((studentPage - 1) * pageSize, studentPage * pageSize);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Bulk CSV state
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [uploadingCsv, setUploadingCsv] = useState(false);

  // Initial load
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/sessions').then((r) => r.json()),
      fetch('/api/departments').then((r) => r.json()),
    ]).then(([sessData, deptData]) => {
      let activeSessId = '';
      let activeSemId = '';

      if (sessData.sessions && sessData.sessions.length > 0) {
        setSessions(sessData.sessions);
        const currentSess = sessData.sessions.find((s: any) => s.isCurrent) || sessData.sessions[0];
        if (currentSess) {
          activeSessId = currentSess.id;
          setSelectedSessionId(currentSess.id);
          const currentSem = currentSess.semesters.find((sem: any) => sem.isCurrent) || currentSess.semesters[0];
          if (currentSem) {
            activeSemId = currentSem.id;
            setSelectedSemesterId(currentSem.id);
          }
        }
      }

      if (deptData.departments && deptData.departments.length > 0) {
        setDepartments(deptData.departments);
        const firstDept = deptData.departments[0];
        setSelectedDeptId(firstDept.id);

        // Auto select first course if available
        if (firstDept.courses && firstDept.courses.length > 0) {
          const firstCourse = firstDept.courses[0];
          setSelectedCourseId(firstCourse.id);
          if (activeSessId && activeSemId) {
            loadStudentsFor(firstCourse.id, activeSessId, activeSemId);
          }
        }
      }
    });
  }, []);

  const currentSessionObj = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId),
    [sessions, selectedSessionId]
  );

  const currentSemesterObj = useMemo(
    () => currentSessionObj?.semesters?.find((sem: any) => sem.id === selectedSemesterId),
    [currentSessionObj, selectedSemesterId]
  );

  const currentDeptObj = useMemo(
    () => departments.find((d) => d.id === selectedDeptId),
    [departments, selectedDeptId]
  );

  // Available courses for currently selected department
  const availableCourses = useMemo(() => {
    if (!currentDeptObj?.courses) return [];
    if (currentSemesterObj?.name) {
      const match = currentDeptObj.courses.filter(
        (c: any) => c.semester === currentSemesterObj.name
      );
      if (match.length > 0) return match;
    }
    return currentDeptObj.courses;
  }, [currentDeptObj, currentSemesterObj]);

  const loadStudentsFor = (courseId: string, sessId: string, semId: string) => {
    if (!courseId || !sessId || !semId) return;
    setLoadingStudents(true);
    setStudentPage(1);
    setError(null);
    setSuccess(null);

    fetch(
      `/api/admin/scores?courseId=${courseId}&sessionId=${sessId}&semesterId=${semId}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStudents(data.enrolledStudents || []);
      })
      .catch(() => setError('Failed to load registered student roster.'))
      .finally(() => setLoadingStudents(false));
  };

  const loadStudents = (courseId: string) => {
    loadStudentsFor(courseId, selectedSessionId, selectedSemesterId);
  };

  const handleScoreChange = (
    registrationId: string,
    field: 'caScore' | 'examScore',
    val: string
  ) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setStudents((prev) =>
      prev.map((st) => {
        if (st.registrationId !== registrationId) return st;
        const ca = field === 'caScore' ? Math.min(40, num) : st.caScore;
        const exam = field === 'examScore' ? Math.min(60, num) : st.examScore;
        const total = ca + exam;

        let grade = 'F';
        let gradePoint = 0;
        if (total >= 70) { grade = 'A'; gradePoint = 5; }
        else if (total >= 60) { grade = 'B'; gradePoint = 4; }
        else if (total >= 50) { grade = 'C'; gradePoint = 3; }
        else if (total >= 45) { grade = 'D'; gradePoint = 2; }
        else if (total >= 40) { grade = 'E'; gradePoint = 1; }

        return {
          ...st,
          [field]: field === 'caScore' ? Math.min(40, num) : Math.min(60, num),
          totalScore: total,
          grade,
          gradePoint,
        };
      })
    );
  };

  const saveScore = async (student: EnrolledStudent) => {
    setError(null);
    setSuccess(null);
    setSavingId(student.registrationId);

    try {
      const res = await fetch('/api/admin/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: student.registrationId,
          caScore: student.caScore,
          examScore: student.examScore,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save score.');

      setSuccess(`Saved score for ${student.matricNo}: ${student.totalScore} (${student.grade})`);
      setStudents((prev) =>
        prev.map((st) =>
          st.registrationId === student.registrationId ? { ...st, hasScore: true } : st
        )
      );
    } catch (err: any) {
      setError(err.message || 'Error saving score.');
    } finally {
      setSavingId(null);
    }
  };

  const handleBulkCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      setError('Please select a course first.');
      return;
    }
    setUploadingCsv(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/scores/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourseId,
          sessionId: selectedSessionId,
          semesterId: selectedSemesterId,
          csvText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process CSV.');

      setSuccess(data.message);
      setShowCsvModal(false);
      setCsvText('');
      loadStudents(selectedCourseId);
    } catch (err: any) {
      setError(err.message || 'Error uploading CSV.');
    } finally {
      setUploadingCsv(false);
    }
  };

  const gradedCount = students.filter((s) => s.hasScore || s.totalScore > 0).length;
  const pendingCount = students.length - gradedCount;
  const averageScore =
    gradedCount > 0
      ? (
          students
            .filter((s) => s.hasScore || s.totalScore > 0)
            .reduce((acc, s) => acc + s.totalScore, 0) / gradedCount
        ).toFixed(1)
      : '—';

  return (
    <div className="space-y-8 pb-16">
      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-univ-700 mb-1">
            Grading &amp; Examination Operations
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
            Gradebook &amp; Scores
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Continuous Assessment (0–40) &bull; Examination (0–60) &bull; Nigerian 5.0 CGPA standard
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCsvModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition shrink-0"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Bulk CSV Upload</span>
        </button>
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

      {/* ── FILTER & SCOPE CONTROLS ─────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
            Academic Session
          </label>
          <div className="relative">
            <select
              value={selectedSessionId}
              onChange={(e) => {
                setSelectedSessionId(e.target.value);
                const s = sessions.find((x) => x.id === e.target.value);
                const firstSem = s?.semesters?.[0]?.id || '';
                setSelectedSemesterId(firstSem);
                if (selectedCourseId) loadStudentsFor(selectedCourseId, e.target.value, firstSem);
              }}
              className="w-full appearance-none px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-univ-700 pr-8"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isCurrent ? '(Active)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
            Semester
          </label>
          <div className="relative">
            <select
              value={selectedSemesterId}
              onChange={(e) => {
                setSelectedSemesterId(e.target.value);
                if (selectedCourseId) loadStudentsFor(selectedCourseId, selectedSessionId, e.target.value);
              }}
              className="w-full appearance-none px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-univ-700 pr-8"
            >
              {currentSessionObj?.semesters?.map((sem: any) => (
                <option key={sem.id} value={sem.id}>
                  {sem.name} Semester {sem.isCurrent ? '(Active)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
            Department
          </label>
          <div className="relative">
            <select
              value={selectedDeptId}
              onChange={(e) => {
                const newDeptId = e.target.value;
                setSelectedDeptId(newDeptId);
                const d = departments.find((x) => x.id === newDeptId);
                const newCourses = d?.courses || [];
                const firstC = newCourses[0]?.id || '';
                setSelectedCourseId(firstC);
                if (firstC) loadStudentsFor(firstC, selectedSessionId, selectedSemesterId);
                else setStudents([]);
              }}
              className="w-full appearance-none px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-univ-700 pr-8"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
            Curriculum Course
          </label>
          <div className="relative">
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                loadStudents(e.target.value);
              }}
              className="w-full appearance-none px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-univ-700 pr-8"
            >
              <option value="">-- Select Course --</option>
              {availableCourses.map((c: any) => (
                <option key={c.id} value={c.id}>
                  [{c.level}L] {c.code} &bull; {c.title} ({c.unit}U)
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ── METRIC STRIP ────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
        <div className="px-5 py-3.5">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Total Enrolled
          </p>
          <p className="text-xl font-bold font-mono text-slate-950">{students.length}</p>
          <p className="text-[11px] text-slate-500">Students registered in roster</p>
        </div>

        <div className="px-5 py-3.5">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Scores Recorded
          </p>
          <p className="text-xl font-bold font-mono text-emerald-700">{gradedCount}</p>
          <p className="text-[11px] text-slate-500">Graded submissions in DB</p>
        </div>

        <div className="px-5 py-3.5">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Pending Grading
          </p>
          <p className="text-xl font-bold font-mono text-amber-700">{pendingCount}</p>
          <p className="text-[11px] text-slate-500">Awaiting score entry</p>
        </div>

        <div className="px-5 py-3.5">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Class Mean Score
          </p>
          <p className="text-xl font-bold font-mono text-univ-800">{averageScore}</p>
          <p className="text-[11px] text-slate-500">Average of entered marks</p>
        </div>
      </section>

      {/* ── GRADEBOOK TABLE ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between pb-3">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-950">
              Course Score Roster
            </h2>
            <p className="text-xs text-slate-500">
              Enter individual scores or update in bulk &bull; Enter tab to jump between fields
            </p>
          </div>
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            A: 70+ &bull; B: 60-69 &bull; C: 50-59 &bull; D: 45-49 &bull; E: 40-44 &bull; F: &lt;40
          </span>
        </div>

        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={studentSearch}
              onChange={(event) => { setStudentSearch(event.target.value); setStudentPage(1); }}
              placeholder="Find student by name or matric number..."
              aria-label="Search course roster by student name or matric number"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-univ-700 focus:outline-none focus:ring-2 focus:ring-univ-700/15"
            />
            {studentSearch && <button type="button" onClick={() => { setStudentSearch(''); setStudentPage(1); }} aria-label="Clear student search" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><ClearIcon className="h-3.5 w-3.5" /></button>}
          </label>
          <p className="text-[11px] text-slate-500" aria-live="polite">{studentSearch ? `${filteredStudents.length} match${filteredStudents.length === 1 ? '' : 'es'} in this course` : `${students.length} students in this course`}</p>
        </div>

        {loadingStudents ? (
          <div className="py-16 text-center text-slate-400 border-t border-slate-200">
            <div className="w-6 h-6 border-2 border-univ-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading course roster...</p>
          </div>
        ) : filteredStudents.length > 0 ? (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-t border-b border-slate-200">
              <thead className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px] font-mono">
                <tr>
                  <th className="py-3 pr-4">Matric No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 text-center w-28">CA (0–40)</th>
                  <th className="py-3 px-4 text-center w-28">Exam (0–60)</th>
                  <th className="py-3 px-4 text-center w-24">Total</th>
                  <th className="py-3 px-4 text-center w-24">Grade</th>
                  <th className="py-3 pl-4 text-right w-20">Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleStudents.map((st) => (
                  <tr key={st.registrationId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 pr-4 font-mono font-bold text-univ-900">
                      {st.matricNo}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{st.fullName}</div>
                      <div className="text-[11px] text-slate-400">{st.department}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        max="40"
                        step="0.5"
                        value={st.caScore}
                        onChange={(e) =>
                          handleScoreChange(st.registrationId, 'caScore', e.target.value)
                        }
                        className="w-20 px-2 py-1 text-center bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-900 rounded-md text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        step="0.5"
                        value={st.examScore}
                        onChange={(e) =>
                          handleScoreChange(st.registrationId, 'examScore', e.target.value)
                        }
                        className="w-20 px-2 py-1 text-center bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-900 rounded-md text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition"
                      />
                    </td>
                    <td className="py-3 px-4 text-center font-bold font-mono text-sm text-slate-900">
                      {st.totalScore.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded font-mono uppercase tracking-wide ${
                          st.grade === 'A'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : st.grade === 'B' || st.grade === 'C'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : st.grade === 'D' || st.grade === 'E'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {st.grade} ({st.gradePoint}.0)
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <button
                        type="button"
                        onClick={() => saveScore(st)}
                        disabled={savingId === st.registrationId}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 transition"
                        title="Save score"
                      >
                        {savingId === st.registrationId ? (
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="py-3 pr-4 text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                    Class Summary
                  </td>
                  <td colSpan={2} className="py-3 px-4 text-center font-mono text-slate-500 text-xs">
                    Mean: <strong className="text-slate-900 font-bold">{averageScore}</strong>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-xs font-bold text-slate-900">
                    {gradedCount}/{students.length} Graded
                  </td>
                  <td colSpan={2} className="py-3 pl-4 text-right font-mono text-slate-500 text-xs">
                    {pendingCount} Pending
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {totalStudentPages > 1 && (
            <nav aria-label="Score roster pages" className="mt-4 flex items-center justify-between text-xs text-slate-600">
              <span>Showing {(studentPage - 1) * pageSize + 1}–{Math.min(studentPage * pageSize, filteredStudents.length)} of {filteredStudents.length} students</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setStudentPage((page) => Math.max(1, page - 1))} disabled={studentPage <= 1} className="inline-flex items-center gap-1 rounded border px-3 py-1.5 disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" />Previous</button>
                <span className="px-2 py-1.5">Page {studentPage} of {totalStudentPages}</span>
                <button type="button" onClick={() => setStudentPage((page) => Math.min(totalStudentPages, page + 1))} disabled={studentPage >= totalStudentPages} className="inline-flex items-center gap-1 rounded border px-3 py-1.5 disabled:opacity-40">Next<ChevronRight className="h-3.5 w-3.5" /></button>
              </div>
            </nav>
          )}
          </>
        ) : (
          <div className="py-16 text-center border-t border-slate-200">
            <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs text-slate-500 font-medium">
              {studentSearch ? `No students match “${studentSearch}”. Try another name or matric number.` : selectedCourseId ? 'No students enrolled in this course for the selected session.' : 'Select a course above to view and grade student roster.'}
            </p>
          </div>
        )}
      </section>

      {/* ── BULK CSV UPLOAD MODAL ───────────────────────────────────────── */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-950 text-sm">Bulk CSV Score Ingestion</h3>
                <p className="text-[11px] text-slate-500">Upload multiple student grades simultaneously</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Paste CSV rows in the format: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-900">matric_no,ca_score,exam_score</code>.
            </p>

            <form onSubmit={handleBulkCsvSubmit} className="space-y-4">
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="UG/20/1042,32,54&#10;UG/21/1105,28,45"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-univ-700"
                required
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingCsv}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
                >
                  {uploadingCsv ? 'Processing CSV...' : 'Import Scores'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
