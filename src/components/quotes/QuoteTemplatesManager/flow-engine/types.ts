// Flow Engine — Layer 2 output type
// מסמך זורם יחיד שמתקבל מ-serializer ומוזן ל-renderer.
// אין כאן מושג של "תיבות" או "מיקומים" — רק רצף בלוקים.

export type FlowInline =
  | { type: "text"; text: string; bold?: boolean; italic?: boolean; color?: string }
  | { type: "field"; key: string; fallback?: string }; // {{customer.name}} → רץ דרך merger

export type FlowBlock =
  | { type: "heading"; level: 1 | 2 | 3; content: FlowInline[] }
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
  | { type: "divider" }
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
  companyName: string;
  companySubtitle?: string;
  contactLine?: string; // טלפון | מייל | כתובת
  primaryColor: string; // navy
  accentColor: string; // gold
  fontFamily: string;
}

export interface FlowPageSetup {
  size: "A4" | "Letter";
  marginMm: { top: number; right: number; bottom: number; left: number };
  showPageNumbers: boolean;
}

export interface FlowDocument {
  title: string;
  branding: FlowBranding;
  page: FlowPageSetup;
  sections: FlowSection[];
}
