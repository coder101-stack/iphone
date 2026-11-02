import { access, cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

// The existing Lovable/Nitro build uses these locations in different environments.
const candidates = ["dist/client", ".output/public"];
const outputs = [];
for (const directory of candidates) {
  try {
    const info = await stat(path.join(directory, "_shell.html"));
    outputs.push({ directory, modified: info.mtimeMs });
  } catch { /* Not every build emits both locations. */ }
}
outputs.sort((a, b) => b.modified - a.modified);
const source = outputs[0]?.directory;
if (!source) throw new Error("No built SPA shell found. Run npm run mobile:build first.");
const html = await readFile(path.join(source, "_shell.html"), "utf8");
if (!/<script\b[^>]*\bsrc=/i.test(html)) throw new Error("Built shell has no client script.");
for (const match of html.matchAll(/(?:src|href)="(\/(?:assets|_build)\/[^"?#]+)[^"]*"/g)) {
  await access(path.join(source, match[1].slice(1)));
}
await rm("dist/native", { recursive: true, force: true });
await mkdir("dist/native", { recursive: true });
await cp(source, "dist/native", {
  recursive: true,
  filter: (entry) => !path.relative(source, entry).split(path.sep).some((part) => part.startsWith(".")),
});
await writeFile("dist/native/index.html", html);
console.log(`Prepared bundled Capacitor assets from ${source}.`);