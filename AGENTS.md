<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture

- AREM is a mobile-first app; the app shell (fixed bottom nav + safe-area handling) lives in `src/routes/index.tsx` with `src/components/BottomNav.tsx`. Pages mount inside the shell's `<main>`, not as separate layouts.
- Discover lives in `src/components/Discover.tsx` and mounts inside the existing shell, with its own mock discovery posts and in-place post viewer; keep HomeFeed independent so Discover changes do not change Home.
- Profile lives in `src/components/Profile.tsx` and mounts inside the existing shell, with self-contained mock profile posts and local-only social interactions; this keeps its content independent of Home and Discover.
- The theme is Option A (Apple-inspired light minimal): `:root` in `src/styles.css` holds white/#0A0A0A tokens; the `.dark` class is reserved for immersive media scopes (the Home video/posts feed). Keep secondary text, nav-inactive and destructive tokens at ≥ 4.5:1 contrast. iPhone safe areas use the `safe-top`/`safe-bottom`/`pb-nav` utilities plus `viewport-fit=cover`.
- Score tiers live in `src/lib/app-score.ts` (6 tiers: Emerging/Rising/Cool/Hot/Blazing/Exotic, Exotic = 90–100, classified with truncation `Math.floor(score*10)/10`). Render scores only through `src/components/AppScore.tsx` (variants `profile`/`feed`); `getAremRank` in `src/lib/arem-score.ts` delegates to it. Tier boundary tests: `npm test`.
- AREM score details are a shared, mock-only overlay opened from score displays; keep score inspection separate from each screen's social interactions until scoring infrastructure exists.
- Trends lives in `src/components/Trends.tsx` inside the existing app shell and uses independent mock sneaker Trend Scores; keep these separate from personal AREM Scores so product momentum never changes a user's rank.


- Saved calls live in `src/lib/calls.ts`, backed by the `calls` table for the signed-in member; results compare the called Trend Score with the current one.
- AI call analysis runs server-side through the AI Gateway (`call-analysis.server.ts`) and judges cultural signals only, never resale price.
- Create is a portal overlay (`src/components/Create.tsx`) opened by the + button, not a tab; posts upload to the private `posts` bucket under `<userId>/` and are stored in `posts` via `src/lib/posts.ts`, served through expiring signed URLs.
- Social state (Rock Its keyed `post:<id>`/`sneaker:<model>`, comments, share) lives in `src/lib/social.ts`, backed by account tables; guests are prompted to sign in via the shared AuthSheet (`src/lib/auth.ts`) so one store keeps every screen in sync.
- Profiles are created by an auth-signup trigger; AREM scores are not member-writable (column-level grants) so nobody can set their own rank.
- Uploads are checked by real file bytes, size and decode in `src/lib/media-validation.ts` before any preview; security headers are added to every response in `src/server.ts`.
- Native iOS/Android apps bundle the generated TanStack SPA shell and client assets via scripts/prepare-native.mjs; native server-function transport targets the existing hosted app while the web transport and backend remain unchanged.
