// Quotes Pro — מנוע רינדור: בלוק → HTML
// פונקציות טהורות, ללא React. משמשות גם בתצוגה מקדימה וגם בייצוא PDF.
import type {
  QPBlock,
  QPDocument,
  QPHeaderBlock,
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
  QPTheme,
} from "../model/types";

// בריחת HTML למניעת הזרקה בשדות טקסט
export function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(n: number, currency = "₪"): string {
  const v = Number.isFinite(n) ? n : 0;
  return `${currency}${v.toLocaleString("he-IL")}`;
}

interface RenderCtx {
  theme: QPTheme;
  currency: string;
  vatRate: number;
  vatDisplay: "breakdown" | "plus-vat";
  /** סך כל ההצעה (מטבלת המחירים) — לחישוב סכומי תשלום */
  baseTotal: number;
  /** מצב עריכה ישירה — עוטף שדות טקסט ב-contenteditable עם data-qp-edit */
  editable?: boolean;
  /** מזהה הבלוק הנוכחי (קידומת לנתיב העריכה) */
  blockId?: string;
}

/** עוטף טקסט הניתן לעריכה ישירה (כשהרינדור במצב editable) */
function ed(ctx: RenderCtx, path: string, text: unknown): string {
  const e = esc(text);
  if (!ctx.editable || !ctx.blockId) return e;
  return `<span data-qp-edit="${ctx.blockId}::${path}" contenteditable="true" class="qp-editable">${e}</span>`;
}

