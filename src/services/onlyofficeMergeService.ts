/**
 * Mail-merge for ONLYOFFICE quote documents.
 *
 * A DOCX designed in ONLYOFFICE acts as the template: it contains Hebrew
 * placeholders like {שם_לקוח}, and this service fills them from CRM data
 * (client + quote + payment schedule) with docxtemplater — no format
 * conversion, so the generated document keeps the design exactly.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  OnlyOfficeDocument,
  uploadOnlyOfficeDocument,
  createOnlyOfficeDownloadUrl,
} from "@/services/onlyofficeService";

export type MergeClient = {
  id: string;
  name: string;
  phone?: string | null;
  phone_secondary?: string | null;
  email?: string | null;
  address?: string | null;
  street?: string | null;
  company?: string | null;
  id_number?: string | null;
  gush?: string | null;
  helka?: string | null;
  migrash?: string | null;
};

export type MergeQuote = {
  id: string;
  quote_number: string;
  title: string;
  description?: string | null;
  subtotal: number;
  total_amount: number;
  discount_amount?: number | null;
  vat_rate?: number | null;
  issue_date?: string | null;
  valid_until?: string | null;
  notes?: string | null;
  payment_schedule?: unknown;
  items?: unknown;
};

const ILS = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

function formatMoney(value?: number | null) {
  return typeof value === "number" && !Number.isNaN(value) ? ILS.format(value) : "";
}

function formatHebrewDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("he-IL", { dateStyle: "long" }).format(date);
}

type PaymentRow = {
  מספר: number;
  תיאור: string;
  אחוז: string;
  סכום: string;
  תאריך: string;
};

function buildPaymentRows(quote: MergeQuote | null): PaymentRow[] {
  if (!quote) return [];
  const schedule = Array.isArray(quote.payment_schedule) ? quote.payment_schedule : [];
  return schedule.map((step: any, index: number) => {
    const percentage = Number(step?.percentage) || 0;
    const explicitAmount = Number(step?.amount) || 0;
    const amount = explicitAmount || (quote.total_amount * percentage) / 100;
    return {
      מספר: index + 1,
      תיאור: String(step?.description || ""),
      אחוז: percentage ? `${percentage}%` : "",
      סכום: formatMoney(amount),
      תאריך: formatHebrewDate(step?.due_date || step?.date),
    };
  });
}

type ItemRow = {
  מספר: number;
  תיאור: string;
  כמות: string;
  מחיר: string;
  סהכ: string;
};

function buildItemRows(quote: MergeQuote | null): ItemRow[] {
  if (!quote || !Array.isArray(quote.items)) return [];
  return (quote.items as any[]).map((item, index) => ({
    מספר: index + 1,
    תיאור: String(item?.description || item?.name || ""),
    כמות: String(item?.quantity ?? 1),
    מחיר: formatMoney(Number(item?.unit_price) || 0),
    סהכ: formatMoney(
      Number(item?.total) || (Number(item?.unit_price) || 0) * (Number(item?.quantity) || 1),
    ),
  }));
}

export function buildMergeData(client: MergeClient, quote: MergeQuote | null) {
  const address = client.address || client.street || "";
  return {
    // Client
    שם_לקוח: client.name || "",
    טלפון: client.phone || client.phone_secondary || "",
    אימייל: client.email || "",
    כתובת: address,
    חברה: client.company || "",
    תז: client.id_number || "",
    גוש: client.gush || "",
    חלקה: client.helka || "",
    מגרש: client.migrash || "",
    // Quote
    מספר_הצעה: quote?.quote_number || "",
    כותרת_הצעה: quote?.title || "",
    תיאור_הצעה: quote?.description || "",
    סכום_ביניים: formatMoney(quote?.subtotal),
    הנחה: formatMoney(quote?.discount_amount),
    מעמ: quote?.vat_rate != null ? `${quote.vat_rate}%` : "",
    סכום_כולל: formatMoney(quote?.total_amount),
    תוקף_עד: formatHebrewDate(quote?.valid_until),
    תאריך_הצעה: formatHebrewDate(quote?.issue_date),
    הערות: quote?.notes || "",
    // General
    תאריך: new Intl.DateTimeFormat("he-IL", { dateStyle: "long" }).format(new Date()),
    // Loops
    תשלומים: buildPaymentRows(quote),
    פריטים: buildItemRows(quote),
  };
}

/** The placeholder catalog, used by the sample template and the help dialog. */
export const MERGE_FIELDS: { tag: string; label: string }[] = [
  { tag: "{שם_לקוח}", label: "שם הלקוח" },
  { tag: "{טלפון}", label: "טלפון" },
  { tag: "{אימייל}", label: "אימייל" },
  { tag: "{כתובת}", label: "כתובת" },
  { tag: "{חברה}", label: "חברה" },
  { tag: "{תז}", label: "ת.ז / ח.פ" },
  { tag: "{גוש}", label: "גוש" },
  { tag: "{חלקה}", label: "חלקה" },
  { tag: "{מגרש}", label: "מגרש" },
  { tag: "{מספר_הצעה}", label: "מספר הצעה" },
  { tag: "{כותרת_הצעה}", label: "כותרת ההצעה" },
  { tag: "{תיאור_הצעה}", label: "תיאור ההצעה" },
  { tag: "{סכום_ביניים}", label: "סכום לפני מע\"מ" },
  { tag: "{הנחה}", label: "הנחה" },
  { tag: "{מעמ}", label: "שיעור מע\"מ" },
  { tag: "{סכום_כולל}", label: "סכום כולל" },
  { tag: "{תאריך_הצעה}", label: "תאריך ההצעה" },
  { tag: "{תוקף_עד}", label: "בתוקף עד" },
  { tag: "{תאריך}", label: "תאריך היום" },
  { tag: "{#תשלומים}…{/תשלומים}", label: "לולאת תשלומים: {מספר} {תיאור} {אחוז} {סכום} {תאריך}" },
  { tag: "{#פריטים}…{/פריטים}", label: "לולאת פריטים: {מספר} {תיאור} {כמות} {מחיר} {סהכ}" },
];

