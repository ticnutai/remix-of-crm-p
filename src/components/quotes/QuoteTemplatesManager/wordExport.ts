import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  PageNumber,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

type WordExportInput = {
  title: string;
  description?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  primaryColor?: string;
  logoDataUrl?: string;
  pageSize?: { format?: string; orientation?: string; widthMm?: number; heightMm?: number };
  projectDetails: Record<string, string | undefined>;
  stages: Array<{ name?: string; icon?: string; isSection?: boolean; items?: Array<{ text?: string; isSpacer?: boolean }> }>;
  paymentSteps: Array<{ name?: string; percentage?: number }>;
  textBoxes: Array<{ position?: string; title?: string; content?: string }>;
  basePrice: number;
  vatRate: number;
};

const mmToTwip = (mm: number) => Math.round(mm * 56.6929134);
const cleanColor = (value?: string) => (value || "B8860B").replace("#", "").slice(0, 6);
const rtlParagraph = (children: Array<TextRun | ImageRun> | string, options: { bold?: boolean; size?: number; heading?: typeof HeadingLevel[keyof typeof HeadingLevel]; spacingAfter?: number; pageBreakBefore?: boolean; color?: string; keepNext?: boolean; center?: boolean } = {}) =>
  new Paragraph({
    bidirectional: true,
    alignment: options.center ? AlignmentType.CENTER : AlignmentType.RIGHT,
    heading: options.heading,
    pageBreakBefore: options.pageBreakBefore,
    keepNext: options.keepNext,
    spacing: { after: options.spacingAfter ?? 100 },
    children: typeof children === "string"
      ? [new TextRun({ text: children, bold: options.bold, size: options.size ?? 22, color: options.color, rightToLeft: true })]
      : children,
  });

const dataUrlToImage = (dataUrl?: string): ImageRun | null => {
  if (!dataUrl?.startsWith("data:image/")) return null;
  const match = dataUrl.match(/^data:image\/(png|jpe?g|gif|bmp);base64,(.+)$/i);
  if (!match) return null;
  const type = match[1].toLowerCase() === "jpg" ? "jpeg" : match[1].toLowerCase();
  const binary = atob(match[2]);
  const data = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) data[i] = binary.charCodeAt(i);
  return new ImageRun({ data, type: type as "png" | "jpg" | "jpeg" | "gif" | "bmp", transformation: { width: 520, height: 105 } });
};

const cell = (text: string, width: number, bold = false, shade?: string, textColor?: string) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  shading: shade ? { type: ShadingType.CLEAR, fill: shade } : undefined,
  margins: { top: 90, bottom: 90, left: 100, right: 100 },
  children: [rtlParagraph(text, { bold, size: 20, spacingAfter: 0, color: textColor })],
});

