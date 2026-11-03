export default function DashboardLoading() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading dashboard page" className="min-h-[60vh] space-y-8 pb-16 animate-[route-enter_160ms_ease-out_both]">
      <span className="sr-only">Loading page content…</span>
      <section className="space-y-3 border-b border-slate-200 pb-6">
        <div className="h-3 w-44 rounded bg-slate-200 animate-pulse" />
        <div className="h-8 w-64 max-w-full rounded bg-slate-200 animate-pulse" />
        <div className="h-3 w-80 max-w-full rounded bg-slate-100 animate-pulse" />
      </section>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
            <div className="h-7 w-16 rounded bg-slate-200 animate-pulse" />
            <div className="h-3 w-32 max-w-full rounded bg-slate-100 animate-pulse" />
          </div>
        ))}
      </section>
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="h-4 w-48 rounded bg-slate-200 animate-pulse" />
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="flex items-center gap-4 border-b border-slate-100 pb-3 last:border-0">
              <div className="h-8 w-8 shrink-0 rounded-full bg-slate-100 animate-pulse" />
              <div className="h-3 flex-1 rounded bg-slate-100 animate-pulse" />
              <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
      <span className="sr-only">Loading</span>
    </div>
  );
}
