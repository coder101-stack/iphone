# AREM: bundled iPhone and Android testing

## Prepared here
- Reused matching Capacitor 8.5.3 packages already installed; no new dependencies.
- Native apps load bundled client assets, not a remote website. Account data still uses the existing cloud backend.
- The normal web build also emits a TanStack SPA shell. `mobile:assets` validates and copies it into `dist/native/index.html` with its client assets.
- Native-only server-function transport sends calls to the existing published AREM app and preserves bearer authentication. Web behavior is unchanged.

## Checks and limits
Verified here: Capacitor Doctor reports matching 8.5.3 packages; the automatic web check reports build OK; five focused transport/packaging tests pass; Home and Privacy open with no browser errors or sideways overflow. Asset-copy tests used a synthetic shell, not production output.

Native compilation/signing is not available here (no Xcode, Java or Android SDK). No IPA or APK has been compiled or tested. The editor does not expose production build assets in this checkout: `mobile:assets` correctly stops with “No built SPA shell found.” Production bundling and native sync still require the commands below on your computer.

Bundled client and hosted server-function IDs must come from the same revision: publish this revision before testing AI analysis/account deletion, and rebuild native bundles after updates. Bundled web changes do **not** arrive automatically.

Email/password sign-in uses the current backend. Google’s existing web redirect is not a native callback: Google sign-in is **not verified or prepared for bundled native apps** and needs native OAuth callback setup separately. Use confirmed email/password accounts for this testing round. Verify sign-in, upload, Rock It, comments, Calls and AI analysis on actual devices; do not test account deletion with a real account.

## On your computer — shared preparation
Install Node.js 22+ and use the current repository revision:

```sh
npm install
npm run mobile:build
npx cap add android
# On a Mac only:
npx cap add ios
npx cap sync
```

Run each `cap add` only once. For subsequent updates use `npm run mobile:sync`.

## iOS → TestFlight (Mac, Xcode 26+, Apple Developer membership)
1. Run `npm run mobile:ios`.
2. In Xcode select the App target → Signing & Capabilities → your Apple team; confirm bundle ID `app.arem.social`, automatic signing, version and a unique build number.
3. Add your app icon in Assets/AppIcon. In the target's Info add Photo Library Usage Description: “AREM lets you choose photos and videos to share.” Check the minimum supported iOS version against the generated project (Capacitor 8 requires iOS 15+).
4. Create AREM in App Store Connect with the same bundle ID; complete required privacy/export-compliance details.
5. Select a generic iOS device → Product → Archive → Distribute App → App Store Connect → Upload.
6. After processing, in TestFlight create an **external** tester group for your 10 people, enter beta information and submit for Beta App Review; invite them after approval. Internal testing is only for eligible App Store Connect team members, not ordinary testers.
7. Testers install Apple’s TestFlight app and accept the invitation. Builds expire after 90 days.

## Android → test APK (Android Studio with Java 21 and SDK 36)
1. Run `npm run mobile:android`; install SDK/platform tools requested by the generated project and allow Gradle sync.
2. In Android Studio use Build → Generate App Bundles or APKs → Generate APKs (debug), or run:

```sh
cd android
./gradlew assembleDebug
# Windows: gradlew.bat assembleDebug
```

3. APK: `android/app/build/outputs/apk/debug/app-debug.apk`. This is debug-signed and for private testing only.
4. Send it to the 10 testers; they allow installation from that source, then install. Keep the same signing key for updates. No Google Play account is required for direct APK testing.
5. Test on real phones. For Play internal testing later, generate a signed AAB instead and keep the release keystore private and backed up.