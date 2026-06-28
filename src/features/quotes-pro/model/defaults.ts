// Quotes Pro — ברירות מחדל ופקטוריות ליצירת מסמכים/בלוקים
import type {
  QPBlock,
  QPDocument,
  QPHeaderBlock,
  QPPageSettings,
  QPPricingConfig,
  QPStagesBlock,
  QPPriceTableBlock,
  QPPaymentScheduleBlock,
  QPTimelineBlock,
  QPRichTextBlock,
  QPImportantNotesBlock,
  QPPricingTiersBlock,
  QPUpgradesBlock,
  QPSignatureBlock,
  QPSpacerBlock,
  QPImageBlock,
  QPHtmlBlock,
  QPBlockType,
  QPTheme,
  QPStrips,
} from "./types";

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}-${Date.now()}`;

export const DEFAULT_QP_THEME: QPTheme = {
  primaryColor: "#d8ac27",
  secondaryColor: "#1a365d",
  accentColor: "#10b981",
  fontFamily: "default",
  fontScale: "medium",
  borderStyle: "rounded",
  tableStyle: "modern",
  sectionDivider: "line",
  backgroundPattern: "none",
  watermark: null,
  footer: "detailed",
};

export const DEFAULT_QP_PAGE: QPPageSettings = {
  size: "A4",
  orientation: "portrait",
  margins: { top: 18, right: 14, bottom: 16, left: 14 },
};

export const DEFAULT_QP_STRIPS: QPStrips = {
  header: {
    enabled: false,
    height: 28,
    bgColor: "#1a365d",
    logoUrl: null,
    logoHeight: 40,
    logoAlign: "right",
    text: "",
    textColor: "#ffffff",
  },
  footer: {
    enabled: false,
    height: 16,
    bgColor: "#1a365d",
    logoUrl: null,
    logoHeight: 24,
    logoAlign: "center",
    text: "",
    textColor: "#ffffff",
    showPageNumber: true,
  },
};

export const DEFAULT_QP_PRICING: QPPricingConfig = {
  currency: "₪",
  showVat: true,
  vatRate: 18,
  vatDisplay: "breakdown",
};

// ----------------------------------------------------------------
// פקטוריות לבלוקים — מחזירות בלוק חדש מאוכלס בברירת מחדל סבירה
// ----------------------------------------------------------------
export const blockFactories: Record<QPBlockType, () => QPBlock> = {
  header: (): QPHeaderBlock => ({
    id: uid(),
    type: "header",
    logoUrl: null,
    companyName: "שם החברה",
    subtitle: "",
    contact: { phone: "", email: "", address: "", website: "" },
    variant: "gradient",
    height: "normal",
  }),

  stages: (): QPStagesBlock => ({
    id: uid(),
    type: "stages",
    title: "שלבי העבודה",
    stages: [
      {
        id: uid(),
        name: "שלב 1",
        itemDisplayMode: "check",
        items: [{ id: uid(), text: "פריט ראשון" }],
      },
    ],
  }),

  priceTable: (): QPPriceTableBlock => ({
    id: uid(),
    type: "priceTable",
    title: "פירוט מחירים",
    showVat: true,
    columns: { qty: true, unit: true, unitPrice: true, total: true },
    items: [
      {
        id: uid(),
        description: "פריט",
        quantity: 1,
        unit: "יח׳",
        unitPrice: 0,
        total: 0,
      },
    ],
  }),

  paymentSchedule: (): QPPaymentScheduleBlock => ({
    id: uid(),
    type: "paymentSchedule",
    title: "לוח תשלומים",
    steps: [
      { id: uid(), percentage: 50, description: "חתימת חוזה" },
      { id: uid(), percentage: 50, description: "סיום העבודה" },
    ],
  }),

  timeline: (): QPTimelineBlock => ({
    id: uid(),
    type: "timeline",
    title: "לוחות זמנים",
    steps: [{ id: uid(), title: "שלב", duration: "" }],
  }),

  richText: (): QPRichTextBlock => ({
    id: uid(),
    type: "richText",
    html: "<p>טקסט חופשי…</p>",
  }),

  importantNotes: (): QPImportantNotesBlock => ({
    id: uid(),
    type: "importantNotes",
    title: "נקודות חשובות",
    notes: ["הערה חשובה"],
  }),

  pricingTiers: (): QPPricingTiersBlock => ({
    id: uid(),
    type: "pricingTiers",
    title: "רמות תמחור",
    tiers: [
      { id: uid(), name: "בסיסי", price: 0, features: [] },
      { id: uid(), name: "מתקדם", price: 0, features: [], highlighted: true },
      { id: uid(), name: "פרימיום", price: 0, features: [] },
    ],
  }),

  upgrades: (): QPUpgradesBlock => ({
    id: uid(),
    type: "upgrades",
    title: "שדרוגים ותוספות",
    items: [{ id: uid(), name: "תוספת", price: 0 }],
  }),

  signature: (): QPSignatureBlock => ({
    id: uid(),
    type: "signature",
    parties: [
      { label: "הלקוח", nameLine: true, dateLine: true },
      { label: "החברה", nameLine: true, dateLine: true },
    ],
  }),

  spacer: (): QPSpacerBlock => ({ id: uid(), type: "spacer", height: 10 }),

  image: (): QPImageBlock => ({
    id: uid(),
    type: "image",
    url: "",
    align: "center",
  }),

  html: (): QPHtmlBlock => ({ id: uid(), type: "html", html: "" }),
};

export function createBlock(type: QPBlockType): QPBlock {
  return blockFactories[type]();
}

/** מסמך ריק חדש (לפני שמירה — id ריק) */
export function createEmptyDocument(): Omit<
  QPDocument,
  "id" | "created_at" | "updated_at"
> {
  return {
    name: "",
    description: "",
    category: "construction",
    folder_id: null,
    blocks: [
      blockFactories.header(),
      blockFactories.stages(),
      blockFactories.priceTable(),
      blockFactories.paymentSchedule(),
    ],
    theme_id: null,
    theme: { ...DEFAULT_QP_THEME },
    page: { ...DEFAULT_QP_PAGE },
    strips: {
      header: { ...DEFAULT_QP_STRIPS.header },
      footer: { ...DEFAULT_QP_STRIPS.footer },
    },
    pricing: { ...DEFAULT_QP_PRICING },
    validity_days: 30,
    meta: {},
    is_active: true,
  };
}

/** קטלוג הבלוקים להוספה בעורך (ספריית בלוקים) */
export const QP_BLOCK_CATALOG: Array<{
  type: QPBlockType;
  label: string;
  description: string;
}> = [
  { type: "header", label: "כותרת", description: "לוגו, שם חברה ופרטי קשר" },
  { type: "stages", label: "שלבי עבודה", description: "שלבים עם רשימת פריטים" },
  { type: "priceTable", label: "טבלת מחירים", description: "פריטים, כמות ומחיר" },
  { type: "paymentSchedule", label: "לוח תשלומים", description: "אחוזי תשלום לפי שלב" },
  { type: "timeline", label: "ציר זמן", description: "לוחות זמנים לפרויקט" },
  { type: "richText", label: "טקסט חופשי", description: "פסקה מעוצבת" },
  { type: "importantNotes", label: "נקודות חשובות", description: "רשימת הדגשות" },
  { type: "pricingTiers", label: "רמות תמחור", description: "בסיסי / מתקדם / פרימיום" },
  { type: "upgrades", label: "שדרוגים", description: "תוספות אופציונליות" },
  { type: "signature", label: "חתימות", description: "בלוק חתימה לצדדים" },
  { type: "image", label: "תמונה", description: "תמונה ממורכזת" },
  { type: "spacer", label: "ריווח", description: "רווח אנכי" },
  { type: "html", label: "HTML חופשי", description: "מקרי קצה מתקדמים" },
];