// עטיפת בלוק עם מאפייני עימוד וסגנון
function wrap(block: QPBlock, inner: string): string {
  if (block.hidden) return "";
  const cls = [
    "qp-block",
    `qp-block-${block.type}`,
    block.keepTogether ? "keep-together" : "",
    block.pageBreakBefore ? "page-break" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const s = block.style || {};
  const styles = [
    s.backgroundColor ? `background:${s.backgroundColor}` : "",
    s.textColor ? `color:${s.textColor}` : "",
    s.paddingTop != null ? `padding-top:${s.paddingTop}px` : "",
    s.paddingBottom != null ? `padding-bottom:${s.paddingBottom}px` : "",
    s.align ? `text-align:${s.align}` : "",
  ]
    .filter(Boolean)
    .join(";");
  return `<section class="${cls}"${styles ? ` style="${styles}"` : ""}>${inner}</section>`;
}

// ---- Header ----
function renderHeader(b: QPHeaderBlock, ctx: RenderCtx): string {
  const { primaryColor, secondaryColor } = ctx.theme;
  const bg =
    b.variant === "gradient"
      ? `background:linear-gradient(135deg,${primaryColor},${secondaryColor})`
      : b.variant === "solid"
        ? `background:${primaryColor}`
        : "";
  const isFilled = b.variant === "gradient" || b.variant === "solid";
  const color = isFilled ? "#fff" : secondaryColor;
  const pad = b.height === "compact" ? "16px" : b.height === "large" ? "40px" : "26px";
  const logo = b.logoUrl
    ? `<img src="${esc(b.logoUrl)}" alt="logo" style="max-height:64px;object-fit:contain" />`
    : "";
  const contactParts = [
    b.contact.phone && `☎ ${esc(b.contact.phone)}`,
    b.contact.email && `✉ ${esc(b.contact.email)}`,
    b.contact.website && `🌐 ${esc(b.contact.website)}`,
    b.contact.address && `📍 ${esc(b.contact.address)}`,
  ].filter(Boolean);
  return `
  <div class="qp-header" style="${bg};color:${color};padding:${pad};border-radius:10px;display:flex;align-items:center;justify-content:space-between;gap:16px">
    <div>
      <div style="font-size:24px;font-weight:800">${ed(ctx, "companyName", b.companyName)}</div>
      ${b.subtitle ? `<div style="opacity:.85;font-size:14px;margin-top:4px">${ed(ctx, "subtitle", b.subtitle)}</div>` : ""}
      ${contactParts.length ? `<div style="font-size:12px;opacity:.8;margin-top:8px;display:flex;gap:14px;flex-wrap:wrap">${contactParts.map((p) => `<span>${p}</span>`).join("")}</div>` : ""}
    </div>
    ${logo ? `<div>${logo}</div>` : ""}
  </div>`;
}

// ---- Stages ----
function renderStages(b: QPStagesBlock, ctx: RenderCtx): string {
  const { primaryColor } = ctx.theme;
  const itemMarker = (mode: string, idx: number, color?: string) => {
    const c = color || primaryColor;
    if (mode === "numbered") return `<span style="color:${c};font-weight:700">${idx + 1}.</span>`;
    if (mode === "bullet") return `<span style="color:${c}">•</span>`;
    if (mode === "none") return "";
    return `<span style="color:${c}">✓</span>`; // check
  };
  const stagesHtml = b.stages
    .map((stage, si) => {
      if (stage.isSection) {
        return `<h3 class="qp-section" style="color:${primaryColor};border-bottom:2px solid ${primaryColor};padding-bottom:4px;margin:18px 0 10px">${ed(ctx, `stages.${si}.name`, stage.name)}</h3>`;
      }
      const items = stage.items
        .map((it, idx) => {
          if (it.isSpacer) return `<li style="list-style:none;height:8px"></li>`;
          const f = it.fmt || {};
          const st = [
            f.fontFamily ? `font-family:${f.fontFamily}` : "",
            f.fontSize ? `font-size:${f.fontSize}px` : "",
            f.color ? `color:${f.color}` : "",
            f.bold ? "font-weight:700" : "",
            f.italic ? "font-style:italic" : "",
            f.underline ? "text-decoration:underline" : "",
            f.align ? `text-align:${f.align}` : "",
          ]
            .filter(Boolean)
            .join(";");
          const marker = it.icon !== undefined
            ? (it.icon === "" ? "" : `<span style="color:${it.iconColor || primaryColor}">${esc(it.icon)}</span>`)
            : itemMarker(stage.itemDisplayMode, idx, stage.itemDisplayColor);
          return `<li style="list-style:none;display:flex;gap:8px;align-items:flex-start;margin:4px 0;${st}">${marker}<span>${ed(ctx, `stages.${si}.items.${idx}.text`, it.text)}</span></li>`;
        })
        .join("");
      return `
      <div class="stage-card" style="margin:12px 0;padding:12px;border:1px solid #eee;border-radius:8px">
        <div style="font-weight:700;color:${stage.iconColor || primaryColor};margin-bottom:6px">${stage.icon ? esc(stage.icon) + " " : ""}${ed(ctx, `stages.${si}.name`, stage.name)}</div>
        <ul style="margin:0;padding:0">${items}</ul>
      </div>`;
    })
    .join("");
  return `${b.title ? `<h2 style="color:${primaryColor};margin:0 0 8px">${ed(ctx, "title", b.title)}</h2>` : ""}${stagesHtml}`;
}

// ---- PriceTable ----
function renderPriceTable(b: QPPriceTableBlock, ctx: RenderCtx): string {
  const { primaryColor } = ctx.theme;
  const cols = b.columns;
  const head = [
    `<th style="text-align:right">תיאור</th>`,
    cols.qty ? `<th>כמות</th>` : "",
    cols.unit ? `<th>יחידה</th>` : "",
    cols.unitPrice ? `<th>מחיר יח׳</th>` : "",
    cols.total ? `<th>סה״כ</th>` : "",
  ]
    .filter(Boolean)
    .join("");
  const rows = b.items
    .map(
      (it, i) => `
    <tr>
      <td style="text-align:right">${ed(ctx, `items.${i}.description`, it.description)}</td>
      ${cols.qty ? `<td>${esc(it.quantity)}</td>` : ""}
      ${cols.unit ? `<td>${esc(it.unit)}</td>` : ""}
      ${cols.unitPrice ? `<td>${money(it.unitPrice, ctx.currency)}</td>` : ""}
      ${cols.total ? `<td>${money(it.total, ctx.currency)}</td>` : ""}
    </tr>`,
    )
    .join("");
  const subtotal = b.items.reduce((s, it) => s + (it.total || 0), 0);
  const vat = b.showVat ? subtotal * (ctx.vatRate / 100) : 0;
  const grand = subtotal + vat;
  const colspan =
    1 + [cols.qty, cols.unit, cols.unitPrice].filter(Boolean).length;
  // plus-vat: מציג סכום + הערת מע"מ ; breakdown: ביניים/מע"מ/סה"כ
  const totals = cols.total
    ? ctx.vatDisplay === "plus-vat" && b.showVat
      ? `<tr style="font-weight:800;color:${primaryColor}"><td colspan="${colspan}" style="text-align:left">סה״כ</td><td>${money(subtotal, ctx.currency)}</td></tr>
         <tr><td colspan="${colspan + 1}" style="text-align:left;font-size:12px;color:#666">המחירים אינם כוללים מע״מ ${ctx.vatRate}%</td></tr>`
      : `<tr><td colspan="${colspan}" style="text-align:left;font-weight:600">סכום ביניים</td><td>${money(subtotal, ctx.currency)}</td></tr>
         ${b.showVat ? `<tr><td colspan="${colspan}" style="text-align:left">מע״מ ${ctx.vatRate}%</td><td>${money(vat, ctx.currency)}</td></tr>` : ""}
         <tr style="font-weight:800;color:${primaryColor}"><td colspan="${colspan}" style="text-align:left">סה״כ לתשלום</td><td>${money(grand, ctx.currency)}</td></tr>`
    : "";
  return `
  ${b.title ? `<h2 style="color:${primaryColor};margin:0 0 8px">${ed(ctx, "title", b.title)}</h2>` : ""}
  <table class="qp-table" style="width:100%;border-collapse:collapse;text-align:center">
    <thead style="background:${primaryColor};color:#fff"><tr>${head}</tr></thead>
    <tbody>${rows}</tbody>
    <tfoot>${totals}</tfoot>
  </table>`;
}

// ---- PaymentSchedule ----
function renderPayment(b: QPPaymentScheduleBlock, ctx: RenderCtx): string {
  const { primaryColor } = ctx.theme;
  const showAmounts = b.showAmounts && ctx.baseTotal > 0;
  const rows = b.steps
    .map((s, i) => {
      const linkBadge =
        s.stageId && s.stageName
          ? `<div style="font-size:11px;color:#666;margin-top:2px">🔗 ${esc(s.stageName)}${
              s.triggerMode === "stage_completion" ? " · עם השלמת השלב" : ""
            }</div>`
          : "";
      const amount = showAmounts
        ? `<td style="white-space:nowrap">${money((ctx.baseTotal * (s.percentage || 0)) / 100, ctx.currency)}</td>`
        : "";
      return `<tr>
        <td style="text-align:right">${ed(ctx, `steps.${i}.description`, s.description)}${linkBadge}</td>
        <td style="font-weight:700;color:${primaryColor}">${esc(s.percentage)}%</td>
        ${amount}
      </tr>`;
    })
    .join("");
  const sum = b.steps.reduce((a, s) => a + (s.percentage || 0), 0);
  const totalAmount = showAmounts
    ? `<td>${money((ctx.baseTotal * sum) / 100, ctx.currency)}</td>`
    : "";
  return `
  ${b.title ? `<h2 style="color:${primaryColor};margin:0 0 8px">${ed(ctx, "title", b.title)}</h2>` : ""}
  <table class="qp-table" style="width:100%;border-collapse:collapse">
    <tbody>${rows}</tbody>
    <tfoot><tr style="font-weight:700"><td style="text-align:right">סה״כ</td><td>${sum}%</td>${totalAmount}</tr></tfoot>
  </table>`;
}

// ---- Timeline ----
function renderTimeline(b: QPTimelineBlock, ctx: RenderCtx): string {
  const { primaryColor } = ctx.theme;
  const steps = b.steps
    .map(
      (s, i) => `
    <div style="display:flex;gap:10px;align-items:flex-start;margin:8px 0">
      <div style="width:26px;height:26px;border-radius:50%;background:${primaryColor};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex:0 0 auto">${i + 1}</div>
      <div><div style="font-weight:600">${ed(ctx, `steps.${i}.title`, s.title)}</div>${s.duration ? `<div style="font-size:12px;color:#666">${ed(ctx, `steps.${i}.duration`, s.duration)}</div>` : ""}</div>
    </div>`,
    )
    .join("");
  return `${b.title ? `<h2 style="color:${primaryColor};margin:0 0 8px">${ed(ctx, "title", b.title)}</h2>` : ""}${steps}`;
}

// ---- RichText / Html ----
function renderRich(b: QPRichTextBlock, ctx: RenderCtx): string {
  if (ctx.editable && ctx.blockId) {
    return `<div class="qp-rich qp-editable" data-qp-edit="${ctx.blockId}::@html" contenteditable="true">${b.html || ""}</div>`;
  }
  return `<div class="qp-rich">${b.html || ""}</div>`;
}
function renderHtml(b: QPHtmlBlock): string {
  return b.html || "";
}

// ---- ImportantNotes ----
function renderNotes(b: QPImportantNotesBlock, ctx: RenderCtx): string {
  const { accentColor } = ctx.theme;
  const items = b.notes.map((n, i) => `<li style="margin:4px 0">${ed(ctx, `notes.${i}`, n)}</li>`).join("");
  return `
  <div style="border-right:4px solid ${accentColor};background:${accentColor}14;padding:12px 14px;border-radius:6px">
    ${b.title ? `<div style="font-weight:700;color:${accentColor};margin-bottom:4px">${ed(ctx, "title", b.title)}</div>` : ""}
    <ul style="margin:0;padding-right:18px">${items}</ul>
  </div>`;
}

// ---- PricingTiers ----
function renderTiers(b: QPPricingTiersBlock, ctx: RenderCtx): string {
  const { primaryColor } = ctx.theme;
  const cards = b.tiers
    .map(
      (t, ti) => `
    <div style="flex:1;border:2px solid ${t.highlighted ? primaryColor : "#e5e5e5"};border-radius:10px;padding:14px;text-align:center">
      <div style="font-weight:700;font-size:16px">${ed(ctx, `tiers.${ti}.name`, t.name)}</div>
      <div style="font-size:22px;font-weight:800;color:${primaryColor};margin:8px 0">${money(t.price, ctx.currency)}</div>
      <ul style="list-style:none;padding:0;margin:0;font-size:13px;text-align:right">${t.features.map((f, fi) => `<li style="margin:3px 0">✓ ${ed(ctx, `tiers.${ti}.features.${fi}`, f)}</li>`).join("")}</ul>
    </div>`,
    )
    .join("");
  return `${b.title ? `<h2 style="color:${primaryColor};margin:0 0 8px">${ed(ctx, "title", b.title)}</h2>` : ""}<div style="display:flex;gap:12px">${cards}</div>`;
}

// ---- Upgrades ----
function renderUpgrades(b: QPUpgradesBlock, ctx: RenderCtx): string {
  const { primaryColor } = ctx.theme;
  const rows = b.items
    .map(
      (it, i) =>
        `<tr><td style="text-align:right">${it.selected ? "☑" : "☐"} ${ed(ctx, `items.${i}.name`, it.name)}</td><td style="font-weight:700;color:${primaryColor}">${money(it.price, ctx.currency)}</td></tr>`,
    )
    .join("");
  return `
  ${b.title ? `<h2 style="color:${primaryColor};margin:0 0 8px">${ed(ctx, "title", b.title)}</h2>` : ""}
  <table class="qp-table" style="width:100%;border-collapse:collapse"><tbody>${rows}</tbody></table>`;
}

// ---- Signature ----
function renderSignature(b: QPSignatureBlock): string {
  const cols = b.parties
    .map(
      (p) => `
    <div style="flex:1;text-align:center">
      <div style="font-weight:600;margin-bottom:34px">${esc(p.label)}</div>
      ${p.nameLine ? `<div style="border-top:1px solid #333;padding-top:4px">שם וחתימה</div>` : ""}
      ${p.dateLine ? `<div style="margin-top:10px;border-top:1px solid #333;padding-top:4px">תאריך</div>` : ""}
    </div>`,
    )
    .join("");
  return `<div class="signature-block" style="display:flex;gap:40px;margin-top:20px">${cols}</div>`;
}

// ---- Spacer / Image ----
function renderSpacer(b: QPSpacerBlock): string {
  return `<div style="height:${b.height}mm"></div>`;
}
function renderImage(b: QPImageBlock): string {
  if (!b.url) return "";
  const align = b.align || "center";
  const m = align === "center" ? "margin:0 auto" : align === "left" ? "margin-left:auto" : "";
  return `<div style="text-align:${align}"><img src="${esc(b.url)}" style="max-width:100%;${b.width ? `width:${b.width}px;` : ""}${m}" /></div>`;
}

// ----------------------------------------------------------------
// dispatcher
// ----------------------------------------------------------------
export function renderBlock(block: QPBlock, ctxIn: RenderCtx): string {
  const ctx: RenderCtx = { ...ctxIn, blockId: block.id };
  let inner = "";
  switch (block.type) {
    case "header": inner = renderHeader(block, ctx); break;
    case "stages": inner = renderStages(block, ctx); break;
    case "priceTable": inner = renderPriceTable(block, ctx); break;
    case "paymentSchedule": inner = renderPayment(block, ctx); break;
    case "timeline": inner = renderTimeline(block, ctx); break;
    case "richText": inner = renderRich(block, ctx); break;
    case "importantNotes": inner = renderNotes(block, ctx); break;
    case "pricingTiers": inner = renderTiers(block, ctx); break;
    case "upgrades": inner = renderUpgrades(block, ctx); break;
    case "signature": inner = renderSignature(block); break;
    case "spacer": inner = renderSpacer(block); break;
    case "image": inner = renderImage(block); break;
    case "html": inner = renderHtml(block); break;
    default: inner = "";
  }
  return wrap(block, inner);
}

// ----------------------------------------------------------------
// Placeholders — מחליף {{מפתח}} בערכים מפרטי הלקוח/פרויקט (meta)
// תומך גם במפתחות אנגלית וגם בתוויות עברית.
// ----------------------------------------------------------------
const MERGE_ALIASES: Record<string, keyof QPDocument["meta"]> = {
  clientName: "clientName", "שם לקוח": "clientName", "שם הלקוח": "clientName",
  clientPhone: "clientPhone", טלפון: "clientPhone",
  clientEmail: "clientEmail", אימייל: "clientEmail", מייל: "clientEmail",
  clientCompany: "clientCompany", חברה: "clientCompany",
  projectName: "projectName", פרויקט: "projectName", "שם הפרויקט": "projectName",
  projectAddress: "projectAddress", כתובת: "projectAddress",
  gush: "gush", גוש: "gush",
  helka: "helka", חלקה: "helka",
  migrash: "migrash", מגרש: "migrash",
  taba: "taba", "תבע": "taba", 'תב"ע': "taba",
  quoteNumber: "quoteNumber", "מספר הצעה": "quoteNumber",
  issueDate: "issueDate", תאריך: "issueDate",
};

export function applyMergeTokens(html: string, meta: QPDocument["meta"]): string {
  return html.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, raw) => {
    const key = MERGE_ALIASES[String(raw).trim()];
    const val = key ? meta[key] : undefined;
    return val != null && val !== "" ? esc(val) : "";
  });
}

