export const FLOW_STRIP_LIMITS = {
  headerHeightPx: { min: 40, max: 240, fallback: 150 },
  footerHeightPx: { min: 32, max: 160, fallback: 90 },
  widthPercent: { min: 20, max: 100, fallback: 100 },
  contentGapPx: { min: 0, max: 96, fallback: 18 },
} as const;

export function firstFlowValue<T>(...values: Array<T | null | undefined | "">): T | undefined {
  return values.find((value) => value !== undefined && value !== null && value !== "") as
    | T
    | undefined;
}

export function clampFlowNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : fallback;
  return Math.max(min, Math.min(max, Math.round(safe)));
}

export interface ResolvedFlowStripSettings {
  logoUrl?: string;
  headerUrl?: string;
  footerUrl?: string;
  backgroundColor: string;
  headerHeightPx: number;
  footerHeightPx: number;
  headerWidthPercent: number;
  footerWidthPercent: number;
  headerContentGapPx: number;
  footerContentGapPx: number;
}

/**
 * מקור האמת היחיד להגדרות הסטריפים של מנוע Flow.
 *
 * חשוב: לוגו/סטריפ עליון לעולם אינו משמש אוטומטית כתחתית. בעבר fallback כזה
 * גרם לכך שהעלאת לוגו עליון יצרה תחתית כפולה ושהגדרות שני האזורים דרסו זו את זו.
 */
export function resolveFlowStripSettings(settings?: any): ResolvedFlowStripSettings {
  const ds = settings || {};
  const logoUrl = firstFlowValue<string>(
    ds.logoUrl,
    ds.logo_url,
    ds.logoURL,
    ds.originalLogoUrl,
    ds.original_logo_url,
  );
  const logoPosition = firstFlowValue<string>(ds.logoPosition, ds.logo_position);
  const isHeaderStripLogo = logoPosition === "custom-strip" || logoPosition === "full-width";
  const headerUrl = firstFlowValue<string>(
    ds.headerStripUrl,
    ds.header_strip_url,
    ds.stripUrl,
    ds.strip_url,
    isHeaderStripLogo ? logoUrl : undefined,
  );
  const footerUrl = firstFlowValue<string>(
    ds.footerStripUrl,
    ds.footer_strip_url,
    ds.footerLogoUrl,
    ds.footer_logo_url,
  );

  const headerHeight = FLOW_STRIP_LIMITS.headerHeightPx;
  const footerHeight = FLOW_STRIP_LIMITS.footerHeightPx;
  const width = FLOW_STRIP_LIMITS.widthPercent;
  const gap = FLOW_STRIP_LIMITS.contentGapPx;

  return {
    logoUrl,
    headerUrl,
    footerUrl,
    backgroundColor:
      firstFlowValue<string>(ds.stripBgColor, ds.strip_bg_color, "#ffffff") || "#ffffff",
    headerHeightPx: headerUrl
      ? clampFlowNumber(ds.headerStripHeight, headerHeight.fallback, headerHeight.min, headerHeight.max)
      : 0,
    footerHeightPx: footerUrl
      ? clampFlowNumber(ds.footerStripHeight, footerHeight.fallback, footerHeight.min, footerHeight.max)
      : 0,
    headerWidthPercent: clampFlowNumber(
      firstFlowValue(ds.headerStripWidthPercent, ds.header_strip_width_percent),
      width.fallback,
      width.min,
      width.max,
    ),
    footerWidthPercent: clampFlowNumber(
      firstFlowValue(ds.footerStripWidthPercent, ds.footer_strip_width_percent),
      width.fallback,
      width.min,
      width.max,
    ),
    headerContentGapPx: clampFlowNumber(
      firstFlowValue(ds.headerStripContentGapPx, ds.header_content_gap_px),
      gap.fallback,
      gap.min,
      gap.max,
    ),
    footerContentGapPx: clampFlowNumber(
      firstFlowValue(ds.footerStripContentGapPx, ds.footer_content_gap_px),
      gap.fallback,
      gap.min,
      gap.max,
    ),
  };
}
