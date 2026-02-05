// מודול ייצוא PDF לחוזים
// תמיכה בעברית, RTL, לוגו וחתימות
// html2pdf is dynamically imported to reduce bundle size

import { format } from 'date-fns';

// Dynamic import helper for html2pdf (very large library ~200KB)
const getHtml2Pdf = async () => {
  const module = await import('html2pdf.js');
  return module.default;
};

export interface PdfOptions {
  filename?: string;
  margin?: number;
  pageSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  showPageNumbers?: boolean;
}

const DEFAULT_OPTIONS: PdfOptions = {
  filename: 'document.pdf',
  margin: 15,
  pageSize: 'a4',
  orientation: 'portrait',
  showPageNumbers: true,
};

// יצירת PDF מ-HTML
export async function generatePdfFromHtml(
  htmlContent: string,
  options: PdfOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Dynamically import html2pdf only when needed
  const html2pdf = await getHtml2Pdf();
  
  // עטיפת התוכן עם סגנונות RTL
  const wrappedHtml = `
    <div style="
      font-family: 'David', 'Arial', sans-serif;
      direction: rtl;
      text-align: right;
      padding: ${opts.margin}mm;
      line-height: 1.6;
    ">
      ${htmlContent}
    </div>
  `;

  const element = document.createElement('div');
  element.innerHTML = wrappedHtml;
  document.body.appendChild(element);

  try {
    const pdf = await html2pdf()
      .set({
        margin: opts.margin,
        filename: opts.filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
        },
        jsPDF: { 
          unit: 'mm', 
          format: opts.pageSize, 
          orientation: opts.orientation 
        },
      })
      .from(element)
      .outputPdf('blob');

    return pdf;
  } finally {
    document.body.removeChild(element);
  }
}

// הורדת PDF
export async function downloadPdf(
  htmlContent: string,
  filename: string,
  options: PdfOptions = {}
): Promise<void> {
  const blob = await generatePdfFromHtml(htmlContent, { ...options, filename });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// פתיחת PDF בחלון חדש
export async function openPdfInNewTab(
  htmlContent: string,
  options: PdfOptions = {}
): Promise<void> {
  const blob = await generatePdfFromHtml(htmlContent, options);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

// יצירת HTML לחוזה עם הכל מוכן להדפסה
export function generateContractPrintHtml(
  contractHtml: string,
  companyLogo?: string,
  pageHeader?: string,
  pageFooter?: string
): string {
  const today = format(new Date(), 'dd/MM/yyyy');
  
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        
        body {
          font-family: 'David', 'Arial', sans-serif;
          font-size: 12pt;
          line-height: 1.6;
          direction: rtl;
          text-align: right;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #333;
        }
        
        .logo img {
          max-height: 80px;
          max-width: 200px;
        }
        
        .date {
          font-size: 11pt;
          color: #666;
        }
        
        .footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 10pt;
          color: #666;
          padding: 10px;
          border-top: 1px solid #ddd;
        }
        
        .content {
          margin-bottom: 40px;
        }
        
        .signature-section {
          page-break-inside: avoid;
          margin-top: 40px;
        }
        
        .signature-box {
          display: inline-block;
          width: 45%;
          margin: 10px 2%;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 8px 12px;
          text-align: right;
        }
        
        th {
          background: #f5f5f5;
        }
        
        @media print {
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">
          ${companyLogo ? `<img src="${companyLogo}" alt="לוגו" />` : ''}
          ${pageHeader || ''}
        </div>
        <div class="date">תאריך: ${today}</div>
      </div>
      
      <div class="content">
        ${contractHtml}
      </div>
      
      ${pageFooter ? `<div class="footer">${pageFooter}</div>` : ''}
    </body>
    </html>
  `;
}

// ייצוא כ-Word (HTML שנפתח ב-Word)
export function downloadAsWord(
  htmlContent: string,
  filename: string
): void {
  const fullHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: David, Arial; 
          direction: rtl; 
          text-align: right;
        }
      </style>
    </head>
    <body>${htmlContent}</body>
    </html>
  `;
  
  const blob = new Blob([fullHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
