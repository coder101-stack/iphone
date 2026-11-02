import type { CapacitorConfig } from "@capacitor/cli";

// Bundle the built client; keep account data on the existing online backend.
const config: CapacitorConfig = {
  appId: "app.arem.social",
  appName: "AREM",
  webDir: "dist/native",
  backgroundColor: "#000000",
  server: {
    cleartext: false,
  },
  ios: { contentInset: "never", backgroundColor: "#000000" },
  android: { backgroundColor: "#000000" },
};

export default config;
