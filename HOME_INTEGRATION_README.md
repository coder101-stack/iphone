# AREM / KICKVAULT — Home-only integration

This is your uploaded **AREM Vite/TanStack Start project** with only the Home feed updated to a TikTok-style sneaker and streetwear experience.

## Exactly what changed

- `src/components/HomeFeed.tsx` — retains the app's native Home feed, existing Community/Local/Following/For You tabs, original video post, AREM Score, Rock It, comments, saves, sharing, moderation and account data. Adds the curated sneaker/content mix; single-tap to view photos; double-tap to Rock It; mouse wheel/keyboard navigation; creator *demo* preview.
- `src/components/HomePhotoViewer.tsx` — new Home-only zoomable image gallery with image navigation, zoom 100–300%, pan when enlarged, reset, Escape to close.
- `src/assets/home/*.jpg` — 19 sample photos extracted from the screenshots/approved mockups you provided. These are **sample assets**; some are cropped from screenshots and may look softer at high zoom. Replace them with original high-resolution photos for launch.

No Discover, Trends, Profile, Create, backend, routes, app shell, or global styles were edited. The previously rejected **red Jordan 4 + handbags collage** is not present. Jordan 4 itself appears as a separate studio sneaker post.

## Option A — use the complete updated project

1. Back up your existing AREM folder.
2. Extract `AREM_KICKVAULT_Home_Updated_Project.zip` into a new folder.
3. Keep your own existing `.env` in your local installation; it was intentionally **excluded** from this ZIP. Never share service-role keys or other secrets.
4. Open the extracted project folder in VS Code.
5. Run `npm install --legacy-peer-deps`, then `npm run dev`.
6. Open the localhost URL printed by Vite (it might be `8080` or `8081`).
7. On the Home tab, swipe up/down on mobile or use the mouse wheel / Up/Down arrows on desktop.

## Option B — apply only Home to your current folder (recommended)

Extract `AREM_Home_Only_Patch.zip` and copy its `src/` directory **into the root of your existing AREM project**, keeping the folder structure. Overwrite `src/components/HomeFeed.tsx`; add `src/components/HomePhotoViewer.tsx` and `src/assets/home/`. No root `index.html` changes are needed. Restart Vite if asset imports aren't refreshed automatically.

## Notes / limitations

- The mixed post feed is intentionally demo content, while real member posts continue to work through existing Supabase integrations.
- Follows in the creator preview are local demonstration state; they do **not** write to a real follows table. Existing Rock It, comments and saved state retain their original app behavior.
- No prices, sold counts or product condition badges were added to Home. Other tabs remain intact.
- TypeScript/JSX parsing of the modified files passed. An end-to-end production build and browser integration test **could not be completed here**, because npm dependencies were not all available in the environment (offline cache was missing `zod`). Run the install/build locally.
- To run a build check: `npm run build`; for types `npx tsc --noEmit -p .`.
