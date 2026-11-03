'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Pencil, Plus, Trash2, X } from 'lucide-react';

interface DepartmentOption {
  id: string;
  name: string;
  facultyId: string;
  faculty: { name: string };
}

interface StudentRecord {
  id: string;
  fullName: string;
  matricNo: string;
  email: string;
  departmentId: string;
  facultyId: string;
}

function emailPreview(fullName: string, matricNo: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const clean = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const first = clean(parts[0] || 'student');
  const last = clean(parts.length > 1 ? parts[parts.length - 1] : parts[0] || 'student');
  const suffix = clean(matricNo.trim().toUpperCase().split('/').filter(Boolean).at(-1) || matricNo);
  return `${first}.${last}.${suffix}@futminna.edu.ng`;
}

function StudentFormModal({
  student,
  departments,
  onClose,
  onSaved,
}: {
  student?: StudentRecord;
  departments: DepartmentOption[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [fullName, setFullName] = useState(student?.fullName || '');
  const [matricNo, setMatricNo] = useState(student?.matricNo || '');
  const [facultyId, setFacultyId] = useState(student?.facultyId || '');
  const [departmentId, setDepartmentId] = useState(student?.departmentId || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingMatric, setLoadingMatric] = useState(!student);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (student) return;
    let active = true;
    fetch('/api/admin/students', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not generate a matric number.');
        if (active) setMatricNo(data.matricNo);
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not generate a matric number.');
      })
      .finally(() => {
        if (active) setLoadingMatric(false);
      });
    return () => { active = false; };
  }, [student]);

  const faculties = useMemo(() => {
    const seen = new Map<string, string>();
    departments.forEach((department) => seen.set(department.facultyId, department.faculty.name));
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [departments]);
  const availableDepartments = departments.filter((department) => department.facultyId === facultyId);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 3 || !facultyId || !departmentId) {
      setError('Enter a full name and select a faculty and department to continue.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/admin/students', {
        method: student ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student?.id, fullName, matricNo, departmentId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save student details.');

      onSaved(student
        ? `Updated ${data.student.fullName}. School email: ${data.student.email}`
        : `Created ${data.student.fullName}. School email: ${data.student.email}. Initial password: ${data.initialPassword}`);
      router.refresh();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save student details.');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/45 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="student-form-title" className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-univ-700">Student registry</p>
            <h2 id="student-form-title" className="mt-1 text-lg font-bold text-slate-950">{student ? 'Edit student' : 'Add student'}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Enter the student’s details. Their school email is generated automatically.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>

        <form noValidate onSubmit={submit} className="space-y-5 px-5 py-5 sm:px-7">
          <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-700">Full name <span className="text-rose-600">*</span></span>
            <input required minLength={3} value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-univ-700 focus:ring-4 focus:ring-univ-700/10" placeholder="First and last name" />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-700">Matric number</span>
            <input readOnly value={loadingMatric ? '' : matricNo} aria-label="Automatically generated matric number" className="w-full cursor-default rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm text-slate-600 outline-none" placeholder={loadingMatric ? 'Generating matric number…' : 'Matric number unavailable'} />
          </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-700">Faculty <span className="text-rose-600">*</span></span>
            <select required value={facultyId} onChange={(event) => { setFacultyId(event.target.value); setDepartmentId(''); }} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-univ-700 focus:ring-4 focus:ring-univ-700/10">
              <option value="">Select faculty</option>
              {faculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-700">Department <span className="text-rose-600">*</span></span>
            <select required value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} disabled={!facultyId} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-univ-700 focus:ring-4 focus:ring-univ-700/10 disabled:bg-slate-50 disabled:text-slate-400">
              <option value="">Select department</option>
              {availableDepartments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
          </label>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">Generated school email</p>
            <p className="mt-1 break-all font-mono text-xs font-semibold text-slate-800">{loadingMatric ? 'Generating email…' : emailPreview(fullName, matricNo)}</p>
          </div>

          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p>}

          <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:-mx-7 sm:px-7">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving || loadingMatric || !matricNo} className="inline-flex items-center gap-2 rounded-lg bg-univ-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-univ-800 disabled:cursor-not-allowed disabled:opacity-60">
              {(saving || loadingMatric) && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
              {saving ? 'Saving…' : loadingMatric ? 'Preparing…' : student ? 'Save changes' : 'Create student'}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  );
}

function Feedback({ message, error, onDismiss }: { message: string; error?: boolean; onDismiss: () => void }) {
  if (!message) return null;
  return <div role={error ? 'alert' : 'status'} className={`mt-2 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}><span>{message}</span><button type="button" onClick={onDismiss} aria-label="Dismiss" className="shrink-0"><X className="h-3.5 w-3.5" /></button></div>;
}

export function AddStudentButton({ departments }: { departments: DepartmentOption[] }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button type="button" onClick={() => setOpen(true)} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-univ-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-univ-800"><Plus className="h-4 w-4" />Add student</button>
      <Feedback message={feedback} onDismiss={() => setFeedback('')} />
      {open && <StudentFormModal departments={departments} onClose={() => setOpen(false)} onSaved={setFeedback} />}
    </div>
  );
}

export function StudentRowActions({ student, departments }: { student: StudentRecord; departments: DepartmentOption[] }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const removeStudent = async () => {
    const confirmed = window.confirm(`Delete ${student.fullName} (${student.matricNo})? This also permanently removes their course registrations and scores.`);
    if (!confirmed) return;
    setDeleting(true);
    setFeedback('');
    try {
      const response = await fetch('/api/admin/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to delete student.');
      setFeedback(`Deleted ${student.fullName}.`);
      router.refresh();
    } catch (deleteError) {
      setFeedback(deleteError instanceof Error ? deleteError.message : 'Unable to delete student.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center justify-end gap-1.5">
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100"><Pencil className="h-3 w-3" />Edit</button>
        <button type="button" onClick={removeStudent} disabled={deleting} className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1.5 text-[10px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-3 w-3" />{deleting ? 'Deleting…' : 'Delete'}</button>
      </div>
      <Feedback message={feedback} error={feedback.startsWith('Unable')} onDismiss={() => setFeedback('')} />
      {open && <StudentFormModal student={student} departments={departments} onClose={() => setOpen(false)} onSaved={setFeedback} />}
    </div>
  );
}