/**
 * Downloads the template document, fills the placeholders, and uploads the
 * result as a new ONLYOFFICE document named after the client.
 */
export async function generateQuoteDocumentFromTemplate(
  templateDocument: OnlyOfficeDocument,
  client: MergeClient,
  quote: MergeQuote | null,
) {
  if ((templateDocument.file_type || "").toLowerCase() !== "docx") {
    throw new Error("מיזוג נתונים נתמך רק במסמכי DOCX");
  }

  const [{ default: Docxtemplater }, { default: PizZip }] = await Promise.all([
    import("docxtemplater"),
    import("pizzip"),
  ]);

  const url = await createOnlyOfficeDownloadUrl(templateDocument);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`הורדת התבנית נכשלה (HTTP ${response.status})`);
  }
  const buffer = await response.arrayBuffer();

  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    // Missing fields render as empty text instead of throwing.
    nullGetter: () => "",
  });

  try {
    doc.render(buildMergeData(client, quote));
  } catch (error: any) {
    const details = error?.properties?.errors
      ?.map((e: any) => e?.properties?.explanation)
      .filter(Boolean)
      .join("; ");
    throw new Error(details || error.message || "שגיאה במילוי התבנית");
  }

  const blob = doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
  }) as Blob;

  const title = quote
    ? `הצעה ${quote.quote_number} – ${client.name}`
    : `הצעה – ${client.name}`;
  const file = new File([blob], "quote.docx", { type: blob.type });
  return uploadOnlyOfficeDocument(file, title);
}

