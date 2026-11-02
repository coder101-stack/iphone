import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X } from "lucide-react";

/** Zoomable image gallery, scoped to the Home feed. Never changes the app's routes or theme. */
export function HomePhotoViewer({
  images, title, onClose,
}: {
  images: string[];
  title: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const down = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const buttonStyle = "flex h-11 w-11 items-center justify-center border border-white/25 bg-black/70 text-white active:bg-white/20";
  const change = (delta: number) => {
    setIndex((current) => (current + delta + images.length) % images.length);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };
  const reset = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft" && images.length > 1) { event.preventDefault(); change(-1); }
      else if (event.key === "ArrowRight" && images.length > 1) { event.preventDefault(); change(1); }
      else if (event.key === "+" || event.key === "=") setZoom((z) => Math.min(3, +(z + .25).toFixed(2)));
      else if (event.key === "-") setZoom((z) => Math.max(1, +(z - .25).toFixed(2)));
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [images.length, onClose]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`View photos: ${title}`} className="fixed inset-0 z-[75] flex flex-col bg-black text-white">
      <div className="safe-top relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-white/20 px-4">
        <div className="min-w-0 pr-3"><p className="truncate text-sm font-semibold">{title}</p><p className="text-xs text-white/65">{index + 1} / {images.length} · {Math.round(zoom * 100)}%</p></div>
        <button className={buttonStyle} onClick={onClose} aria-label="Close photo viewer"><X /></button>
      </div>
      <div
        className="relative flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden bg-[#111]"
        onWheel={(event) => {
          if (!event.ctrlKey && Math.abs(event.deltaY) < 3) return;
          event.preventDefault();
          setZoom((z) => Math.min(3, Math.max(1, +(z + (event.deltaY < 0 ? .15 : -.15)).toFixed(2))));
        }}
        onPointerDown={(e) => { if (zoom > 1) { e.currentTarget.setPointerCapture(e.pointerId); down.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }; } }}
        onPointerMove={(e) => { if (down.current && zoom > 1) setOffset({ x: down.current.ox + e.clientX - down.current.x, y: down.current.oy + e.clientY - down.current.y }); }}
        onPointerUp={() => { down.current = null; }}
        onPointerCancel={() => { down.current = null; }}
        onDoubleClick={() => { if (zoom === 1) setZoom(2); else reset(); }}
      >
        <img src={images[index]} alt={`${title}, image ${index + 1}`} draggable={false} className="h-full w-full select-none object-cover object-[50%_65%]" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transition: down.current ? "none" : "transform 120ms ease-out" }} />
        {images.length > 1 && <>
          <button className={`${buttonStyle} absolute left-2 top-1/2 -translate-y-1/2`} onClick={() => change(-1)} aria-label="Previous image"><ChevronLeft /></button>
          <button className={`${buttonStyle} absolute right-2 top-1/2 -translate-y-1/2`} onClick={() => change(1)} aria-label="Next image"><ChevronRight /></button>
        </>}
      </div>
      <div className="safe-bottom flex shrink-0 items-center justify-center gap-3 border-t border-white/20 px-3 py-3">
        <button className={buttonStyle} onClick={() => setZoom((z) => Math.max(1, +(z - .25).toFixed(2)))} aria-label="Zoom out" disabled={zoom <= 1}><Minus /></button>
        <button className={`${buttonStyle} w-auto px-4 text-xs font-semibold`} onClick={reset} aria-label="Reset zoom"><RotateCcw className="mr-2 h-4 w-4" /> Reset</button>
        <button className={buttonStyle} onClick={() => setZoom((z) => Math.min(3, +(z + .25).toFixed(2)))} aria-label="Zoom in" disabled={zoom >= 3}><Plus /></button>
      </div>
    </div>, document.body
  );
}
