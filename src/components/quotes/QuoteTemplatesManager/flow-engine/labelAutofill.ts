// מילוי אוטומטי לפי כותרת: בכל מקום בחוזה שכתובה מילה שתואמת לכותרת של שדה
// (למשל "גוש"), מוצג לידה הערך של אותו לקוח. ההצגה לא נשמרת במסמך — המסמך נשאר
// כללי ומתמלא מחדש לכל לקוח (בעורך דרך decorations, ובתצוגה/PDF דרך ה-renderer).

import type { FlowInline } from "./types";

export interface AutofillEntry {
  /** הטקסט שמחפשים במסמך */
  label: string;
  /** מפתח ה-merge data שממנו נלקח הערך */
  key: string;
}

export interface AutofillMatch {
  /** אינדקס שבו מוצג הערך */
  insertAt: number;
  /** טווח קווים תחתונים (____) שמוחלף בערך; hideFrom === hideTo כשאין */
  hideFrom: number;
  hideTo: number;
  /** הטקסט שמוצג (כולל רווח מוביל כשצריך) */
  text: string;
}

/** מסמן מקום של אלמנט שאינו טקסט (שדה דינמי) בתוך מחרוזת מאוחדת. */
export const OBJECT_CHAR = "\uFFFC";

// שדות מובנים שממולאים לפי כותרת. ת.ז., מחיר, תאריך ותוקף בכוונה לא כאן:
// יש כמה מזמינים עם ת.ז. שונה, ו"תוקף" מופיע במשפטים רגילים ("עד למתן תוקף").
export const BUILTIN_AUTOFILL_ENTRIES: AutofillEntry[] = [
  { label: "גוש", key: "parcel.block" },
  { label: "חלקה", key: "parcel.lot" },
  { label: "מגרש", key: "parcel.plot" },
  { label: 'התב"ע החלה', key: "parcel.taba" },
  { label: 'תב"ע', key: "parcel.taba" },
  { label: "משפחת", key: "customer.family" },
  { label: "משפחה", key: "customer.family" },
  { label: "שם הלקוח", key: "customer.name" },
  { label: "שם לקוח", key: "customer.name" },
  { label: "כתובת/ישוב", key: "customer.address" },
  { label: "כתובת", key: "customer.address" },
  { label: "ישוב", key: "customer.address" },
  { label: "יישוב", key: "customer.address" },
  { label: "טלפון", key: "customer.phone" },
  { label: "שטח התכנית", key: "plan.area" },
  { label: "תכנית בסמכות", key: "plan.authority" },
  { label: "סוג הפרויקט", key: "project.type" },
];

let customEntries: AutofillEntry[] = [];

/** שדות מותאמים אישית (client_custom_field_definitions) — הכותרת שלהם היא מה שמחפשים. */
export function setCustomAutofillEntries(entries: AutofillEntry[]) {
  customEntries = entries.filter((e) => e.label.trim().length >= 2);
}

export function getAutofillEntries(): AutofillEntry[] {
  return [...BUILTIN_AUTOFILL_ENTRIES, ...customEntries];
}

const QUOTE_CLASS = '["\u05F4\u201C\u201D]';
const escapeRe = (s: string) =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/"/g, QUOTE_CLASS);
const normQuotes = (s: string) => s.replace(/[\u05F4\u201C\u201D]/g, '"');

// אות/ספרה בכל שפה — כדי ש"בגוש" / "גושים" לא ייחשבו כהתאמה
const WORD_CHAR = /[\p{L}\p{N}]/u;

let cachedSig = "";
let cachedRe: RegExp | null = null;
let cachedByLabel = new Map<string, string>();

function compile(entries: AutofillEntry[]) {
  const sig = entries.map((e) => `${e.label}\u0000${e.key}`).join("\u0001");
  if (sig === cachedSig && cachedRe) return;
  cachedSig = sig;
  cachedByLabel = new Map();
  entries.forEach((e) => {
    const k = normQuotes(e.label.trim());
    if (!cachedByLabel.has(k)) cachedByLabel.set(k, e.key);
  });
  const alternation = [...cachedByLabel.keys()]
    .sort((a, b) => b.length - a.length)
    .map(escapeRe)
    .join("|");
  cachedRe = alternation ? new RegExp(`(${alternation})`, "gu") : null;
}

