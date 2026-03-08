import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { ContractData } from "@/hooks/useContractsData";

export const exportContractToPdf = async (contract: ContractData, filename: string) => {
  // Create a temporary container for the PDF content
  const container = document.createElement("div");
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 794px;
    background: white;
    padding: 40px;
    font-family: Arial, sans-serif;
    direction: rtl;
  `;

  // Build the HTML content
  container.innerHTML = `
    <div style="background: linear-gradient(to left, #B8860B, #DAA520); padding: 30px; border-radius: 12px; margin-bottom: 30px;">
      <h1 style="color: white; font-size: 28px; margin: 0 0 10px 0; text-align: right;">${contract.title}</h1>
      <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0 0 5px 0; text-align: right;">${contract.subtitle}</p>
      <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0 0 15px 0; text-align: right;">${contract.location}</p>
      <p style="color: white; font-size: 32px; font-weight: bold; margin: 0; text-align: right;">${contract.price} <span style="font-size: 16px; font-weight: normal; color: rgba(255,255,255,0.7);">+ מע״מ</span></p>
    </div>

    ${contract.sections.map(section => `
      <div style="margin-bottom: 25px;">
        <div style="background: #f5f5f5; padding: 12px 16px; border-radius: 8px; margin-bottom: 15px;">
          <h2 style="color: #333; font-size: 18px; margin: 0; text-align: right;">${section.title}</h2>
        </div>
        <div style="padding-right: 20px;">
          ${section.items.map(item => `
            <div style="display: flex; align-items: flex-start; margin-bottom: 10px; text-align: right;">
              <span style="color: #666; font-size: 14px; line-height: 1.6; flex: 1;">${item}</span>
              <span style="color: #DAA520; margin-left: 10px; font-size: 16px;">✓</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}

    <div style="margin-bottom: 25px;">
      <div style="background: #f5f5f5; padding: 12px 16px; border-radius: 8px; margin-bottom: 15px;">
        <h2 style="color: #333; font-size: 18px; margin: 0; text-align: right;">לוח תשלומים</h2>
      </div>
      <div style="display: flex; gap: 15px; padding-right: 20px; flex-wrap: wrap;">
        ${contract.payments.map(payment => `
          <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; text-align: center; flex: 1; min-width: 120px;">
            <div style="color: #B8860B; font-size: 28px; font-weight: bold; margin-bottom: 8px;">${payment.percentage}</div>
            <div style="color: #666; font-size: 12px;">${payment.description}</div>
          </div>
        `).join('')}
      </div>
    </div>

    ${contract.timeline && contract.timeline.length > 0 ? `
      <div style="margin-bottom: 25px;">
        <div style="background: #f5f5f5; padding: 12px 16px; border-radius: 8px; margin-bottom: 15px;">
          <h2 style="color: #333; font-size: 18px; margin: 0; text-align: right;">לוח זמנים</h2>
        </div>
        <div style="padding-right: 20px;">
          ${contract.timeline.map((item, index) => `
            <div style="display: flex; align-items: center; margin-bottom: 12px; text-align: right;">
              <span style="color: #666; font-size: 14px; flex: 1;">${item}</span>
              <span style="background: rgba(218,165,32,0.2); color: #B8860B; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-left: 12px;">${index + 1}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <div style="margin-bottom: 25px;">
      <div style="background: #f5f5f5; padding: 12px 16px; border-radius: 8px; margin-bottom: 15px;">
        <h2 style="color: #333; font-size: 18px; margin: 0; text-align: right;">הערות חשובות</h2>
      </div>
      <div style="padding-right: 20px;">
        ${contract.notes.map(note => `
          <div style="background: rgba(0,0,0,0.03); border-radius: 8px; padding: 12px 16px; margin-bottom: 10px; text-align: right;">
            <span style="color: #666; font-size: 13px; line-height: 1.6;">${note}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; margin-top: 30px;">
      <p style="color: #999; font-size: 12px; margin: 0 0 5px 0;">תוקף הצעת המחיר: 30 יום</p>
      <p style="color: #999; font-size: 12px; margin: 0;">נוצר בתאריך: ${new Date().toLocaleDateString("he-IL")}</p>
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
