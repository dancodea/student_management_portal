export default function Loading() {
  return (
    <main
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-slate-50 px-6"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-univ-800" />
          <div className="h-2.5 w-2.5 rounded-full bg-univ-800" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Loading page</p>
          <p className="mt-1 text-xs text-slate-500">Please wait a moment…</p>
        </div>
      </div>
      <span className="sr-only">Loading page content</span>
    </main>
  );
}
