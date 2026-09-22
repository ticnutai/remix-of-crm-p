// Token substitution for Flow Engine — מבוסס על ה-applyProjectDetailsTokens
// של HtmlTemplateEditor. מטרה: לאפשר ל-Flow לקבל את אותם נתוני הלקוח/הפרויקט
// שהוטמעו במערכת התבניות הישנה, כדי שהשם, הגוש, החלקה וכו' יופיעו בעורך.

export interface ProjectTokenData {
  clientId?: string;
  clientName?: string;
  gush?: string;
  helka?: string;
  migrash?: string;
  taba?: string;
  moshav?: string;
  family?: string;
  address?: string;
  projectType?: string;
  phone?: string;
  email?: string;
  /** שטח התכנית */
  planArea?: string;
  /** תכנית בסמכות (למשל: מקומית) */
  planAuthority?: string;
  /** ת.ז. של הלקוח הראשי */
  idNumber?: string;
  /** מזמינים נוספים (למשל בעל ואשה) — כל אחד עם שם ות.ז. */
  additionalClients?: Array<{ name?: string; idNumber?: string }>;
  /** ערכים של שדות מותאמים אישית (client_custom_field_definitions) */
  customData?: Record<string, string | number | null | undefined>;
  /** נתוני ההצעה עצמה (מחיר, תוקף, תאריך) — מוזרקים ע"י סביבת העורך */
  quote?: {
    date?: string;
    validityDays?: number | null;
    basePrice?: number | null;
    vatRate?: number | null;
    showVat?: boolean;
  };
}

const formatShekel = (n: number) =>
  `${Math.round(n).toLocaleString("he-IL")} ₪`;

/** כל המזמינים (ראשי + נוספים), שורה לכל אחד: "שם: X   ת.ז. Y". */
export function partiesLines(pd: ProjectTokenData): string {
  const parties = [
    { name: pd.clientName, idNumber: pd.idNumber },
    ...(Array.isArray(pd.additionalClients) ? pd.additionalClients : []),
  ].filter((p) => (p?.name || "").trim() || (p?.idNumber || "").trim());
  return parties
    .map((p) => {
      const name = (p.name || "").trim();
      const id = (p.idNumber || "").trim();
      return id ? `שם: ${name}   ת.ז. ${id}` : `שם: ${name}`;
    })
    .join("\n");
}

const QUOTE_NORM_RE = /[״“”"]/g;
const normalizeQuote = (s: string) => s.replace(QUOTE_NORM_RE, '"');

function buildMap(pd: ProjectTokenData): Record<string, string> {
  const family = pd.family || (pd.clientName ? String(pd.clientName).trim() : "");
  return {
    "גוש": pd.gush || "",
    "חלקה": pd.helka || "",
    "מגרש": pd.migrash || "",
    "מושב": pd.moshav || "",
    "משפחה": family,
    "משפחת": family,
    "לקוח": pd.clientName || "",
    "כתובת": pd.address || "",
    "סוג פרויקט": pd.projectType || "",
    'תב"ע': pd.taba || "",
    "תבע": pd.taba || "",
    "טלפון": pd.phone || "",
  };
}

/** Replaces [גוש], "גוש ____", and bare "גוש" forms — same as legacy editor. */
export function applyProjectTokens(content: string, pd?: ProjectTokenData): string {
  if (!content || !pd) return content;
  const map = buildMap(pd);
  const lookup = (kw: string): string | undefined => {
    if (Object.prototype.hasOwnProperty.call(map, kw)) return map[kw];
    const n = normalizeQuote(kw);
    if (Object.prototype.hasOwnProperty.call(map, n)) return map[n];
    return undefined;
  };
  const keys = Object.keys(map)
    .sort((a, b) => b.length - a.length)
    .map((k) =>
      k
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/"/g, '["\\u05F4\\u201C\\u201D]'),
    )
    .join("|");

  let out = content.replace(/\[([^\]\n]+)\]/g, (full, raw) => {
    const v = lookup(String(raw).trim());
    return v !== undefined ? v : full;
  });

  const bareUnder = new RegExp(`(${keys})(\\s*:?\\s*)_{2,}`, "g");
  out = out.replace(bareUnder, (_f, kw, sep) => {
    const v = lookup(kw) ?? "";
    const cleanSep = sep && sep.includes(":") ? ": " : " ";
    return `${kw}${cleanSep}${v}`;
  });

  const bare = new RegExp(
    `(${keys})(?!\\s*\\[)(?!\\s+[0-9])(?=[\\s,.:;!?\\n\\r]|$)`,
    "g",
  );
  out = out.replace(bare, (_f, kw) => {
    const v = lookup(kw);
    return v ? `${kw} ${v}` : _f;
  });

  return out;
}

/** Build MergeData for {{customer.name}}-style tokens from project details. */
export function projectToMergeData(pd?: ProjectTokenData): Record<string, string> {
  if (!pd) return {};
  const out: Record<string, string> = {
    "customer.name": pd.clientName || "",
    "customer.address": pd.address || "",
    "customer.phone": pd.phone || "",
    "customer.email": pd.email || "",
    "parcel.block": pd.gush || "",
    "parcel.lot": pd.helka || "",
    "parcel.plot": pd.migrash || "",
    "parcel.taba": pd.taba || "",
    "parcel.moshav": pd.moshav || "",
    "project.type": pd.projectType || "",
    "customer.idNumber": pd.idNumber || "",
    "plan.area": pd.planArea || "",
    "plan.authority": pd.planAuthority || "",
    "customer.family": pd.family || "",
    "parties.all": partiesLines(pd),
    "quote.date": pd.quote?.date || new Date().toLocaleDateString("he-IL"),
  };
  const q = pd.quote;
  if (q?.validityDays) out["quote.validity"] = `${q.validityDays} יום`;
  if (q?.basePrice && q.basePrice > 0) {
    out["price.base"] = formatShekel(q.basePrice);
    const vat = q.showVat === false ? 0 : Number(q.vatRate ?? 18);
    out["quote.total"] = formatShekel(q.basePrice * (1 + vat / 100));
  }
  // שדות מותאמים אישית — נמופים ל-custom.<field_key>
  if (pd.customData && typeof pd.customData === "object") {
    for (const [k, v] of Object.entries(pd.customData)) {
      if (v === undefined || v === null) continue;
      out[`custom.${k}`] = String(v);
    }
  }
  return out;
}
