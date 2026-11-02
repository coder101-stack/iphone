import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { BottomNav, type TabId } from "@/components/BottomNav";
import { HomeFeed } from "@/components/HomeFeed";
import { Discover } from "@/components/Discover";
import { Profile } from "@/components/Profile";
import { Trends } from "@/components/Trends";
import { Create } from "@/components/Create";
import { AuthSheet } from "@/components/AuthSheet";
import { startAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/integrations/supabase/config";
import { OfflineBanner, TabErrorBoundary } from "@/components/AppStates";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AREM — Sneaker Social" },
      {
        name: "description",
        content:
          "AREM is the premium social network for sneakerheads: share your rotation, discover heat, and follow the trends.",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { property: "og:title", content: "AREM — Sneaker Social" },
      {
        property: "og:description",
        content:
          "Share your rotation, discover heat, and follow sneaker trends on AREM.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AppShell,
});

/**
 * AREM mobile app shell — Option A (Apple-inspired minimal), iPhone-first.
 * Home is an immersive media feed (scoped "dark" tokens so overlays stay legible on video);
 * every other tab uses the white Option A surfaces. Each tab has its own error boundary.
 */
function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [creating, setCreating] = useState(false);
  // Shared sneaker links (/?sneaker=<model>) open on Trends.
  const supabaseConfigured = isSupabaseConfigured();
  useEffect(() => { if (supabaseConfigured) startAuth(); }, [supabaseConfigured]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("sneaker")) setActiveTab("trends");
  }, []);
  const select = (id: TabId) => (id === "create" ? setCreating(true) : setActiveTab(id));
  const createSheet = <>{creating && <Create onClose={() => setCreating(false)} />}<AuthSheet /><OfflineBanner /></>;

  // Keep the real Supabase-backed app. If credentials have not been supplied yet,
  // present setup instructions instead of crashing the Home/PostSlide tree.
  if (!supabaseConfigured) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#111] px-6 py-12 text-white">
        <div className="w-full max-w-xl space-y-5 border border-white/20 bg-[#181818] p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">AREM · KICKVAULT</p>
          <h1 className="text-2xl font-bold">Connect your Supabase project</h1>
          <p className="text-sm leading-relaxed text-white/70">
            Your account, posts and comments still use Supabase. To finish local setup,
            create <code className="text-white">.env.local</code> in the project root using
            <code className="text-white"> .env.example</code>, and copy your project's
            publishable API key from the Supabase dashboard.
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-white/85">
            <li>Open your Supabase project → Settings → API Keys.</li>
            <li>Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.</li>
            <li>Set the server equivalents SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.</li>
            <li>Save the file, stop Vite, and run npm.cmd run dev again.</li>
          </ol>
          <p className="text-xs leading-relaxed text-white/60">
            Only use a publishable or anon key in VITE_ variables. Never put a service-role
            or secret key in browser-exposed variables.
          </p>
          <a className="inline-flex border border-white/60 px-5 py-3 text-sm font-semibold hover:bg-white/10"
            href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
            Open Supabase dashboard
          </a>
        </div>
      </main>
    );
  }

  if (activeTab === "home") {
    return (
      <div className="h-dvh overflow-hidden bg-black text-foreground">
        {/* Immersive feed fills the screen above the nav bar */}
        <main className="dark fixed inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] bg-background text-foreground">
          <TabErrorBoundary name="Home"><HomeFeed /></TabErrorBoundary>
        </main>
        <header className="dark safe-top pointer-events-none fixed inset-x-0 top-0 z-40">
          <div className="relative flex h-14 items-center justify-center">
            <button
              type="button"
              aria-label="Search"
              onClick={() => setActiveTab("discover")}
              className="pointer-events-auto absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-foreground"
            >
              <Search className="h-5 w-5 drop-shadow-lg" strokeWidth={1.8} />
            </button>
          </div>
        </header>
        <BottomNav active={activeTab} onSelect={select} />
        {createSheet}
      </div>
    );
  }

  if (activeTab === "discover") {
    return (
      <div className="min-h-dvh bg-background text-foreground">
        <AppHeader />
        <main className="pb-nav">
          <TabErrorBoundary name="Discover"><Discover /></TabErrorBoundary>
        </main>
        <BottomNav active={activeTab} onSelect={select} />
        {createSheet}
      </div>
    );
  }

  if (activeTab === "profile") {
    return (
      <div className="min-h-dvh bg-background text-foreground">
        <AppHeader />
        <main className="pb-nav">
          <TabErrorBoundary name="Profile"><Profile onCreate={() => setCreating(true)} /></TabErrorBoundary>
        </main>
        <BottomNav active={activeTab} onSelect={select} />
        {createSheet}
      </div>
    );
  }

  if (activeTab === "trends") {
    return (
      <div className="min-h-dvh bg-background text-foreground">
        <AppHeader />
        <main className="pb-nav">
          <TabErrorBoundary name="Trends"><Trends /></TabErrorBoundary>
        </main>
        <BottomNav active={activeTab} onSelect={select} />
        {createSheet}
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <AppHeader />

      <main className="flex-1 pb-nav">
        <div className="flex min-h-[60vh] items-center justify-center px-6">
          <p className="text-center text-caption">Coming soon.</p>
        </div>
      </main>

      <BottomNav active={activeTab} onSelect={select} />
        {createSheet}
    </div>
  );
}

/** Option A top bar: white, hairline bottom border, wordmark at 17px semibold. */
function AppHeader() {
  return (
    <header className="safe-top sticky top-0 z-40 border-b border-border bg-background">
      <div className="flex h-14 items-center justify-center">
        <span className="font-display pl-[0.35em] text-[17px] font-semibold uppercase tracking-[0.35em]">Arem</span>
      </div>
    </header>
  );
}