/** סך כל ההצעה מכל בלוקי טבלת המחירים (כולל מע"מ אם מופעל) */
export function computeBaseTotal(doc: QPDocument): number {
  let total = 0;
  for (const b of doc.blocks) {
    if (b.type === "priceTable") {
      const subtotal = b.items.reduce((s, it) => s + (it.total || 0), 0);
      total += b.showVat ? subtotal * (1 + doc.pricing.vatRate / 100) : subtotal;
    }
  }
  return total;
}

function baseCtx(doc: QPDocument): RenderCtx {
  return {
    theme: doc.theme,
    currency: doc.pricing.currency,
    vatRate: doc.pricing.vatRate,
    vatDisplay: doc.pricing.vatDisplay || "breakdown",
    baseTotal: computeBaseTotal(doc),
  };
}

export function renderBlocks(doc: QPDocument): string {
  const html = doc.blocks.map((b) => renderBlock(b, baseCtx(doc))).join("\n");
  return applyMergeTokens(html, doc.meta);
}

/** רינדור למצב עריכה ישירה — עוטף שדות ב-contenteditable, בלי מיזוג טוקנים */
export function renderBlocksEditable(doc: QPDocument): string {
  const ctx: RenderCtx = { ...baseCtx(doc), editable: true };
  return doc.blocks.map((b) => renderBlock(b, ctx)).join("\n");
}

/**
 * מיישם עריכה ישירה על בלוק לפי נתיב data-qp-edit.
 * נתיב "@html" = הגדרת השדה html (innerHTML); אחרת dot-path לשדה טקסט.
 * מחזיר בלוק חדש (immutable).
 */
export function applyEditPath(block: QPBlock, path: string, value: string): QPBlock {
  const clone: any = JSON.parse(JSON.stringify(block));
  if (path === "@html") {
    clone.html = value;
    return clone;
  }
  const parts = path.split(".");
  let node: any = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const idx = /^\d+$/.test(key) ? Number(key) : key;
    if (node[idx] == null) return block; // נתיב לא תקין — אל תשנה
    node = node[idx];
  }
  const last = parts[parts.length - 1];
  const lastIdx = /^\d+$/.test(last) ? Number(last) : last;
  node[lastIdx] = value;
  return clone;
}