function xmlEscape(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function rtlParagraph(text: string, options?: { bold?: boolean; size?: number }) {
  const size = options?.size ?? 22;
  const boldTag = options?.bold ? "<w:b/><w:bCs/>" : "";
  return `<w:p>
    <w:pPr><w:bidi/><w:rPr><w:rtl/><w:lang w:val="he-IL" w:bidi="he-IL"/></w:rPr></w:pPr>
    <w:r>
      <w:rPr><w:rtl/>${boldTag}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:lang w:val="he-IL" w:bidi="he-IL"/></w:rPr>
      <w:t xml:space="preserve">${xmlEscape(text)}</w:t>
    </w:r>
  </w:p>`;
}

/**
 * Creates a ready-made ONLYOFFICE document demonstrating every merge field,
 * so the user can copy tags from it into their own designs.
 */
export async function createMergeSampleDocument() {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  const simpleFields = MERGE_FIELDS.filter((f) => !f.tag.startsWith("{#"));
  const body = [
    rtlParagraph("תבנית הצעת מחיר – כל השדות הזמינים", { bold: true, size: 32 }),
    rtlParagraph("עצב את המסמך כרצונך והשאר את מצייני המקום — הם יוחלפו בנתוני הלקוח וההצעה.", { size: 20 }),
    rtlParagraph(""),
    ...simpleFields.map(({ tag, label }) => rtlParagraph(`${label}: ${tag}`)),
    rtlParagraph(""),
    rtlParagraph("פירוט תשלומים (הלולאה משכפלת את השורה לכל תשלום):", { bold: true }),
    rtlParagraph("{#תשלומים}"),
    rtlParagraph("תשלום {מספר}: {תיאור} — {אחוז} — {סכום} — {תאריך}"),
    rtlParagraph("{/תשלומים}"),
    rtlParagraph(""),
    rtlParagraph("פירוט פריטים:", { bold: true }),
    rtlParagraph("{#פריטים}"),
    rtlParagraph("{מספר}. {תיאור} — כמות: {כמות} — מחיר: {מחיר} — סה\"כ: {סהכ}"),
    rtlParagraph("{/פריטים}"),
    rtlParagraph(""),
    rtlParagraph("סה\"כ לתשלום: {סכום_כולל}", { bold: true, size: 26 }),
  ].join("\n");

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`,
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  );
  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
  );
  zip.file(
    "word/styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="he-IL" w:eastAsia="en-US" w:bidi="he-IL"/></w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:bidi/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:bidi/></w:pPr><w:rPr><w:lang w:val="he-IL" w:bidi="he-IL"/></w:rPr></w:style>
</w:styles>`,
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${body}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
      <w:bidi/>
    </w:sectPr>
  </w:body>
</w:document>`,
  );

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
  });
  const file = new File([blob], "quote-template-sample.docx", { type: blob.type });
  return uploadOnlyOfficeDocument(file, "תבנית הצעה – דוגמת שדות");
}

export async function listMergeClients(search: string): Promise<MergeClient[]> {
  let query = (supabase as any)
    .from("clients")
    .select(
      "id,name,phone,phone_secondary,email,address,street,company,id_number,gush,helka,migrash",
    )
    .order("name")
    .limit(20);
  if (search.trim()) {
    query = query.ilike("name", `%${search.trim()}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as MergeClient[];
}

export async function listMergeQuotes(clientId: string): Promise<MergeQuote[]> {
  const { data, error } = await (supabase as any)
    .from("quotes")
    .select(
      "id,quote_number,title,description,subtotal,total_amount,discount_amount,vat_rate,issue_date,valid_until,notes,payment_schedule,items",
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data || []) as MergeQuote[];
}

export type MergeTemplate = {
  id: string;
  name: string;
};

export async function listMergeTemplates(): Promise<MergeTemplate[]> {
  const { data, error } = await (supabase as any)
    .from("quote_templates")
    .select("id,name")
    .eq("is_active", true)
    .order("name")
    .limit(50);
  if (error) throw error;
  return (data || []) as MergeTemplate[];
}

/**
 * Loads a quote template and adapts its base price + payment schedule into the
 * MergeQuote shape, so a template's own pricing can fill an ONLYOFFICE document
 * without needing an existing quote.
 */
export async function loadTemplateAsMergeQuote(templateId: string): Promise<MergeQuote> {
  const { data, error } = await (supabase as any)
    .from("quote_templates")
    .select("id,name,description,base_price,vat_rate,validity_days,payment_schedule,items,notes")
    .eq("id", templateId)
    .single();
  if (error) throw error;

  const base = Number(data.base_price) || 0;
  const vat = Number(data.vat_rate) || 0;
  const total = base + (base * vat) / 100;
  return {
    id: data.id,
    quote_number: "",
    title: data.name || "",
    description: data.description || "",
    subtotal: base,
    total_amount: total,
    discount_amount: 0,
    vat_rate: vat,
    issue_date: new Date().toISOString(),
    valid_until: data.validity_days
      ? new Date(Date.now() + data.validity_days * 86400000).toISOString()
      : null,
    notes: data.notes || "",
    payment_schedule: data.payment_schedule,
    items: data.items,
  };
}
