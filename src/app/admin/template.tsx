export default function AdminPageTransition({ children }: { children: React.ReactNode }) {
  return <div className="animate-[route-enter_180ms_ease-out_both]">{children}</div>;
}
