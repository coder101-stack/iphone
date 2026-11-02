import { useState } from "react";
import { createPortal } from "react-dom";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { IMAGE_ACCEPT, validateMedia } from "@/lib/media-validation";
import { updateProfile, uploadAvatar } from "@/lib/posts";

export function EditProfile({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? "");
  const [name, setName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatar, setAvatar] = useState<{ url: string; file: File } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const ref = useDialogFocus<HTMLDivElement>(onClose);

  const pick = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const r = await validateMedia(file, "image");
    if ("error" in r) return setMsg(r.error);
    setMsg("");
    setAvatar({ url: r.url, file });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const handle = username.trim().toLowerCase();
    if (!/^[a-z0-9._]{3,24}$/.test(handle)) return setMsg("Username: 3–24 lowercase letters, numbers, dots or underscores.");
    setBusy(true); setMsg("");
    try {
      let avatar_path: string | undefined;
      if (avatar) {
        const up = await uploadAvatar(avatar.file);
        if ("error" in up) return setMsg(up.error ?? "Upload failed.");
        avatar_path = up.path;
      }
      const r = await updateProfile({ username: handle, display_name: name.trim().slice(0, 60), bio: bio.trim().slice(0, 200), ...(avatar_path ? { avatar_path } : {}) });
      if ("error" in r) return setMsg(r.error ?? "Couldn't save.");
      toast.success("Profile saved");
      onClose();
    } catch {
      setMsg("Couldn't save. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const shown = avatar?.url ?? profile?.avatar_url;
  return createPortal(
    <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="ep-title" className="safe-top outline-none fixed inset-0 z-[60] flex flex-col bg-background font-display text-foreground animate-in fade-in slide-in-from-bottom-6 duration-200">
      <form onSubmit={save} className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-y-auto overscroll-contain">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-2">
          <Button type="button" variant="ghost" size="icon" aria-label="Close" onClick={onClose} className="h-11 w-11"><X /></Button>
          <h1 id="ep-title" className="text-heading">Edit profile</h1>
          <Button type="submit" variant="ghost" disabled={busy} className="h-11 rounded-sm px-3 text-[15px] font-semibold">{busy ? "Saving…" : "Save"}</Button>
        </div>
        <div className="space-y-5 p-4">
          <label className="mx-auto flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-secondary focus-within:ring-2 focus-within:ring-foreground">
            {shown ? <img src={shown} alt="Profile photo" className="h-full w-full object-cover" /> : <Camera className="h-7 w-7 text-muted-foreground" />}
            <input type="file" accept={IMAGE_ACCEPT} aria-label="Change profile photo" className="sr-only" onChange={(e) => pick(e.currentTarget)} />
          </label>
          <p className="text-center text-caption">Tap to change photo</p>
          <div><label htmlFor="ep-user" className="text-caption font-medium">Username</label><Input id="ep-user" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={24} autoCapitalize="none" className="mt-1 h-11 rounded-sm" /></div>
          <div><label htmlFor="ep-name" className="text-caption font-medium">Name</label><Input id="ep-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="mt-1 h-11 rounded-sm" /></div>
          <div><label htmlFor="ep-bio" className="text-caption font-medium">Bio</label><Textarea id="ep-bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} className="mt-1 min-h-24 rounded-sm text-base" /><p className="mt-1 text-right text-xs text-muted-foreground">{bio.length}/200</p></div>
          {msg && <p role="alert" className="text-sm text-destructive">{msg}</p>}
        </div>
      </form>
    </div>,
    document.body,
  );
}