/**
 * מוצא בטקסט כותרות שדה ומחזיר איפה להציג את הערך.
 * lookup מחזיר את ערך השדה לפי key (ריק = לא ממלאים).
 */
export function findAutofillMatches(
  text: string,
  lookup: (key: string) => string | undefined,
  entries: AutofillEntry[] = getAutofillEntries(),
): AutofillMatch[] {
  compile(entries);
  if (!cachedRe || !text) return [];
  const out: AutofillMatch[] = [];
  cachedRe.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = cachedRe.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    // מילה שלמה בלבד
    if (start > 0 && WORD_CHAR.test(text[start - 1])) continue;
    if (end < text.length && WORD_CHAR.test(text[end])) continue;

    const key = cachedByLabel.get(normQuotes(m[0]));
    const value = key ? (lookup(key) || "").trim() : "";
    if (!value) continue;

    const tail = /^([ \t\u00A0]*:?[ \t\u00A0]*)(_{2,})?/.exec(text.slice(end));
    const sep = tail?.[1] || "";
    const underscores = tail?.[2] || "";
    const hasColon = sep.includes(":");

    if (underscores) {
      const from = end + sep.length;
      out.push({
        insertAt: from,
        hideFrom: from,
        hideTo: from + underscores.length,
        text: sep.length ? value : ` ${value}`,
      });
      cachedRe.lastIndex = from + underscores.length;
      continue;
    }

    const rest = text.slice(end + sep.length);
    // כבר יש שם שדה דינמי, מספר או "[" — לא ממלאים פעמיים
    if (rest.startsWith(OBJECT_CHAR) || /^[0-9[]/.test(rest)) continue;
    // "גוש: 7312" / 'התב"ע החלה: גז/525' — כבר כתוב ערך אחרי הנקודתיים
    if (hasColon && rest.trim() && !/^[\r\n]/.test(rest)) continue;

    if (hasColon) {
      const at = end + sep.length;
      out.push({ insertAt: at, hideFrom: at, hideTo: at, text: /[ \t\u00A0]$/.test(sep) ? value : ` ${value}` });
    } else {
      out.push({ insertAt: end, hideFrom: end, hideTo: end, text: ` ${value}` });
    }
  }
  return out;
}

/**
 * גרסת ה-renderer: מקבל שורת inlines ומחזיר אותה עם הערכים משולבים
 * (ה-____ מוחלפים, וטקסט הערך נכנס אחרי הכותרת).
 */
export function applyAutofillToInlines(
  nodes: FlowInline[],
  lookup: (key: string) => string | undefined,
): FlowInline[] {
  const flat = nodes.map((n) => (n.type === "text" ? n.text : OBJECT_CHAR)).join("");
  const matches = findAutofillMatches(flat, lookup);
  if (!matches.length) return nodes;

  const out: FlowInline[] = [];
  let offset = 0;
  let mi = 0;
  nodes.forEach((node) => {
    if (node.type !== "text") {
      out.push(node);
      offset += 1;
      return;
    }
    const start = offset;
    const end = offset + node.text.length;
    let cursor = start;
    const pushText = (from: number, to: number) => {
      if (to > from) out.push({ ...node, text: node.text.slice(from - start, to - start) });
    };
    while (mi < matches.length && matches[mi].insertAt <= end) {
      const match = matches[mi];
      // insertAt בדיוק בסוף הצומת שייך לצומת הבא אם יש שם ____ להחליף
      if (match.insertAt === end && match.hideTo > match.hideFrom && match.hideFrom >= end) break;
      pushText(cursor, match.insertAt);
      out.push({ type: "text", text: match.text, bold: node.bold, italic: node.italic, color: node.color });
      cursor = Math.min(end, Math.max(match.insertAt, match.hideTo));
      if (match.hideTo > end) {
        // הקווים ממשיכים לצומת הבא — נחתוך גם שם
        matches[mi] = { ...match, insertAt: end, hideFrom: end, text: "" };
        break;
      }
      mi += 1;
    }
    pushText(cursor, end);
    offset = end;
  });
  return out.filter((n) => n.type !== "text" || n.text !== "");
}
