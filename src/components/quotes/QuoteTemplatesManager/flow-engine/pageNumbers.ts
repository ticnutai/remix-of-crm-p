import type {
  FlowPageNumberFormat,
  FlowPageNumberPosition,
  FlowPageNumberSettings,
  FlowPageNumberShape,
} from "./types";

export const PAGE_NUMBER_POSITIONS: Array<{ value: FlowPageNumberPosition; label: string }> = [
  { value: "top-right", label: "למעלה מימין" },
  { value: "top-center", label: "למעלה במרכז" },
  { value: "top-left", label: "למעלה משמאל" },
  { value: "bottom-right", label: "למטה מימין" },
  { value: "bottom-center", label: "למטה במרכז" },
  { value: "bottom-left", label: "למטה משמאל" },
];

export const PAGE_NUMBER_SHAPES: Array<{ value: FlowPageNumberShape; label: string }> = [
  { value: "plain", label: "נקי — ללא מסגרת" },
  { value: "pill", label: "גלולה" },
  { value: "circle", label: "עיגול" },
  { value: "square", label: "ריבוע מעוגל" },
];

export const PAGE_NUMBER_FORMATS: Array<{ value: FlowPageNumberFormat; label: string }> = [
  { value: "page", label: "עמוד 1" },
  { value: "number", label: "1" },
  { value: "dash", label: "— 1 —" },
];

export const PAGE_NUMBER_FONTS = [
  { label: "Heebo", value: "Heebo, Arial, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Alef", value: "Alef, Arial, sans-serif" },
  { label: "Noto Sans Hebrew", value: "'Noto Sans Hebrew', Arial, sans-serif" },
  { label: "Frank Ruhl Libre", value: "'Frank Ruhl Libre', serif" },
  { label: "David Libre", value: "'David Libre', serif" },
] as const;

export const DEFAULT_PAGE_NUMBER_SETTINGS: FlowPageNumberSettings = {
  position: "bottom-center",
  fontFamily: "Heebo, Arial, sans-serif",
  fontSizePx: 10,
  color: "#64748b",
  backgroundColor: "#ffffff",
  shape: "plain",
  format: "page",
};

const POSITIONS = new Set(PAGE_NUMBER_POSITIONS.map((item) => item.value));
const SHAPES = new Set(PAGE_NUMBER_SHAPES.map((item) => item.value));
const FORMATS = new Set(PAGE_NUMBER_FORMATS.map((item) => item.value));

function safeColor(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function safeFont(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return DEFAULT_PAGE_NUMBER_SETTINGS.fontFamily;
  const known = PAGE_NUMBER_FONTS.find((item) => item.value === value);
  return known?.value || DEFAULT_PAGE_NUMBER_SETTINGS.fontFamily;
}

export function normalizePageNumberSettings(
  value?: Partial<FlowPageNumberSettings> | null,
): FlowPageNumberSettings {
  const size = Number(value?.fontSizePx);
  const shape = SHAPES.has(value?.shape as FlowPageNumberShape)
    ? (value?.shape as FlowPageNumberShape)
    : DEFAULT_PAGE_NUMBER_SETTINGS.shape;
  const requestedFormat = FORMATS.has(value?.format as FlowPageNumberFormat)
    ? (value?.format as FlowPageNumberFormat)
    : DEFAULT_PAGE_NUMBER_SETTINGS.format;
  return {
    position: POSITIONS.has(value?.position as FlowPageNumberPosition)
      ? (value?.position as FlowPageNumberPosition)
      : DEFAULT_PAGE_NUMBER_SETTINGS.position,
    fontFamily: safeFont(value?.fontFamily),
    fontSizePx: Number.isFinite(size) ? Math.max(8, Math.min(32, Math.round(size))) : DEFAULT_PAGE_NUMBER_SETTINGS.fontSizePx,
    color: safeColor(value?.color, DEFAULT_PAGE_NUMBER_SETTINGS.color),
    backgroundColor: safeColor(value?.backgroundColor, DEFAULT_PAGE_NUMBER_SETTINGS.backgroundColor),
    shape,
    // A circle/square is intentionally reserved for the compact number-only form.
    format: shape === "circle" || shape === "square" ? "number" : requestedFormat,
  };
}

export function pageNumberText(format: FlowPageNumberFormat, token: string) {
  if (format === "number") return token;
  if (format === "dash") return `— ${token} —`;
  return `עמוד ${token}`;
}

export function isTopPageNumber(position: FlowPageNumberPosition) {
  return position.startsWith("top-");
}

export function pageNumberHorizontalCss(position: FlowPageNumberPosition) {
  if (position.endsWith("-left")) return "left:6mm;right:auto;transform:none;";
  if (position.endsWith("-right")) return "right:6mm;left:auto;transform:none;";
  return "left:50%;right:auto;transform:translateX(-50%);";
}

export function pageNumberShapeCss(settings: FlowPageNumberSettings) {
  if (settings.shape === "plain") {
    return "min-width:0;height:auto;padding:0;border:0;border-radius:0;background:transparent;";
  }
  if (settings.shape === "circle") {
    return `width:26px;height:26px;min-width:26px;padding:0;border:1px solid ${settings.color}33;border-radius:999px;background:${settings.backgroundColor};`;
  }
  if (settings.shape === "square") {
    return `width:28px;height:26px;min-width:28px;padding:0;border:1px solid ${settings.color}33;border-radius:6px;background:${settings.backgroundColor};`;
  }
  return `min-width:38px;height:24px;padding:0 9px;border:1px solid ${settings.color}33;border-radius:999px;background:${settings.backgroundColor};`;
}
