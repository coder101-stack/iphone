# AREM Profile Experience

## Scope
Build only the Profile tab inside the existing mobile app shell. Home, Discover, unfinished tabs, and the bottom navigation remain unchanged.

## Profile layout
- Add a dedicated Profile component with an image-forward, edge-to-edge mobile layout.
- Show a creator portrait, `@username`, post/follower/following counts, short bio, and the style identity “Retro • Streetwear • Experimental.”
- Add working Follow and Message actions in the existing monochrome AREM style.

## Profile content tabs
- Add POSTS, ON FEET, ROTATION, and CALLS tabs with POSTS selected initially.
- POSTS shows a compact visual content grid.
- ON FEET filters to sneaker and outfit imagery.
- ROTATION presents currently worn or owned pairs.
- CALLS presents the user’s earlier sneaker trend predictions with concise status details.
- Keep tab switching in place without affecting app navigation.

## Media and interaction
- Reuse the project’s existing sneaker imagery where it fits and generate only the additional cohesive profile media needed.
- Make grid items tappable into a focused post view that can be dismissed, matching the existing AREM interaction language.
- Preserve safe areas, fixed bottom navigation clearance, and small-screen text/layout constraints.

## Integration and verification
- Mount Profile only when the existing Profile bottom tab is selected.
- Record the Profile component boundary in the project architecture notes.
- Verify the Profile tab, all four content tabs, Follow state, post opening/closing, and phone/desktop layouts; confirm a clean build and no runtime errors.
