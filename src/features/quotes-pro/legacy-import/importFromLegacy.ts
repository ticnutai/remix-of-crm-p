// Quotes Pro — כלי ייבוא חד-פעמי מהמערכת הישנה (quote_templates → qp_documents)
// קריאה בלבד מהטבלה הישנה; ממיר למודל הבלוקים החדש. אין תלות חיה.
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_QP_PAGE,
  DEFAULT_QP_PRICING,
  DEFAULT_QP_THEME,
} from "../model/defaults";
import type {
  QPBlock,
  QPCategory,
  QPDocument,
  QPStage,
  QPTheme,
} from "../model/types";

const db = () => supabase as any;
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}`;

export interface LegacyTemplateSummary {
  id: string;
  name: string;
  description?: string;
}

/** רשימת תבניות ישנות לבחירה */
export async function listLegacyTemplates(): Promise<LegacyTemplateSummary[]> {
  const { data, error } = await db()
    .from("quote_templates")
    .select("id,name,description")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as LegacyTemplateSummary[];
}

function mapCategory(c: string | undefined): QPCategory {
  switch (c) {
    case "construction":
    case "development":
    case "design":
    case "consulting":
    case "other":
      return c;
    case "marketing":
      return "renovation"; // הישן: marketing=שיפוץ
    default:
      return "other";
  }
}

function mapTheme(ds: any): QPTheme {
  if (!ds || typeof ds !== "object") return { ...DEFAULT_QP_THEME };
  return {
    primaryColor: ds.primary_color || DEFAULT_QP_THEME.primaryColor,
    secondaryColor: ds.secondary_color || DEFAULT_QP_THEME.secondaryColor,
    accentColor: ds.accent_color || DEFAULT_QP_THEME.accentColor,
    fontFamily: ["default", "modern", "classic", "elegant"].includes(ds.font_family)
      ? ds.font_family
      : "default",
    fontScale: ["small", "medium", "large"].includes(ds.font_size) ? ds.font_size : "medium",
    borderStyle: ["none", "simple", "rounded", "shadow"].includes(ds.border_style)
      ? ds.border_style
      : "rounded",
    tableStyle: ["simple", "striped", "bordered", "modern"].includes(ds.table_style)
      ? ds.table_style
      : "modern",
    sectionDivider: ["none", "line", "dots", "gradient"].includes(ds.section_divider)
      ? ds.section_divider
      : "line",
    backgroundPattern: ["none", "dots", "lines", "grid", "geometric"].includes(ds.background_pattern)
      ? ds.background_pattern
      : "none",
    watermark: ds.show_watermark && ds.watermark_text ? { text: ds.watermark_text, opacity: 0.08 } : null,
    footer: ["minimal", "detailed", "branded"].includes(ds.footer_style) ? ds.footer_style : "detailed",
  };
}

function mapStages(stages: any[]): QPStage[] {
  return (stages || []).map((s) => ({
    id: s.id || uid(),
    name: s.name || "",
    icon: s.icon,
    iconColor: s.iconColor,
    isSection: !!s.isSection,
    itemDisplayMode: ["check", "numbered", "bullet", "none"].includes(s.itemDisplayMode)
      ? s.itemDisplayMode
      : "check",
    itemDisplayColor: s.itemDisplayColor,
    items: (s.items || []).map((it: any) => ({
      id: it.id || uid(),
      text: it.text || "",
      isSpacer: !!it.isSpacer,
      icon: it.icon,
      iconColor: it.iconColor,
      fmt: {
        fontFamily: it.fontFamily,
        fontSize: it.fontSize,
        color: it.fontColor,
        bold: it.isBold,
        italic: it.isItalic,
        underline: it.isUnderline,
        align: it.textAlign,
      },
    })),
  }));
}

/** ממיר תבנית ישנה → אובייקט מסמך חדש לכתיבה */
export function convertLegacyToDocument(
  t: any,
): Omit<QPDocument, "id" | "created_at" | "updated_at"> {
  const theme = mapTheme(t.design_settings);
  const blocks: QPBlock[] = [];

  // Header מתוך הגדרות העיצוב
  const ds = t.design_settings || {};
  blocks.push({
    id: uid(),
    type: "header",
    logoUrl: ds.logo_url || null,
    companyName: ds.company_name || t.name || "",
    subtitle: ds.company_subtitle || "",
    contact: {
      phone: ds.contact_info?.phone || "",
      email: ds.contact_info?.email || "",
      address: ds.contact_info?.address || "",
      website: ds.contact_info?.website || "",
    },
    variant: ["gradient", "solid", "minimal", "modern", "classic"].includes(ds.header_style)
      ? ds.header_style
      : "gradient",
    height: ["compact", "normal", "large"].includes(ds.header_height) ? ds.header_height : "normal",
  });

  // שלבים
  if (Array.isArray(t.stages) && t.stages.length > 0) {
    blocks.push({
      id: uid(),
      type: "stages",
      title: t.stages_title || "שלבי העבודה",
      stages: mapStages(t.stages),
    });
  }

  // טבלת מחירים — מהפריטים, או שורה אחת ממחיר בסיס
  const items = Array.isArray(t.items) ? t.items : [];
  if (items.length > 0) {
    blocks.push({
      id: uid(),
      type: "priceTable",
      title: "פירוט מחירים",
      showVat: t.show_vat ?? true,
      columns: { qty: true, unit: true, unitPrice: true, total: true },
      items: items.map((it: any) => ({
        id: it.id || uid(),
        description: it.description || "",
        quantity: Number(it.quantity) || 0,
        unit: it.unit || "יח׳",
        unitPrice: Number(it.unit_price) || 0,
        total: Number(it.total) || 0,
      })),
    });
  } else if (Number(t.base_price) > 0) {
    blocks.push({
      id: uid(),
      type: "priceTable",
      title: "מחיר",
      showVat: t.show_vat ?? true,
      columns: { qty: false, unit: false, unitPrice: false, total: true },
      items: [
        { id: uid(), description: "מחיר בסיס", quantity: 1, unit: "קומפלט", unitPrice: Number(t.base_price), total: Number(t.base_price) },
      ],
    });
  }

  // לוח תשלומים
  if (Array.isArray(t.payment_schedule) && t.payment_schedule.length > 0) {
    blocks.push({
      id: uid(),
      type: "paymentSchedule",
      title: "לוח תשלומים",
      steps: t.payment_schedule.map((s: any) => ({
        id: s.id || uid(),
        percentage: Number(s.percentage) || 0,
        description: s.description || "",
      })),
    });
  }

  // ציר זמן
  if (Array.isArray(t.timeline) && t.timeline.length > 0) {
    blocks.push({
      id: uid(),
      type: "timeline",
      title: "לוחות זמנים",
      steps: t.timeline.map((s: any) => ({
        id: s.id || uid(),
        title: s.title || "",
        duration: s.duration || "",
      })),
    });
  }

  // נקודות חשובות
  if (Array.isArray(t.important_notes) && t.important_notes.length > 0) {
    blocks.push({
      id: uid(),
      type: "importantNotes",
      title: "נקודות חשובות",
      notes: t.important_notes.filter((n: any) => typeof n === "string"),
    });
  }

  // תנאים/הערות כטקסט חופשי
  if (t.terms || t.notes) {
    const parts = [t.terms, t.notes].filter(Boolean).map((x: string) => `<p>${x}</p>`);
    blocks.push({ id: uid(), type: "richText", html: parts.join("") });
  }

  // אם אין שום תוכן מובְנה אבל יש HTML — נשמר כבלוק HTML
  if (blocks.length <= 1 && t.html_content) {
    blocks.push({ id: uid(), type: "html", html: t.html_content });
  }

  const pd = t.project_details || {};
  return {
    name: t.name || "מיובא",
    description: t.description || "",
    category: mapCategory(t.category),
    folder_id: null,
    blocks,
    theme,
    theme_id: null,
    page: { ...DEFAULT_QP_PAGE },
    pricing: {
      ...DEFAULT_QP_PRICING,
      showVat: t.show_vat ?? true,
      vatRate: Number(t.vat_rate) || 18,
    },
    validity_days: Number(t.validity_days) || 30,
    meta: {
      projectName: pd.projectName || "",
      projectAddress: pd.address || "",
      gush: pd.gush || "",
      helka: pd.helka || "",
      migrash: pd.migrash || "",
    },
    is_active: true,
  };
}

/** מייבא תבנית ישנה לפי מזהה → יוצר מסמך חדש */
export async function importLegacyTemplate(legacyId: string): Promise<void> {
  const { data, error } = await db()
    .from("quote_templates")
    .select("*")
    .eq("id", legacyId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("התבנית הישנה לא נמצאה");

  const docPayload = convertLegacyToDocument(data);
  const { error: insErr } = await db().from("qp_documents").insert([docPayload]);
  if (insErr) throw insErr;
}
