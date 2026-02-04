// PDF Export Utility - tenarch CRM Pro
// יצירת PDF מדוחות והצעות מחיר

import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  logo?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  rtl?: boolean;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface PDFSection {
  type: 'title' | 'subtitle' | 'text' | 'table' | 'space' | 'divider' | 'totals';
  content?: string;
  data?: TableData;
  totals?: { label: string; value: string }[];
}

// Generate HTML for PDF
function generatePDFHTML(sections: PDFSection[], options: PDFExportOptions): string {
  const { title, subtitle, companyName, companyAddress, companyPhone, companyEmail, rtl = true } = options;
  
  const currentDate = format(new Date(), 'dd/MM/yyyy', { locale: he });
  
  const sectionHTML = sections.map(section => {
    switch (section.type) {
      case 'title':
        return `<h1 style="font-size: 24px; color: #1e3a5f; margin: 20px 0 10px; border-bottom: 2px solid #d4a845;">${section.content}</h1>`;
      case 'subtitle':
        return `<h2 style="font-size: 18px; color: #666; margin: 10px 0;">${section.content}</h2>`;
      case 'text':
        return `<p style="margin: 10px 0; line-height: 1.6;">${section.content}</p>`;
      case 'space':
        return '<div style="height: 20px;"></div>';
      case 'divider':
        return '<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />';
      case 'table':
        if (!section.data) return '';
        return `
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
              <tr style="background: #1e3a5f; color: white;">
                ${section.data.headers.map(h => `<th style="padding: 10px; text-align: ${rtl ? 'right' : 'left'}; border: 1px solid #ddd;">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${section.data.rows.map((row, i) => `
                <tr style="background: ${i % 2 === 0 ? '#f9f9f9' : 'white'};">
                  ${row.map(cell => `<td style="padding: 8px; border: 1px solid #ddd;">${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      case 'totals':
        if (!section.totals) return '';
        return `
          <div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px;">
            ${section.totals.map(t => `
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd;">
                <span style="font-weight: ${t.label.includes('סה"כ') ? 'bold' : 'normal'};">${t.label}</span>
                <span style="font-weight: ${t.label.includes('סה"כ') ? 'bold' : 'normal'}; color: #1e3a5f;">${t.value}</span>
              </div>
            `).join('')}
          </div>
        `;
      default:
        return '';
    }
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="he" dir="${rtl ? 'rtl' : 'ltr'}">
    <head>
      <meta charset="UTF-8">
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        body {
          font-family: 'Arial', 'Segoe UI', sans-serif;
          direction: ${rtl ? 'rtl' : 'ltr'};
          color: #333;
          line-height: 1.5;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 20px;
          border-bottom: 3px solid #d4a845;
          margin-bottom: 30px;
        }
        .company-info {
          text-align: ${rtl ? 'right' : 'left'};
        }
        .company-name {
          font-size: 28px;
          font-weight: bold;
          color: #1e3a5f;
          margin: 0;
        }
        .company-details {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        .document-info {
          text-align: ${rtl ? 'left' : 'right'};
        }
        .document-title {
          font-size: 20px;
          color: #1e3a5f;
          margin: 0;
        }
        .document-date {
          font-size: 12px;
          color: #666;
        }
        .footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 10px;
          color: #999;
          padding: 10px;
          border-top: 1px solid #ddd;
        }
        .content {
          padding-bottom: 60px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          ${companyName ? `<h1 class="company-name">${companyName}</h1>` : ''}
          <div class="company-details">
            ${companyAddress ? `<div>${companyAddress}</div>` : ''}
            ${companyPhone ? `<div>טלפון: ${companyPhone}</div>` : ''}
            ${companyEmail ? `<div>אימייל: ${companyEmail}</div>` : ''}
          </div>
        </div>
        <div class="document-info">
          <h2 class="document-title">${title}</h2>
          ${subtitle ? `<div style="color: #666;">${subtitle}</div>` : ''}
          <div class="document-date">תאריך: ${currentDate}</div>
        </div>
      </div>
      
      <div class="content">
        ${sectionHTML}
      </div>
      
      <div class="footer">
        מסמך זה הופק אוטומטית על ידי tenarch CRM Pro | ${currentDate}
      </div>
    </body>
    </html>
  `;
}

// Export to PDF using print dialog
export function exportToPDF(sections: PDFSection[], options: PDFExportOptions): void {
  const html = generatePDFHTML(sections, options);
  
  // Open new window and trigger print
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('נא לאפשר חלונות קופצים כדי להוריד PDF');
    return;
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for styles to load then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}

// Generate quote PDF
export function exportQuoteToPDF(quote: {
  quote_number: string;
  client_name: string;
  items: Array<{ description: string; quantity: number; unit_price: number; total: number }>;
  subtotal: number;
  vat: number;
  total: number;
  notes?: string;
  valid_until?: string;
}, companyInfo: Partial<PDFExportOptions>): void {
  const sections: PDFSection[] = [
    { type: 'title', content: `הצעת מחיר מס' ${quote.quote_number}` },
    { type: 'subtitle', content: `עבור: ${quote.client_name}` },
    { type: 'space' },
    {
      type: 'table',
      data: {
        headers: ['תיאור', 'כמות', 'מחיר יחידה', 'סה"כ'],
        rows: quote.items.map(item => [
          item.description,
          item.quantity.toString(),
          `₪${item.unit_price.toLocaleString()}`,
          `₪${item.total.toLocaleString()}`
        ])
      }
    },
    {
      type: 'totals',
      totals: [
        { label: 'סכום ביניים', value: `₪${quote.subtotal.toLocaleString()}` },
        { label: 'מע"מ (17%)', value: `₪${quote.vat.toLocaleString()}` },
        { label: 'סה"כ לתשלום', value: `₪${quote.total.toLocaleString()}` },
      ]
    },
    { type: 'divider' },
  ];

  if (quote.notes) {
    sections.push({ type: 'text', content: `הערות: ${quote.notes}` });
  }

  if (quote.valid_until) {
    sections.push({ type: 'text', content: `הצעה תקפה עד: ${quote.valid_until}` });
  }

  sections.push({ type: 'space' });
  sections.push({ type: 'text', content: 'חתימת הלקוח: _______________________' });
  sections.push({ type: 'text', content: 'תאריך: _______________________' });

  exportToPDF(sections, {
    title: `הצעת מחיר ${quote.quote_number}`,
    subtitle: quote.client_name,
    ...companyInfo,
  });
}

// Generate report PDF
export function exportReportToPDF(report: {
  title: string;
  period: string;
  data: TableData;
  summary?: { label: string; value: string }[];
}, companyInfo: Partial<PDFExportOptions>): void {
  const sections: PDFSection[] = [
    { type: 'title', content: report.title },
    { type: 'subtitle', content: `תקופה: ${report.period}` },
    { type: 'space' },
    { type: 'table', data: report.data },
  ];

  if (report.summary) {
    sections.push({ type: 'divider' });
    sections.push({ type: 'totals', totals: report.summary });
  }

  exportToPDF(sections, {
    title: report.title,
    subtitle: report.period,
    ...companyInfo,
  });
}

// Generate invoice PDF
export function exportInvoiceToPDF(invoice: {
  invoice_number: string;
  client_name: string;
  client_address?: string;
  items: Array<{ description: string; quantity: number; unit_price: number; total: number }>;
  subtotal: number;
  vat: number;
  total: number;
  due_date?: string;
  payment_terms?: string;
}, companyInfo: Partial<PDFExportOptions>): void {
  const sections: PDFSection[] = [
    { type: 'title', content: `חשבונית מס' ${invoice.invoice_number}` },
    { type: 'subtitle', content: `לכבוד: ${invoice.client_name}` },
    invoice.client_address ? { type: 'text', content: invoice.client_address } : { type: 'space' },
    { type: 'space' },
    {
      type: 'table',
      data: {
        headers: ['תיאור', 'כמות', 'מחיר יחידה', 'סה"כ'],
        rows: invoice.items.map(item => [
          item.description,
          item.quantity.toString(),
          `₪${item.unit_price.toLocaleString()}`,
          `₪${item.total.toLocaleString()}`
        ])
      }
    },
    {
      type: 'totals',
      totals: [
        { label: 'סכום ביניים', value: `₪${invoice.subtotal.toLocaleString()}` },
        { label: 'מע"מ (17%)', value: `₪${invoice.vat.toLocaleString()}` },
        { label: 'סה"כ לתשלום', value: `₪${invoice.total.toLocaleString()}` },
      ]
    },
    { type: 'divider' },
  ];

  if (invoice.due_date) {
    sections.push({ type: 'text', content: `תאריך לתשלום: ${invoice.due_date}` });
  }

  if (invoice.payment_terms) {
    sections.push({ type: 'text', content: `תנאי תשלום: ${invoice.payment_terms}` });
  }

  exportToPDF(sections, {
    title: `חשבונית ${invoice.invoice_number}`,
    subtitle: invoice.client_name,
    ...companyInfo,
  });
}

// Generate time report PDF
export function exportTimeReportToPDF(report: {
  employee_name?: string;
  period: string;
  entries: Array<{
    date: string;
    project: string;
    description: string;
    hours: string;
  }>;
  total_hours: string;
  billable_hours?: string;
  total_revenue?: number;
}, companyInfo: Partial<PDFExportOptions>): void {
  const sections: PDFSection[] = [
    { type: 'title', content: 'דוח שעות עבודה' },
    { type: 'subtitle', content: report.employee_name ? `עובד: ${report.employee_name}` : '' },
    { type: 'text', content: `תקופה: ${report.period}` },
    { type: 'space' },
    {
      type: 'table',
      data: {
        headers: ['תאריך', 'פרויקט', 'תיאור', 'שעות'],
        rows: report.entries.map(e => [e.date, e.project, e.description, e.hours])
      }
    },
    { type: 'divider' },
    {
      type: 'totals',
      totals: [
        { label: 'סה"כ שעות', value: report.total_hours },
        ...(report.billable_hours ? [{ label: 'שעות לחיוב', value: report.billable_hours }] : []),
        ...(report.total_revenue ? [{ label: 'סה"כ הכנסה', value: `₪${report.total_revenue.toLocaleString()}` }] : []),
      ]
    },
  ];

  exportToPDF(sections, {
    title: 'דוח שעות עבודה',
    subtitle: report.period,
    ...companyInfo,
  });
}
