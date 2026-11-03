'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export default function PrintButton({ label = 'Print Broadsheet' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold transition shrink-0 no-print"
    >
      <Printer className="w-3.5 h-3.5 text-slate-500" />
      <span>{label}</span>
    </button>
  );
}
