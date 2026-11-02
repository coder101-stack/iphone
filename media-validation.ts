export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const VIDEO_ACCEPT = "video/mp4,video/quicktime";
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

type Kind = "image" | "video";

/** Identify the real format from the file's first bytes, ignoring its name/extension. */
async function sniff(file: File): Promise<Kind | null> {
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image"; // JPEG
  if (b[0] === 0x89 && ascii(1, 4) === "PNG") return "image"; // PNG
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image"; // WebP
  if (ascii(4, 8) === "ftyp") return "video"; // MP4 / MOV
  return null;
}

function decodes(url: string) {
  return new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 0);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

export async function validateMedia(
  file: File,
  allow: Kind | "any",
): Promise<{ url: string; video: boolean } | { error: string }> {
  const kind = await sniff(file).catch(() => null);
  const wanted = allow === "video" ? "an MP4 or MOV video" : allow === "image" ? "a JPEG, PNG or WebP photo" : "a JPEG, PNG or WebP photo, or an MP4/MOV video";
  if (!kind || (allow !== "any" && kind !== allow)) return { error: `That file isn't supported. Choose ${wanted}.` };
  const max = kind === "image" ? MAX_IMAGE : MAX_VIDEO;
  if (file.size > max) return { error: `That file is too big. The limit is ${max / 1024 / 1024} MB.` };
  const url = URL.createObjectURL(file);
  if (kind === "image" && !(await decodes(url))) {
    URL.revokeObjectURL(url);
    return { error: "That photo looks damaged and can't be opened. Try another." };
  }
  return { url, video: kind === "video" };
}
