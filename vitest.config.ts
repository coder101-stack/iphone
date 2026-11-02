import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Standalone test config: avoids loading the TanStack Start / Nitro build plugins.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.{ts,tsx}"], environment: "node" },
});
