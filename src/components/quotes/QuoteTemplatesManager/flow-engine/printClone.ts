const RUNNING_ELEMENT_SELECTOR = ".running-header, .running-footer";

/**
 * Paged.js keeps the original running element hidden inside the first page and
 * renders a second copy inside the page margin. html2canvas clones both nodes,
 * so only the margin copy may be made visible for the printed bitmap.
 */
export function stabilizeRunningElementsForPrint(clonedPage: HTMLElement) {
  clonedPage
    .querySelectorAll<HTMLElement>(RUNNING_ELEMENT_SELECTOR)
    .forEach((element) => {
      const isMarginCopy = Boolean(element.closest(".pagedjs_margin"));

      element.style.setProperty("position", "static", "important");
      if (!isMarginCopy) {
        element.style.setProperty("display", "none", "important");
        return;
      }

      const display = element.classList.contains("strip")
        ? "block"
        : element.classList.contains("running-header")
          ? "flex"
          : "block";
      element.style.setProperty("display", display, "important");
    });
}
