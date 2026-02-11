import React from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  QuoteDocumentData,
  SectionTextStyle,
  SectionKey,
  DEFAULT_SECTION_STYLE,
} from "./types";
import { TextFormatPopover, SECTION_LABELS } from "./TextFormatPopover";

interface DocumentPreviewProps {
  document: QuoteDocumentData;
  scale?: number;
  onFieldClick?: (field: string) => void;
  editable?: boolean;
  onUpdateSectionStyle?: (
    sectionKey: SectionKey,
    style: SectionTextStyle,
  ) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: he });
  } catch {
    return dateStr;
  }
};

const replaceVariables = (text: string, doc: QuoteDocumentData) => {
  return text
    .replace(/\{\{clientName\}\}/g, doc.clientName || "")
    .replace(/\{\{companyName\}\}/g, doc.companyName || "")
    .replace(/\{\{date\}\}/g, formatDate(doc.date))
    .replace(/\{\{quoteNumber\}\}/g, doc.quoteNumber)
    .replace(/\{\{total\}\}/g, formatCurrency(doc.total));
};

export function DocumentPreview({
  document: doc,
  scale = 1,
  onFieldClick,
  editable,
  onUpdateSectionStyle,
}: DocumentPreviewProps) {
  // Helper to get section style with fallback to defaults
  const getSectionStyle = (sectionKey: SectionKey): SectionTextStyle => {
    return doc.sectionStyles?.[sectionKey] || DEFAULT_SECTION_STYLE;
  };

  // Helper to generate CSS styles from section style
  const getSectionCSS = (sectionKey: SectionKey): React.CSSProperties => {
    const style = getSectionStyle(sectionKey);
    return {
      fontFamily: style.fontFamily,
      fontSize: `${style.fontSize}px`,
      color: style.fontColor,
      textAlign: style.textAlign,
      fontWeight: style.fontWeight,
    };
  };

  // Section wrapper with format button
  const SectionWrapper = ({
    sectionKey,
    children,
    className,
    showFormatButton = true,
  }: {
    sectionKey: SectionKey;
    children: React.ReactNode;
    className?: string;
    showFormatButton?: boolean;
  }) => (
    <div className={cn("relative group", className)}>
      {editable && showFormatButton && onUpdateSectionStyle && (
        <div className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <TextFormatPopover
            sectionKey={sectionKey}
            sectionLabel={SECTION_LABELS[sectionKey]}
            style={getSectionStyle(sectionKey)}
            onChange={onUpdateSectionStyle}
          />
        </div>
      )}
      <div style={getSectionCSS(sectionKey)}>{children}</div>
    </div>
  );

  const EditableField = ({
    field,
    children,
    className,
  }: {
    field: string;
    children: React.ReactNode;
    className?: string;
  }) => {
    if (!editable) return <span className={className}>{children}</span>;
    return (
      <span
        className={cn(
          className,
          "cursor-pointer hover:bg-yellow-100/50 hover:outline hover:outline-2 hover:outline-yellow-400 rounded px-0.5 transition-all",
        )}
        onClick={() => onFieldClick?.(field)}
      >
        {children}
      </span>
    );
  };

  return (
    <div
      className="bg-white shadow-xl mx-auto"
      style={{
        width: 210 * 3.78, // A4 width in pixels at 96dpi
        minHeight: 297 * 3.78, // A4 height
        transform: `scale(${scale})`,
        transformOrigin: "top center",
        fontFamily: doc.fontFamily || "Heebo",
        direction: "rtl",
      }}
    >
      {/* Header */}
      <div
        className="p-8 pb-4 relative group"
        style={{ backgroundColor: doc.primaryColor, color: "white" }}
      >
        {editable && onUpdateSectionStyle && (
          <div className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <TextFormatPopover
              sectionKey="header"
              sectionLabel={SECTION_LABELS.header}
              style={getSectionStyle("header")}
              onChange={onUpdateSectionStyle}
            />
          </div>
        )}
        <div className="flex justify-between items-start">
          {/* Company Info */}
          <SectionWrapper sectionKey="companyInfo" showFormatButton={false}>
            <div className="space-y-1">
              {doc.showLogo && doc.companyLogo && (
                <img src={doc.companyLogo} alt="Logo" className="h-12 mb-2" />
              )}
              <EditableField
                field="companyName"
                className="text-2xl font-bold block"
              >
                {doc.companyName || "שם החברה"}
              </EditableField>
              {doc.showCompanyDetails && (
                <div className="text-sm opacity-90 space-y-0.5">
                  {doc.companyAddress && (
                    <EditableField field="companyAddress" className="block">
                      {doc.companyAddress}
                    </EditableField>
                  )}
                  <div className="flex gap-4">
                    {doc.companyPhone && (
                      <EditableField field="companyPhone">
                        {doc.companyPhone}
                      </EditableField>
                    )}
                    {doc.companyEmail && (
                      <EditableField field="companyEmail">
                        {doc.companyEmail}
                      </EditableField>
                    )}
                  </div>
                </div>
              )}
            </div>
          </SectionWrapper>

          {/* Quote Info */}
          <SectionWrapper sectionKey="quoteInfo" showFormatButton={false}>
            <div className="text-left space-y-1">
              <EditableField field="title" className="text-xl font-bold block">
                {doc.title}
              </EditableField>
              <div className="text-sm opacity-90">
                <div>
                  מספר:{" "}
                  <EditableField field="quoteNumber">
                    {doc.quoteNumber}
                  </EditableField>
                </div>
                <div>
                  תאריך:{" "}
                  <EditableField field="date">
                    {formatDate(doc.date)}
                  </EditableField>
                </div>
                <div>
                  בתוקף עד:{" "}
                  <EditableField field="validUntil">
                    {formatDate(doc.validUntil)}
                  </EditableField>
                </div>
              </div>
            </div>
          </SectionWrapper>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 space-y-6">
        {/* Client Info */}
        {doc.showClientDetails && (
          <SectionWrapper sectionKey="clientInfo" className="border-b pb-4">
            <h3
              className="font-semibold mb-2"
              style={{ color: doc.primaryColor }}
            >
              לכבוד:
            </h3>
            <div className="space-y-0.5">
              <EditableField field="clientName" className="font-medium block">
                {doc.clientName || "שם הלקוח"}
              </EditableField>
              {doc.clientCompany && (
                <EditableField
                  field="clientCompany"
                  className="block text-gray-600"
                >
                  {doc.clientCompany}
                </EditableField>
              )}
              {doc.clientAddress && (
                <EditableField
                  field="clientAddress"
                  className="block text-gray-600"
                >
                  {doc.clientAddress}
                </EditableField>
              )}
              <div className="flex gap-4 text-gray-600 text-sm">
                {doc.clientPhone && (
                  <EditableField field="clientPhone">
                    {doc.clientPhone}
                  </EditableField>
                )}
                {doc.clientEmail && (
                  <EditableField field="clientEmail">
                    {doc.clientEmail}
                  </EditableField>
                )}
              </div>
            </div>
          </SectionWrapper>
        )}

        {/* Introduction */}
        {doc.introduction && (
          <SectionWrapper
            sectionKey="introduction"
            className="whitespace-pre-line text-gray-700"
          >
            {replaceVariables(doc.introduction, doc)}
          </SectionWrapper>
        )}

        {/* Items Table */}
        <SectionWrapper sectionKey="itemsTable">
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm" style={getSectionCSS('itemsTable')}>
              <thead
                style={{ backgroundColor: doc.primaryColor, color: "white" }}
              >
                <tr>
                  {doc.showItemNumbers && (
                    <th className="p-3 text-right w-12">#</th>
                  )}
                  <th className="p-3 text-right">תיאור</th>
                  <th className="p-3 text-center w-20">כמות</th>
                  <th className="p-3 text-center w-20">יחידה</th>
                  <th className="p-3 text-left w-28">מחיר יח'</th>
                  <th className="p-3 text-left w-28">סה"כ</th>
                </tr>
              </thead>
              <tbody>
                {doc.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={doc.showItemNumbers ? 6 : 5}
                      className="p-8 text-center text-gray-400"
                    >
                      אין פריטים. הוסף פריטים מהסרגל או לחץ על "הוסף פריט"
                    </td>
                  </tr>
                ) : (
                  doc.items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={cn(
                        "border-b",
                        idx % 2 === 0 ? "bg-gray-50" : "bg-white",
                      )}
                    >
                      {doc.showItemNumbers && (
                        <td className="p-3 text-center font-medium">
                          {item.number}
                        </td>
                      )}
                      <td className="p-3">
                        <div className="font-medium">
                          {item.description || "תיאור פריט"}
                        </div>
                        {item.details && (
                          <div className="text-xs text-gray-500 mt-1">
                            {item.details}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-center">{item.unit}</td>
                      <td className="p-3 text-left">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="p-3 text-left font-medium">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionWrapper>

        {/* Totals */}
        <SectionWrapper sectionKey="totals">
          <div className="flex justify-end">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>סכום ביניים:</span>
                <span>{formatCurrency(doc.subtotal)}</span>
              </div>
              {doc.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    הנחה (
                    {doc.discountType === "percent"
                      ? `${doc.discount}%`
                      : formatCurrency(doc.discount)}
                    ):
                  </span>
                  <span>
                    -
                    {formatCurrency(
                      doc.discountType === "percent"
                        ? doc.subtotal * (doc.discount / 100)
                        : doc.discount,
                    )}
                  </span>
                </div>
              )}
              {doc.showVat && (
                <div className="flex justify-between text-gray-600">
                  <span>מע"מ ({doc.vatRate}%):</span>
                  <span>{formatCurrency(doc.vatAmount)}</span>
                </div>
              )}
              <div
                className="flex justify-between text-lg font-bold pt-2 border-t-2"
                style={{ borderColor: doc.secondaryColor }}
              >
                <span>סה"כ לתשלום:</span>
                <span style={{ color: doc.primaryColor }}>
                  {formatCurrency(doc.total)}
                </span>
              </div>
            </div>
          </div>
        </SectionWrapper>

        {/* Terms */}
        {doc.showPaymentTerms && doc.terms && (
          <SectionWrapper sectionKey="terms" className="border-t pt-4">
            <h3
              className="font-semibold mb-2"
              style={{ color: doc.primaryColor }}
            >
              תנאים:
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {replaceVariables(doc.terms, doc)}
            </p>
          </SectionWrapper>
        )}

        {/* Notes */}
        {doc.notes && (
          <SectionWrapper sectionKey="notes" className="bg-gray-50 p-4 rounded-lg">
            <h3
              className="font-semibold mb-2"
              style={{ color: doc.primaryColor }}
            >
              הערות:
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {replaceVariables(doc.notes, doc)}
            </p>
          </SectionWrapper>
        )}

        {/* Signature */}
        {doc.showSignature && doc.footer && (
          <SectionWrapper sectionKey="signature" className="pt-8">
            <div className="whitespace-pre-line text-gray-700">
              {replaceVariables(doc.footer, doc)}
            </div>
            <div className="mt-8 flex justify-between">
              <div className="text-center">
                <div className="border-t border-gray-300 w-40 pt-2">
                  חתימת הלקוח
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-gray-300 w-40 pt-2">
                  חתימת החברה
                </div>
              </div>
            </div>
          </SectionWrapper>
        )}
      </div>
    </div>
  );
}
