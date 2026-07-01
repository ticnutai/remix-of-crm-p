// Flow Engine — Layer 2 output type
// מסמך זורם יחיד שמתקבל מ-serializer ומוזן ל-renderer.
// אין כאן מושג של "תיבות" או "מיקומים" — רק רצף בלוקים.

export type FlowInline =
  | { type: "text"; text: string; bold?: boolean; italic?: boolean; color?: string }
  | { type: "field"; key: string; fallback?: string } // {{customer.name}} → רץ דרך merger
  | { type: "raw"; html: string }; // עיצוב מורחב שמגיע מהעורך (גרדיאנט, גופן, מרווחים)

export type FlowBlock =
  | { type: "heading"; level: 1 | 2 | 3; content: FlowInline[]; align?: "right" | "center" | "left" }
  | { type: "paragraph"; content: FlowInline[]; align?: "right" | "center" | "left" }
  | { type: "list"; ordered?: boolean; items: FlowInline[][] }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
      // רמז לעימוד — האם מותר לשבור את הטבלה בין עמודים
      breakable?: boolean;
    }
  | { type: "spacer"; mm: number }
  | { type: "divider"; color?: string; thickness?: number; style?: "solid" | "dashed" | "dotted" | "double" }
  | { type: "raw"; html: string }
  | { type: "page-break" };

export interface FlowSection {
  id: string;
  title?: string;
  // keepTogether: כל החתיכה לא תישבר באמצע (לבלוקים קצרים, חתימה וכד')
  keepTogether?: boolean;
  blocks: FlowBlock[];
}

export interface FlowBranding {
  logoUrl?: string | null;
  headerStripUrl?: string | null;
  footerStripUrl?: string | null;
  stripBgColor?: string;
  headerStripHeight?: number;
  footerStripHeight?: number;
  headerStripWidthPercent?: number;
  footerStripWidthPercent?: number;
  companyName: string;
  companySubtitle?: string;
  contactLine?: string; // טלפון | מייל | כתובת
  primaryColor: string; // navy
  accentColor: string; // gold
  fontFamily: string;
}

export type FlowPageSizePreset = "none" | "A4" | "A3" | "A5" | "Letter" | "Legal" | "custom";
export type FlowPageOrientation = "portrait" | "landscape";

export interface FlowPageSetup {
  size: FlowPageSizePreset;
  orientation?: FlowPageOrientation;
  customSizeMm?: { width: number; height: number };
  marginMm: { top: number; right: number; bottom: number; left: number };
  showPageNumbers: boolean;
}

export interface FlowDocument {
  title: string;
  branding: FlowBranding;
  page: FlowPageSetup;
  sections: FlowSection[];
}
