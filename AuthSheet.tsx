import { useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { closeAuth, useAuth } from "@/lib/auth";

type Mode = "in" | "up" | "reset";
type Msg = { tone: "error" | "info"; text: string } | null;

export function AuthSheet() {
  const { authOpen } = useAuth();
  if (!authOpen) return null;
  return <AuthSheetDialog />;
}

function AuthSheetDialog() {
  const [mode, setMode] = useState<Mode>("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [sentTo, setSentTo] = useState<{ kind: "confirm" | "reset"; email: string } | null>(null);
  const ref = useDialogFocus<HTMLDivElement>(closeAuth);

  const fail = (text: string) => setMsg({ tone: "error", text });
  const switchMode = (next: Mode) => { setMode(next); setMsg(null); setSentTo(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const mail = email.trim();
    const handle = username.trim().toLowerCase();
    if (mode === "up" && !/^[a-z0-9._]{3,24}$/.test(handle)) return fail("Username: 3–24 letters, numbers, dots or underscores.");
    if (mode !== "reset" && password.length < 8) return fail("Password needs at least 8 characters.");
    setBusy(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(mail, { redirectTo: window.location.origin });
        if (error) return fail(error.message);
        setSentTo({ kind: "reset", email: mail });
        toast.success("Password reset email sent");
        return;
      }
      const { error } = mode === "in"
        ? await supabase.auth.signInWithPassword({ email: mail, password })
        : await supabase.auth.signUp({ email: mail, password, options: { emailRedirectTo: window.location.origin, data: { username: handle } } });
      if (error) return fail(error.message);
      if (mode === "up") {
        setSentTo({ kind: "confirm", email: mail });
        toast.success("Account created — check your email");
      } else {
        toast.success("Signed in");
      }
    } catch {
      fail("Couldn't reach AREM. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setMsg(null);
    try {
      const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (r?.error) fail("Google sign-in didn't finish. Try again.");
    } catch {
      fail("Google sign-in didn't finish. Try again.");
    }
  };

  const heading = mode === "in" ? "Sign in" : mode === "up" ? "Join AREM" : "Reset password";

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 animate-in fade-in duration-150 sm:items-center" onClick={closeAuth}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onClick={(e) => e.stopPropagation()}
        className="safe-bottom w-full rounded-t-xl bg-background p-6 font-display text-foreground shadow-card outline-none animate-in slide-in-from-bottom-4 duration-200 sm:max-w-sm sm:rounded-xl"
      >
        <div className="flex items-center justify-between">
          <h2 id="auth-title" className="text-heading">{heading}</h2>
          <Button type="button" variant="ghost" size="icon" aria-label="Close" onClick={closeAuth} className="-mr-2"><X /></Button>
        </div>

        {sentTo ? (
          <div className="mt-4 flex flex-col items-center rounded-lg bg-secondary px-4 py-6 text-center" role="status">
            <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
            <p className="mt-3 text-heading">{sentTo.kind === "confirm" ? "Check your email" : "Reset link sent"}</p>
            <p className="mt-1 text-body text-muted-foreground">
              {sentTo.kind === "confirm"
                ? <>We sent a confirmation link to <span className="font-semibold text-foreground">{sentTo.email}</span>. Confirm it, then sign in.</>
                : <>If an account exists for <span className="font-semibold text-foreground">{sentTo.email}</span>, you’ll get a link to set a new password.</>}
            </p>
            <Button type="button" onClick={() => switchMode("in")} className="mt-5 h-11 w-full rounded-sm font-semibold">Back to sign in</Button>
          </div>
        ) : (
          <>
            <p className="mt-1 text-body text-muted-foreground">
              {mode === "reset" ? "Enter your account email and we’ll send you a reset link." : "Your Rock Its, comments and Calls follow you to every phone."}
            </p>
            {mode !== "reset" && (
              <>
                <Button type="button" variant="outline" onClick={() => void google()} className="mt-5 h-11 w-full rounded-sm font-semibold">Continue with Google</Button>
                <div className="my-4 flex items-center gap-3 text-caption" aria-hidden="true"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
              </>
            )}
            <form onSubmit={submit} className={`space-y-3 ${mode === "reset" ? "mt-5" : ""}`}>
              {mode === "up" && (
                <label className="block">
                  <span className="mb-1 block text-caption font-medium">Username</span>
                  <Input placeholder="yourname" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={24} autoCapitalize="none" autoComplete="username" className="h-11 rounded-sm" />
                </label>
              )}
              <label className="block">
                <span className="mb-1 block text-caption font-medium">Email</span>
                <Input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="h-11 rounded-sm" />
              </label>
              {mode !== "reset" && (
                <label className="block">
                  <span className="mb-1 block text-caption font-medium">Password</span>
                  <Input type="password" required minLength={8} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "in" ? "current-password" : "new-password"} className="h-11 rounded-sm" />
                </label>
              )}
              {msg && <p role={msg.tone === "error" ? "alert" : "status"} className={`text-[13px] ${msg.tone === "error" ? "text-destructive" : "text-muted-foreground"}`}>{msg.text}</p>}
              <Button type="submit" disabled={busy} className="h-11 w-full rounded-sm font-semibold">
                {busy ? "Please wait…" : mode === "in" ? "Sign in" : mode === "up" ? "Create account" : "Send reset link"}
              </Button>
            </form>
            {mode === "in" && (
              <button type="button" onClick={() => switchMode("reset")} className="mt-2 h-11 w-full text-[13px] font-medium text-foreground underline-offset-2 hover:underline">Forgot password?</button>
            )}
            <button type="button" onClick={() => switchMode(mode === "in" ? "up" : "in")} className="h-11 w-full text-[13px] font-medium text-muted-foreground">
              {mode === "in" ? "New to AREM? Create an account" : mode === "up" ? "Have an account? Sign in" : "Back to sign in"}
            </button>
          </>
        )}
        <a href="/privacy" className="mt-1 flex min-h-11 items-center justify-center text-[13px] text-muted-foreground underline">Privacy Policy</a>
      </div>
    </div>,
    document.body,
  );
}
