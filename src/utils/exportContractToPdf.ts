import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { DigitalContractData } from "@/hooks/useDigitalContracts";
import { DEFAULT_DESIGN } from "@/types/contract-design";

export const exportContractToPdf = async (contract: DigitalContractData, filename: string) => {
  const design = contract.design || DEFAULT_DESIGN;
  
  // Create a temporary container for the PDF content
  const container = document.createElement("div");
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 794px;
    background: ${design.backgroundColor};
    padding: ${design.contentPadding};
    font-family: ${design.fontFamily};
    direction: rtl;
    color: ${design.textColor};
  `;

  // Build the HTML content
  container.innerHTML = `
    <div style="background: ${design.headerBgColor}; padding: ${design.headerPadding}; border-radius: ${design.borderRadius}; margin-bottom: ${design.spacing};">
      ${design.logo ? `
        <div style="text-align: ${design.logo.position.includes('left') ? 'left' : design.logo.position.includes('right') ? 'right' : 'center'}; margin-bottom: 20px;">
          <img src="${design.logo.url}" style="width: ${design.logo.width}px; height: ${design.logo.height}px;" />
        </div>
      ` : ''}
      <h1 style="color: ${design.headerTextColor}; font-size: ${design.fontSize.title}; font-family: ${design.headerFontFamily}; margin: 0 0 10px 0; text-align: right;">${contract.title}</h1>
      <p style="color: ${design.headerTextColor}; opacity: 0.8; font-size: ${design.fontSize.subtitle}; margin: 0 0 5px 0; text-align: right;">${contract.subtitle}</p>
      <p style="color: ${design.headerTextColor}; opacity: 0.7; font-size: ${design.fontSize.small}; margin: 0 0 15px 0; text-align: right;">${contract.location}</p>
      <p style="color: ${design.headerTextColor}; font-size: 32px; font-weight: bold; margin: 0; text-align: right;">${contract.price} <span style="font-size: 16px; font-weight: normal; opacity: 0.7;">+ מע״מ</span></p>
    </div>

    ${contract.sections.map(section => `
      <div style="margin-bottom: ${design.spacing};">
        <div style="background: ${design.sectionStyle.backgroundColor}; padding: 12px 16px; border-radius: ${design.borderRadius}; margin-bottom: 15px; border: ${design.borderWidth} ${design.borderStyle} ${design.sectionStyle.borderColor};">
          <h2 style="color: ${design.sectionStyle.titleColor}; font-size: 18px; margin: 0; text-align: right;">${section.title}</h2>
        </div>
        <div style="padding-right: 20px;">
          ${section.items.map(item => `
            <div style="display: flex; align-items: flex-start; margin-bottom: 10px; text-align: right;">
              <span style="color: ${design.textColor}; font-size: ${design.fontSize.body}; line-height: 1.6; flex: 1;">${item}</span>
              <span style="color: ${design.sectionStyle.iconColor}; margin-left: 10px; font-size: 16px;">✓</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}

    <div style="margin-bottom: ${design.spacing};">
      <div style="background: ${design.sectionStyle.backgroundColor}; padding: 12px 16px; border-radius: ${design.borderRadius}; margin-bottom: 15px;">
        <h2 style="color: ${design.sectionStyle.titleColor}; font-size: 18px; margin: 0; text-align: right;">לוח תשלומים</h2>
      </div>
      <div style="display: flex; gap: 15px; padding-right: 20px; flex-wrap: wrap;">
        ${contract.payments.map(payment => `
          <div style="background: ${design.paymentStyle.backgroundColor}; border-radius: ${design.borderRadius}; padding: 20px; text-align: center; flex: 1; min-width: 120px;">
            <div style="color: ${design.paymentStyle.percentageColor}; font-size: 28px; font-weight: bold; margin-bottom: 8px;">${payment.percentage}</div>
            <div style="color: ${design.paymentStyle.textColor}; font-size: ${design.fontSize.small};">${payment.description}</div>
          </div>
        `).join('')}
      </div>
    </div>

    ${contract.timeline && contract.timeline.length > 0 ? `
      <div style="margin-bottom: ${design.spacing};">
        <div style="background: ${design.sectionStyle.backgroundColor}; padding: 12px 16px; border-radius: ${design.borderRadius}; margin-bottom: 15px;">
          <h2 style="color: ${design.sectionStyle.titleColor}; font-size: 18px; margin: 0; text-align: right;">לוח זמנים</h2>
        </div>
        <div style="padding-right: 20px;">
          ${contract.timeline.map((item, index) => `
            <div style="display: flex; align-items: center; margin-bottom: 12px; text-align: right;">
              <span style="color: ${design.textColor}; font-size: ${design.fontSize.body}; flex: 1;">${item}</span>
              <span style="background: ${design.primaryColor}20; color: ${design.primaryColor}; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: ${design.fontSize.small}; font-weight: bold; margin-left: 12px;">${index + 1}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <div style="margin-bottom: ${design.spacing};">
      <div style="background: ${design.sectionStyle.backgroundColor}; padding: 12px 16px; border-radius: ${design.borderRadius}; margin-bottom: 15px;">
        <h2 style="color: ${design.sectionStyle.titleColor}; font-size: 18px; margin: 0; text-align: right;">הערות חשובות</h2>
      </div>
      <div style="padding-right: 20px;">
        ${contract.notes.map(note => `
          <div style="background: ${design.notesStyle.backgroundColor}; border-radius: ${design.borderRadius}; padding: 12px 16px; margin-bottom: 10px; text-align: right; border: ${design.borderWidth} ${design.borderStyle} ${design.notesStyle.borderColor};">
            <span style="color: ${design.notesStyle.textColor}; font-size: ${design.fontSize.body}; line-height: 1.6;">${note}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div style="text-align: center; padding-top: 20px; border-top: 1px solid ${design.borderColor}; margin-top: 30px;">
      <p style="color: ${design.textColor}; opacity: 0.6; font-size: ${design.fontSize.small}; margin: 0 0 5px 0;">תוקף הצעת המחיר: 30 יום</p>
      <p style="color: ${design.textColor}; opacity: 0.6; font-size: ${design.fontSize.small}; margin: 0;">נוצר בתאריך: ${new Date().toLocaleDateString("he-IL")}</p>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Capture the container as canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // Calculate dimensions for A4
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    let heightLeft = imgHeight;
    let position = 0;

    // Add image to PDF (handle multiple pages if needed)
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${filename}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
};
