import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { Component, useEffect, useState, type ReactNode } from "react";
import { RotateCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Option A empty state: no illustration, a short message and one clear action. */
export function EmptyState({ title, message, action, onAction, className }: { title: string; message?: string | undefined; action?: string | undefined; onAction?: (() => void) | undefined; className?: string | undefined }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <p className="text-heading">{title}</p>
      {message && <p className="mt-1.5 max-w-xs text-caption">{message}</p>}
      {action && onAction && (
        <Button type="button" variant="outline" onClick={onAction} className="mt-5 h-11 rounded-full px-5 text-[15px] font-semibold shadow-none">{action}</Button>
      )}
    </div>
  );
}

/** Option A error state: clear message + retry. */
export function ErrorState({ message, onRetry, className }: { message: string; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <p className="text-heading">Something went wrong</p>
      <p className="mt-1.5 max-w-xs text-caption">{message}</p>
      {onRetry && (
        <Button type="button" onClick={onRetry} className="mt-5 h-11 gap-2 rounded-full px-5 text-[15px] font-semibold shadow-none"><RotateCw aria-hidden="true" /> Try again</Button>
      )}
    </div>
  );
}

/** Skeleton block — pulses, static under prefers-reduced-motion. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("block animate-pulse rounded-lg bg-muted motion-reduce:animate-none", className)} />;
}

/** Per-tab error boundary so a crash in one screen doesn't take down the others. */
export class TabErrorBoundary extends Component<{ children: ReactNode; name: string }, { error: Error | null }> {
  override state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  override componentDidCatch(error: Error) { console.warn(`[${this.props.name}] render error`, error); }
  override render() {
    if (this.state.error) return <ErrorState message={`${this.props.name} couldn't load.`} onRetry={() => this.setState({ error: null })} />;
    return this.props.children;
  }
}

/** Small banner shown while the device reports it is offline. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="safe-top fixed inset-x-0 top-0 z-[80] flex justify-center px-4 pt-2">
      <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-[13px] font-medium text-background shadow-card"><WifiOff aria-hidden="true" className="h-4 w-4" /> You're offline. Showing what's already loaded.</span>
    </div>
  );
}

/** Full-screen/sheet modal wrapper with focus trap, Escape handling and focus restore. */
export function FocusDialog({ label, onClose, className, children }: { label: string; onClose: () => void; className?: string; children: React.ReactNode }) {
  const ref = useDialogFocus<HTMLDivElement>(onClose);
  return (
    <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label} className={cn("outline-none", className)}>
      {children}
    </div>
  );
}
