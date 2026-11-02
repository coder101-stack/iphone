import { afterEach, expect, mock, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

let native = false;
const request = mock(async (_options: unknown) => ({ data: { ok: true }, status: 200, headers: { "x-tsr-serialized": "true" } }));
mock.module("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => native }, CapacitorHttp: { request } }));
const { nativeServerFetch } = await import("../src/lib/native-server-fetch");
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; native = false; request.mockClear(); });

test("web calls retain the existing fetch transport", async () => {
  const web = mock(async () => new Response("web"));
  globalThis.fetch = web as unknown as typeof fetch;
  expect(await (await nativeServerFetch("https://example.test/rpc")).text()).toBe("web");
  expect(web).toHaveBeenCalledTimes(1);
  expect(request).not.toHaveBeenCalled();
});

test("native calls target hosted AREM and retain bearer authentication and JSON body", async () => {
  native = true;
  const response = await nativeServerFetch("/_serverFn/test", {
    method: "POST", headers: { Authorization: "Bearer test-only", "content-type": "application/json" }, body: '{"data":{"reason":"test"}}',
  });
  expect(request).toHaveBeenCalledWith({ url: "https://sole-mates-network.lovable.app/_serverFn/test", method: "POST", headers: {
    authorization: "Bearer test-only", "content-type": "application/json", Origin: "https://sole-mates-network.lovable.app", Accept: "application/json",
  }, data: { data: { reason: "test" } }, responseType: "text" });
  expect(await response.json()).toEqual({ ok: true });
  expect(response.headers.get("x-tsr-serialized")).toBe("true");
});

test("native transport rejects foreign origins before transmitting credentials", async () => {
  native = true;
  await expect(nativeServerFetch("https://example.test/rpc")).rejects.toThrow("Unexpected server-function origin");
  expect(request).not.toHaveBeenCalled();
});

test("packaging copies a generated shell and bundled client media without server files", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "arem-package-"));
  try {
    mkdirSync(path.join(directory, "dist/client/assets"), { recursive: true });
    mkdirSync(path.join(directory, "dist/server"), { recursive: true });
    const html = '<html><body><script src="/assets/app.js"></script></body></html>';
    writeFileSync(path.join(directory, "dist/client/_shell.html"), html);
    writeFileSync(path.join(directory, "dist/client/assets/app.js"), "console.log('app')");
    writeFileSync(path.join(directory, "dist/server/private.js"), "server-only");
    execFileSync("node", [path.resolve("scripts/prepare-native.mjs")], { cwd: directory });
    expect(readFileSync(path.join(directory, "dist/native/index.html"), "utf8")).toBe(html);
    expect(readFileSync(path.join(directory, "dist/native/assets/app.js"), "utf8")).toBe("console.log('app')");
    expect(() => readFileSync(path.join(directory, "dist/native/private.js"))).toThrow();
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("packaging fails clearly when no production shell exists", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "arem-package-"));
  try {
    expect(() => execFileSync("node", [path.resolve("scripts/prepare-native.mjs")], { cwd: directory, stdio: "pipe" })).toThrow();
  } finally { rmSync(directory, { recursive: true, force: true }); }
});