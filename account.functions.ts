import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Permanently deletes the caller's account, media and all their rows (cascade from profiles). */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const { data: files } = await supabaseAdmin.storage.from("posts").list(userId, { limit: 1000 });
    if (files?.length) await supabaseAdmin.storage.from("posts").remove(files.map((f) => `${userId}/${f.name}`));
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error("Couldn't delete account.");
    return { ok: true };
  });
