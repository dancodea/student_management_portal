'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ui/ImageUpload';
import {
  User,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
  Printer,
  FileSignature,
  Camera,
  ArrowLeft,
} from 'lucide-react';

interface StudentData {
  id: string;
  fullName: string;
  matricNo: string;
  email: string;
  phone?: string | null;
  passportUrl?: string | null;
  signatureUrl?: string | null;
  address?: string | null;
  state?: string | null;
  lga?: string | null;
  maritalStatus?: string | null;
  tribe?: string | null;
  religion?: string | null;
  placeOfBirth?: string | null;
  nextOfKinName?: string | null;
  nextOfKinRelationship?: string | null;
  nextOfKinAddress?: string | null;
  nextOfKinPhone?: string | null;
  nextOfKinEmail?: string | null;
  level: number;
  gender: string;
  department: {
    name: string;
    code: string;
  };
  faculty: {
    name: string;
    code: string;
  };
}

interface StudentProfileManagerProps {
  initialStudent: StudentData;
  activeSessionName: string;
  activeSemesterName: string;
  degreeClass: string;
}

export default function StudentProfileManager({
  initialStudent,
  activeSessionName,
  activeSemesterName,
  degreeClass,
}: StudentProfileManagerProps) {
  const router = useRouter();
  const [student, setStudent] = useState<StudentData>(initialStudent);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [phone, setPhone] = useState(student.phone || '');
  const [address, setAddress] = useState(student.address || '');
  const [state, setState] = useState(student.state || '');
  const [lga, setLga] = useState(student.lga || '');
  const [maritalStatus, setMaritalStatus] = useState(student.maritalStatus || 'Single');
  const [tribe, setTribe] = useState(student.tribe || '');
  const [religion, setReligion] = useState(student.religion || '');
  const [placeOfBirth, setPlaceOfBirth] = useState(student.placeOfBirth || '');
  const [nextOfKinName, setNextOfKinName] = useState(student.nextOfKinName || '');
  const [nextOfKinRelationship, setNextOfKinRelationship] = useState(
    student.nextOfKinRelationship || ''
  );
  const [nextOfKinAddress, setNextOfKinAddress] = useState(student.nextOfKinAddress || '');
  const [nextOfKinPhone, setNextOfKinPhone] = useState(student.nextOfKinPhone || '');
  const [nextOfKinEmail, setNextOfKinEmail] = useState(student.nextOfKinEmail || '');
  const [passportUrl, setPassportUrl] = useState(student.passportUrl || '');
  const [signatureUrl, setSignatureUrl] = useState(student.signatureUrl || '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          address,
          state,
          lga,
          maritalStatus,
          tribe,
          religion,
          placeOfBirth,
          nextOfKinName,
          nextOfKinRelationship,
          nextOfKinAddress,
          nextOfKinPhone,
          nextOfKinEmail,
          passportUrl,
          signatureUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      setStudent(data.student);
      setSuccess('Profile records updated successfully.');
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Revert form state to saved student data
    setPhone(student.phone || '');
    setAddress(student.address || '');
    setState(student.state || '');
    setLga(student.lga || '');
    setMaritalStatus(student.maritalStatus || 'Single');
    setTribe(student.tribe || '');
    setReligion(student.religion || '');
    setPlaceOfBirth(student.placeOfBirth || '');
    setNextOfKinName(student.nextOfKinName || '');
    setNextOfKinRelationship(student.nextOfKinRelationship || '');
    setNextOfKinAddress(student.nextOfKinAddress || '');
    setNextOfKinPhone(student.nextOfKinPhone || '');
    setNextOfKinEmail(student.nextOfKinEmail || '');
    setPassportUrl(student.passportUrl || '');
    setSignatureUrl(student.signatureUrl || '');
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ─────────────────────────────────────────────────────────────
          1. OPEN PROFILE HEADER
          ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono text-univ-800 font-semibold uppercase tracking-wider">
              Academic Registry &bull; Verified Identity
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-[11px] font-mono text-slate-500">
              FUTMINNA Student Record
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
            {isEditing ? 'Edit Profile & Biodata' : 'Student Profile & Biodata'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isEditing
              ? 'Update your personal demographics, next of kin information, and signature'
              : 'Official matriculation credentials, departmental enrollment and contact biodata'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isEditing ? (
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setSuccess(null);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-univ-900 hover:bg-univ-800 text-white rounded-lg text-xs font-semibold transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
              <Link
                href="/student/print-result"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Slip</span>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Notifications */}
      {success && (
        <div className="p-3 border-l-4 border-emerald-600 bg-emerald-50/70 rounded-r-lg flex items-center gap-2.5 text-emerald-800 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 border-l-4 border-rose-600 bg-rose-50/70 rounded-r-lg flex items-center gap-2.5 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. VIEW MODE vs EDIT MODE
          ───────────────────────────────────────────────────────────── */}
      {!isEditing ? (
        /* ═════════════════════════════════════════════════════════════
           VIEW MODE: Flat Editorial Layout with subtle dividers
           ═════════════════════════════════════════════════════════════ */
        <div className="space-y-8">
          {/* Identity Snapshot Banner */}
          <section className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-slate-200">
            {/* Passport Photo */}
            <div className="w-24 h-28 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
              {student.passportUrl ? (
                <img
                  src={student.passportUrl}
                  alt={student.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-slate-400" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active Enrolment
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-[11px] font-mono text-slate-500">
                  {student.level} Level
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-950">
                {student.fullName}
              </h2>

              <p className="text-xs font-mono font-semibold text-univ-800">
                Matriculation No: {student.matricNo}
              </p>

              <p className="text-xs text-slate-600">
                {student.department.name} &bull; {student.faculty.name}
              </p>
            </div>
          </section>

          {/* Section 1: Academic & Institutional Information */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-950 uppercase font-mono tracking-tight">
              Academic &amp; Registry Credentials
            </h3>

            <div className="border-t border-b border-slate-200 divide-y divide-slate-100 text-xs">
              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">Matriculation Number:</span>
                <span className="sm:col-span-2 font-mono font-bold text-univ-900">
                  {student.matricNo}
                </span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">Faculty / School:</span>
                <span className="sm:col-span-2 text-slate-900 font-medium">
                  {student.faculty.name} ({student.faculty.code})
                </span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">Academic Department:</span>
                <span className="sm:col-span-2 text-slate-900 font-medium">
                  {student.department.name} ({student.department.code})
                </span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">Academic Level:</span>
                <span className="sm:col-span-2 font-mono font-semibold text-slate-900">
                  {student.level} Level Undergraduate
                </span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">Current Session / Term:</span>
                <span className="sm:col-span-2 font-mono text-slate-800">
                  {activeSessionName} Session &bull; {activeSemesterName} Semester
                </span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">Academic Standing:</span>
                <span className="sm:col-span-2 font-mono font-bold text-amber-700">
                  {degreeClass}
                </span>
              </div>
            </div>
          </section>

          {/* Section 2: Personal & Contact Information */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-950 uppercase font-mono tracking-tight">
                Personal Demographics &amp; Contact
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs font-semibold text-univ-800 hover:text-univ-950 flex items-center gap-1 transition"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit Details</span>
              </button>
            </div>

            <div className="border-t border-b border-slate-200 divide-y divide-slate-100 text-xs">
              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">Full Legal Name:</span>
                <span className="sm:col-span-2 font-semibold text-slate-950">
                  {student.fullName}
                </span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">Institutional Email:</span>
                <span className="sm:col-span-2 font-mono text-slate-800">
                  {student.email}
                </span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">Phone Number:</span>
                <span className="sm:col-span-2 font-mono text-slate-800">
                  {student.phone || <span className="text-slate-400 italic">Not specified</span>}
                </span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">Residential Address:</span>
                <span className="sm:col-span-2 text-slate-800">
                  {student.address || <span className="text-slate-400 italic">Not specified</span>}
                </span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">State of Origin:</span>
                <span className="sm:col-span-2 text-slate-800">
                  {student.state || <span className="text-slate-400 italic">Not specified</span>}
                </span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">Local Government Area (LGA):</span>
                <span className="sm:col-span-2 text-slate-800">
                  {student.lga || <span className="text-slate-400 italic">Not specified</span>}
                </span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">Place of Birth:</span>
                <span className="sm:col-span-2 text-slate-800">
                  {student.placeOfBirth || <span className="text-slate-400 italic">Not specified</span>}
                </span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">Marital Status:</span>
                <span className="sm:col-span-2 text-slate-800">
                  {student.maritalStatus || 'Single'}
                </span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">Tribe / Ethnicity:</span>
                <span className="sm:col-span-2 text-slate-800">
                  {student.tribe || <span className="text-slate-400 italic">Not specified</span>}
                </span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">Religion:</span>
                <span className="sm:col-span-2 text-slate-800">
                  {student.religion || <span className="text-slate-400 italic">Not specified</span>}
                </span>
              </div>
            </div>
          </section>

          {/* Section 3: Next of Kin Information */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-950 uppercase font-mono tracking-tight">
              Next of Kin Details
            </h3>

            <div className="border-t border-b border-slate-200 divide-y divide-slate-100 text-xs">
              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">Next of Kin Name:</span>
                <span className="sm:col-span-2 font-semibold text-slate-900">
                  {student.nextOfKinName || <span className="text-slate-400 italic">Not provided</span>}
                </span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">Relationship:</span>
                <span className="sm:col-span-2 text-slate-800">
                  {student.nextOfKinRelationship || <span className="text-slate-400 italic">Not provided</span>}
                </span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">Phone Number:</span>
                <span className="sm:col-span-2 font-mono text-slate-800">
                  {student.nextOfKinPhone || <span className="text-slate-400 italic">Not provided</span>}
                </span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">Email Address:</span>
                <span className="sm:col-span-2 font-mono text-slate-800">
                  {student.nextOfKinEmail || <span className="text-slate-400 italic">Not provided</span>}
                </span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="font-mono text-slate-500">Residential Address:</span>
                <span className="sm:col-span-2 text-slate-800">
                  {student.nextOfKinAddress || <span className="text-slate-400 italic">Not provided</span>}
                </span>
              </div>
            </div>
          </section>

          {/* Section 4: Official Identity Media (Passport & Signature) */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-950 uppercase font-mono tracking-tight">
              Biometric &amp; Signature Documents
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-b border-slate-200 py-6">
              {/* Passport preview */}
              <div>
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2 font-mono">
                  Passport Photograph
                </span>
                <div className="w-28 h-36 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                  {student.passportUrl ? (
                    <img
                      src={student.passportUrl}
                      alt="Student Passport"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-3 text-slate-400">
                      <Camera className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                      <span className="text-[10px] block font-mono">No Photo</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Appears on official examination statements and verification slips.
                </p>
              </div>

              {/* Signature preview */}
              <div>
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2 font-mono">
                  Digital Signature
                </span>
                <div className="w-56 h-28 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center p-2">
                  {student.signatureUrl ? (
                    <img
                      src={student.signatureUrl}
                      alt="Student Signature"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-3 text-slate-400">
                      <FileSignature className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                      <span className="text-[10px] block font-mono">No Signature Uploaded</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Used for authenticating registered course slips and result forms.
                </p>
              </div>
            </div>
          </section>
        </div>
      ) : (
        /* ═════════════════════════════════════════════════════════════
           EDIT MODE: Open enterprise form with no nested cards
           ═════════════════════════════════════════════════════════════ */
        <form onSubmit={handleSave} className="space-y-10">
          {/* Section A: Photographs & Signatures */}
          <section className="space-y-4">
            <div className="pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-950 uppercase font-mono tracking-tight">
                1. Biometric Passport &amp; Digital Signature
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload clear image files with white background.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-2">
              <ImageUpload
                value={passportUrl}
                onChange={setPassportUrl}
                label="Passport Photograph (White Background)"
                aspect="portrait"
                promptText="Upload passport photo"
              />

              <ImageUpload
                value={signatureUrl}
                onChange={setSignatureUrl}
                label="Digital Signature Image"
                aspect="landscape"
                promptText="Upload signature image"
              />
            </div>
          </section>

          {/* Section B: Personal Demographics */}
          <section className="space-y-4">
            <div className="pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-950 uppercase font-mono tracking-tight">
                2. Personal Demographics &amp; Contact
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Your permanent address and state identification details.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Phone Number <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-univ-700 focus:border-univ-700 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  State of Origin <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Niger State"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-univ-700 focus:border-univ-700 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Local Government Area (LGA) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lga}
                  onChange={(e) => setLga(e.target.value)}
                  placeholder="e.g. Chanchaga"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-univ-700 focus:border-univ-700 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Place of Birth <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={placeOfBirth}
                  onChange={(e) => setPlaceOfBirth(e.target.value)}
                  placeholder="e.g. Minna"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-univ-700 focus:border-univ-700 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Marital Status <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-univ-700 focus:border-univ-700 transition"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Tribe / Ethnicity <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tribe}
                  onChange={(e) => setTribe(e.target.value)}
                  placeholder="e.g. Nupe, Gbagyi, Hausa, Yoruba, Igbo"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-univ-700 focus:border-univ-700 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Religion <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  placeholder="e.g. Islam, Christianity"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-univ-700 focus:border-univ-700 transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Residential Address <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, City, State"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-univ-700 focus:border-univ-700 transition"
                />
              </div>
            </div>
          </section>

          {/* Section C: Next of Kin */}
          <section className="space-y-4">
            <div className="pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-950 uppercase font-mono tracking-tight">
                3. Next of Kin Information
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Designated contact for administrative and emergency communications.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Next of Kin Full Name
                </label>
                <input
                  type="text"
                  value={nextOfKinName}
                  onChange={(e) => setNextOfKinName(e.target.value)}
                  placeholder="e.g. Mallam Ibrahim Musa"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-univ-700 focus:border-univ-700 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Relationship
                </label>
                <input
                  type="text"
                  value={nextOfKinRelationship}
                  onChange={(e) => setNextOfKinRelationship(e.target.value)}
                  placeholder="e.g. Father, Mother, Guardian, Sibling, Spouse"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-univ-700 focus:border-univ-700 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Next of Kin Phone Number
                </label>
                <input
                  type="text"
                  value={nextOfKinPhone}
                  onChange={(e) => setNextOfKinPhone(e.target.value)}
                  placeholder="e.g. 08098765432"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-univ-700 focus:border-univ-700 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Next of Kin Email Address
                </label>
                <input
                  type="email"
                  value={nextOfKinEmail}
                  onChange={(e) => setNextOfKinEmail(e.target.value)}
                  placeholder="e.g. parent@example.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-univ-700 focus:border-univ-700 transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Next of Kin Residential Address
                </label>
                <textarea
                  rows={2}
                  value={nextOfKinAddress}
                  onChange={(e) => setNextOfKinAddress(e.target.value)}
                  placeholder="Next of kin residential address"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-univ-700 focus:border-univ-700 transition"
                />
              </div>
            </div>
          </section>

          {/* Form Actions */}
          <div className="pt-6 border-t border-slate-200 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-univ-900 hover:bg-univ-800 disabled:opacity-50 text-white rounded-md text-xs font-semibold transition"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile Records</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