const splitLines = (value?: string) => (value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

export async function createQuoteDocx(input: WordExportInput): Promise<Blob> {
  const primary = cleanColor(input.primaryColor);
  const isLandscape = input.pageSize?.orientation === "landscape";
  const widthMm = input.pageSize?.widthMm || (isLandscape ? 297 : 210);
  const heightMm = input.pageSize?.heightMm || (isLandscape ? 210 : 297);
  const pageShortMm = Math.min(widthMm, heightMm);
  const pageLongMm = Math.max(widthMm, heightMm);
  const pageWidthTwip = mmToTwip(isLandscape ? pageLongMm : pageShortMm);
  const pageHeightTwip = mmToTwip(isLandscape ? pageShortMm : pageLongMm);
  const horizontalMargins = mmToTwip(30);
  const contentWidth = pageWidthTwip - horizontalMargins;
  const border = { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" };
  const allBorders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };
  const children: Array<Paragraph | Table> = [];
  const logo = dataUrlToImage(input.logoDataUrl);

  if (logo) children.push(rtlParagraph([logo], { spacingAfter: 160, center: true }));
  children.push(rtlParagraph(input.title || "הצעת מחיר", { bold: true, size: 36, heading: HeadingLevel.TITLE, spacingAfter: 100, color: primary, keepNext: true }));
  if (input.description) children.push(rtlParagraph(input.description, { size: 22, spacingAfter: 220 }));

  const detailLabels: Array<[string, string]> = [
    ["clientName", "לקוח"], ["address", "כתובת"], ["gush", "גוש"],
    ["helka", "חלקה"], ["migrash", "מגרש"], ["projectType", "סוג פרויקט"],
  ];
  const detailRows = detailLabels.filter(([key]) => input.projectDetails[key]).map(([key, label]) =>
    new TableRow({ cantSplit: true, children: [cell(label, Math.round(contentWidth * 0.28), true, "F3F4F6", primary), cell(String(input.projectDetails[key] || ""), contentWidth - Math.round(contentWidth * 0.28))] }),
  );
  if (detailRows.length) {
    children.push(rtlParagraph("פרטי הפרויקט", { bold: true, size: 28, heading: HeadingLevel.HEADING_1, color: primary, keepNext: true }));
    const labelWidth = Math.round(contentWidth * 0.28);
    children.push(new Table({ width: { size: contentWidth, type: WidthType.DXA }, columnWidths: [labelWidth, contentWidth - labelWidth], visuallyRightToLeft: true, borders: allBorders, rows: detailRows }));
    children.push(rtlParagraph("", { spacingAfter: 160 }));
  }

  const addTextBoxes = (position: string) => input.textBoxes.filter((box) => box.position === position).forEach((box) => {
    if (box.title) children.push(rtlParagraph(box.title, { bold: true, size: 24 }));
    splitLines(box.content).forEach((line) => children.push(rtlParagraph(line, { size: 21 })));
  });
  addTextBoxes("header");
  addTextBoxes("before-stages");

  if (input.stages.length) children.push(rtlParagraph("שלבי העבודה", { bold: true, size: 30, heading: HeadingLevel.HEADING_1, pageBreakBefore: false, color: primary, keepNext: true }));
  input.stages.forEach((stage) => {
    const name = `${stage.icon ? `${stage.icon} ` : ""}${stage.name || ""}`.trim();
    children.push(rtlParagraph(name, { bold: true, size: stage.isSection ? 28 : 25, heading: stage.isSection ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3, spacingAfter: 80, color: primary, keepNext: true }));
    if (!stage.isSection) (stage.items || []).filter((item) => !item.isSpacer && item.text).forEach((item) =>
      children.push(new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, numbering: { reference: "rtl-bullets", level: 0 }, keepLines: true, spacing: { after: 55 }, children: [new TextRun({ text: item.text || "", rightToLeft: true, size: 21 })] })),
    );
  });
  addTextBoxes("after-stages");

  if (input.paymentSteps.length) {
    children.push(rtlParagraph("סדר תשלומים", { bold: true, size: 30, heading: HeadingLevel.HEADING_1, pageBreakBefore: false, color: primary, keepNext: true }));
    const paymentWidths = [Math.round(contentWidth * 0.40), Math.round(contentWidth * 0.14), Math.round(contentWidth * 0.23)];
    paymentWidths.push(contentWidth - paymentWidths.reduce((sum, width) => sum + width, 0));
    const rows = [
      new TableRow({ tableHeader: true, cantSplit: true, children: [cell("שלב", paymentWidths[0], true, primary, "FFFFFF"), cell("אחוז", paymentWidths[1], true, primary, "FFFFFF"), cell("סכום לפני מע״מ", paymentWidths[2], true, primary, "FFFFFF"), cell("סכום כולל מע״מ", paymentWidths[3], true, primary, "FFFFFF")] }),
      ...input.paymentSteps.map((step) => {
        const net = Math.round(input.basePrice * Number(step.percentage || 0) / 100);
        const gross = Math.round(net * (1 + input.vatRate / 100));
        return new TableRow({ cantSplit: true, children: [cell(step.name || "", paymentWidths[0]), cell(`${step.percentage || 0}%`, paymentWidths[1]), cell(`₪${net.toLocaleString("he-IL")}`, paymentWidths[2]), cell(`₪${gross.toLocaleString("he-IL")}`, paymentWidths[3])] });
      }),
    ];
    children.push(new Table({ width: { size: contentWidth, type: WidthType.DXA }, columnWidths: paymentWidths, visuallyRightToLeft: true, borders: allBorders, rows }));
  }
  addTextBoxes("before-payments");
  addTextBoxes("after-payments");
  addTextBoxes("footer");

  const footerText = [input.companyName, input.companyAddress, input.companyPhone, input.companyEmail].filter(Boolean).join(" | ");
  const doc = new Document({
    creator: input.companyName || "CRM Pro",
    title: input.title,
    numbering: { config: [{ reference: "rtl-bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.RIGHT, style: { paragraph: { indent: { right: 420, hanging: 220 } } } }] }] },
    styles: {
      default: { document: { run: { font: "Arial", size: 22, rightToLeft: true }, paragraph: { bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { line: 300 } } } },
      paragraphStyles: [
        { id: "Title", name: "Title", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial", size: 36, bold: true, color: primary, rightToLeft: true }, paragraph: { bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 180 }, outlineLevel: 0 } },
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial", size: 30, bold: true, color: primary, rightToLeft: true }, paragraph: { bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { before: 220, after: 120 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial", size: 27, bold: true, color: primary, rightToLeft: true }, paragraph: { bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { before: 180, after: 100 }, outlineLevel: 1 } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial", size: 24, bold: true, color: primary, rightToLeft: true }, paragraph: { bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { before: 140, after: 80 }, outlineLevel: 2 } },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: mmToTwip(pageShortMm), height: mmToTwip(pageLongMm), orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT },
          margin: { top: mmToTwip(15), right: mmToTwip(15), bottom: mmToTwip(17), left: mmToTwip(15), header: mmToTwip(7), footer: mmToTwip(7) },
        },
        bidi: true,
      },
      headers: { default: new Header({ children: [new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: primary, space: 4 } }, children: [new TextRun({ text: input.companyName || "", bold: true, size: 18, color: primary, rightToLeft: true })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, tabStops: [{ type: "right" as never, position: 9000 }], children: [new TextRun({ text: `${footerText}   |   עמוד `, size: 16, color: "666666", rightToLeft: true }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "666666" })] })] }) },
      children,
    }],
  });
  return Packer.toBlob(doc);
}
