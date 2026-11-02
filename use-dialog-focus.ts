import { useEffect, useRef } from "react";

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Modal focus management: moves focus into the dialog on open, keeps Tab/Shift+Tab inside it,
 * optionally closes on Escape, and restores focus to the trigger when the dialog unmounts.
 */
export function useDialogFocus<T extends HTMLElement>(onEscape?: () => void) {
  const ref = useRef<T>(null);
  const escRef = useRef(onEscape);
  escRef.current = onEscape;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const previous = document.activeElement as HTMLElement | null;
    if (!node.contains(document.activeElement)) node.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && escRef.current) { escRef.current(); return; }
      if (event.key !== "Tab") return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (items.length === 0) { event.preventDefault(); return; }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === node)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    node.addEventListener("keydown", onKey);
    return () => {
      node.removeEventListener("keydown", onKey);
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, []);

  return ref;
}
