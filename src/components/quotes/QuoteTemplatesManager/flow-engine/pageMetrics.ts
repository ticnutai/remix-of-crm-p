import type { FlowPageSetup, FlowPageSizePreset } from "./types";

export const MM_TO_PX = 96 / 25.4;

export const FLOW_PAGE_SIZES_MM: Record<Exclude<FlowPageSizePreset, "none" | "custom">, { width: number; height: number }> = {
  A5: { width: 148, height: 210 },
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  Letter: { width: 216, height: 279 },
  Legal: { width: 216, height: 356 },
};

export const DEFAULT_FLOW_MARGIN_MM = { top: 32, right: 18, bottom: 28, left: 18 };

export function mmToPx(mm: number) {
  return mm * MM_TO_PX;
}

export function resolveFlowPageMetrics(pageSetup?: FlowPageSetup) {
  const base =
    pageSetup?.size === "custom"
      ? {
          width: Math.max(50, pageSetup.customSizeMm?.width || 210),
          height: Math.max(50, pageSetup.customSizeMm?.height || 297),
        }
      : FLOW_PAGE_SIZES_MM[(pageSetup?.size || "A4") as keyof typeof FLOW_PAGE_SIZES_MM] || FLOW_PAGE_SIZES_MM.A4;
  const landscape = pageSetup?.size !== "custom" && pageSetup?.orientation === "landscape";
  const widthMm = landscape ? base.height : base.width;
  const heightMm = landscape ? base.width : base.height;
  const marginMm = pageSetup?.marginMm || DEFAULT_FLOW_MARGIN_MM;

  return {
    widthMm,
    heightMm,
    marginMm,
    widthPx: mmToPx(widthMm),
    heightPx: mmToPx(heightMm),
    marginPx: {
      top: mmToPx(marginMm.top),
      right: mmToPx(marginMm.right),
      bottom: mmToPx(marginMm.bottom),
      left: mmToPx(marginMm.left),
    },
  };
}

export function flowPageSizeCss(page: FlowPageSetup): string {
  if (page.size === "none") return "auto";
  const { widthMm, heightMm } = resolveFlowPageMetrics(page);
  return `${widthMm}mm ${heightMm}mm`;
}

export function flowCoordinateGuideLabel(pageSetup?: FlowPageSetup): string {
  const { widthMm, heightMm, widthPx, heightPx } = resolveFlowPageMetrics(pageSetup);
  return `TL 0,0 | TR ${widthMm}mm/${widthPx.toFixed(2)}px,0 | BL 0,${heightMm}mm/${heightPx.toFixed(2)}px | BR ${widthMm}mm/${widthPx.toFixed(2)}px,${heightMm}mm/${heightPx.toFixed(2)}px`;
}
