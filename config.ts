/** Shared environment validation for the AREM Supabase connection.
 * No credentials are hard-coded here. VITE_ vars are safe public project settings.
 * Service-role/secret credentials are never read in browser code.
 */
export function getSupabasePublicConfig() {
  const runtime = typeof process === "undefined" ? undefined : process.env;
  return {
    url: (import.meta.env.VITE_SUPABASE_URL || runtime?.SUPABASE_URL || "").trim(),
    key: (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || runtime?.SUPABASE_PUBLISHABLE_KEY || "").trim(),
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabasePublicConfig();
  return /^https?:\/\/[^\s]+$/.test(url) && key.length > 12 && !/PASTE|PLACEHOLDER|YOUR_KEY|YOUR_PROJECT/i.test(key);
}
