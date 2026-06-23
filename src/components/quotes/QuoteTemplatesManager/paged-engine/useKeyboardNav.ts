// Keyboard navigation for the pages preview.
// - ArrowLeft  => next page (RTL: left arrow means "forward")
// - ArrowRight => previous page
// - PageDown / PageUp => same as arrows
// - Home / End => first / last page
// - Space / Shift+Space => scroll viewport by ~90% page height
// - Ctrl/Cmd+G => prompt to jump to a specific page
//
// The handler is global (window-level) but ignores key events while the
// user is typing in inputs/textareas/contenteditable.
import { useEffect } from "react";

interface KeyboardNavOptions {
  pageCount: number;
  currentPage: number;
  onPageChange: (next: number) => void;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  /** Disable all shortcuts (e.g. while a modal is open). */
  disabled?: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  // Radix popovers/dialogs typically set role
  const role = target.getAttribute("role");
  if (role === "textbox" || role === "combobox") return true;
  return false;
}

export function useKeyboardNav({
  pageCount,
  currentPage,
  onPageChange,
  scrollContainerRef,
  disabled = false,
}: KeyboardNavOptions) {
  useEffect(() => {
    if (disabled) return;

    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      // Ignore when a non-shortcut modifier is held (alt) to avoid hijacking
      if (e.altKey) return;

      const goNext = () =>
        onPageChange(Math.min(pageCount - 1, currentPage + 1));
      const goPrev = () => onPageChange(Math.max(0, currentPage - 1));

      switch (e.key) {
        case "ArrowLeft":
        case "PageDown":
          e.preventDefault();
          goNext();
          return;
        case "ArrowRight":
        case "PageUp":
          e.preventDefault();
          goPrev();
          return;
        case "Home":
          e.preventDefault();
          onPageChange(0);
          return;
        case "End":
          e.preventDefault();
          onPageChange(Math.max(0, pageCount - 1));
          return;
        case " ": {
          // Space = scroll within viewport; Shift+Space = scroll up
          const el = scrollContainerRef?.current;
          if (!el) return;
          e.preventDefault();
          const delta = el.clientHeight * 0.9 * (e.shiftKey ? -1 : 1);
          el.scrollBy({ top: delta, behavior: "smooth" });
          return;
        }
        case "g":
        case "G": {
          if (!(e.ctrlKey || e.metaKey)) return;
          e.preventDefault();
          const input = window.prompt(
            `קפיצה לעמוד (1 - ${pageCount}):`,
            String(currentPage + 1),
          );
          if (!input) return;
          const n = parseInt(input, 10);
          if (Number.isFinite(n)) {
            onPageChange(Math.min(pageCount - 1, Math.max(0, n - 1)));
          }
          return;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pageCount, currentPage, onPageChange, scrollContainerRef, disabled]);
}
