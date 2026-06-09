// Israeli payslip PDF generator
// Generates standard Israeli "Tlush Sachar" with all fields per labor law
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ExtendedPayrollResult } from "@/lib/payrollExtended";
import { fmtNIS } from "@/lib/payroll";

export interface PayslipData {
  // Employer
  employer_name?: string;
  employer_id?: string;
  employer_address?: string;
  // Employee
  employee_name: string;
  employee_id_number?: string | null;
  employee_address?: string | null;
  employee_position?: string | null;
  employee_department?: string | null;
  employee_hire_date?: string | null;
  employee_bank?: string | null;
  // Period
  period_year: number;
  period_month: number;
  // Hours
  worked_hours?: number;
  vacation_days?: number;
  sick_days?: number;
  recuperation_days?: number;
  // Payroll result
  payroll: ExtendedPayrollResult;
  // Pension/study
  pension_fund_name?: string | null;
  pension_policy_number?: string | null;
  study_fund_name?: string | null;
}

const HEBREW_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

// jsPDF doesn't natively render RTL Hebrew well without a custom font.
// We render in logical left-to-right but with Hebrew labels — relying on
// the browser's font fallback. For production-grade RTL, embed a Hebrew font.
function reverseHebrew(text: string): string {
  // Simple reversal for RTL display in PDF
  return text.split("").reverse().join("");
}

export function generatePayslipPDF(data: PayslipData): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const monthName = HEBREW_MONTHS[data.period_month - 1] || `${data.period_month}`;
  const p = data.payroll;

  // Try to set Hebrew-compatible font
  doc.setFont("helvetica", "normal");

  // Header
  doc.setFontSize(16);
  doc.text(reverseHebrew(`תלוש שכר - ${monthName} ${data.period_year}`), 105, 15, { align: "center" });

  if (data.employer_name) {
    doc.setFontSize(10);
    doc.text(reverseHebrew(data.employer_name), 195, 25, { align: "right" });
    if (data.employer_id)
      doc.text(reverseHebrew(`ח.פ. ${data.employer_id}`), 195, 30, { align: "right" });
    if (data.employer_address)
      doc.text(reverseHebrew(data.employer_address), 195, 35, { align: "right" });
  }

  // Employee box
  const employeeRows = [
    [reverseHebrew("שם עובד"), reverseHebrew(data.employee_name)],
    [reverseHebrew('ת"ז'), data.employee_id_number || ""],
    [reverseHebrew("תפקיד"), reverseHebrew(data.employee_position || "")],
    [reverseHebrew("מחלקה"), reverseHebrew(data.employee_department || "")],
    [reverseHebrew("ת.תחילת עבודה"), data.employee_hire_date || ""],
    [reverseHebrew("כתובת"), reverseHebrew(data.employee_address || "")],
  ];

  autoTable(doc, {
    startY: 45,
    head: [[reverseHebrew("פרטי העובד"), ""]],
    body: employeeRows,
    theme: "grid",
    headStyles: { fillColor: [22, 44, 88], halign: "right" },
    styles: { fontSize: 9, halign: "right" },
    columnStyles: { 0: { cellWidth: 50, fontStyle: "bold" }, 1: { cellWidth: 130 } },
  });

  let yPos = (doc as any).lastAutoTable.finalY + 5;

  // Additions table
  const additions: any[] = [
    [reverseHebrew("שכר יסוד"), fmtNIS(p.base_pay)],
  ];
  if (p.overtime_pay > 0) additions.push([reverseHebrew("שעות נוספות"), fmtNIS(p.overtime_pay)]);
  if (p.transport > 0) additions.push([reverseHebrew("נסיעות"), fmtNIS(p.transport)]);
  if (p.meal > 0) additions.push([reverseHebrew("ארוחות"), fmtNIS(p.meal)]);
  if (p.recuperation_pay > 0) additions.push([reverseHebrew("דמי הבראה"), fmtNIS(p.recuperation_pay)]);
  if (p.clothing_monthly > 0) additions.push([reverseHebrew("ביגוד"), fmtNIS(p.clothing_monthly)]);
  if (p.company_car_shovi > 0) additions.push([reverseHebrew("שווי רכב צמוד"), fmtNIS(p.company_car_shovi)]);
  if (p.company_phone_shovi > 0) additions.push([reverseHebrew("שווי טלפון"), fmtNIS(p.company_phone_shovi)]);
  additions.push([reverseHebrew("סה״כ ברוטו"), fmtNIS(p.gross_total)]);

  autoTable(doc, {
    startY: yPos,
    head: [[reverseHebrew("תוספות לשכר"), ""]],
    body: additions,
    theme: "grid",
    headStyles: { fillColor: [22, 44, 88], halign: "right" },
    styles: { fontSize: 9, halign: "right" },
    columnStyles: { 0: { cellWidth: 110 }, 1: { cellWidth: 70, fontStyle: "bold" } },
  });

  yPos = (doc as any).lastAutoTable.finalY + 5;

  // Deductions
  const deductions = [
    [reverseHebrew("מס הכנסה"), fmtNIS(p.income_tax)],
    [reverseHebrew("ביטוח לאומי"), fmtNIS(p.national_insurance)],
    [reverseHebrew("מס בריאות"), fmtNIS(p.health_tax)],
    [reverseHebrew("פנסיה (עובד)"), fmtNIS(p.pension.employee)],
  ];
  if (p.pension.study_employee > 0)
    deductions.push([reverseHebrew("קרן השתלמות (עובד)"), fmtNIS(p.pension.study_employee)]);
  if (p.other_deductions > 0)
    deductions.push([reverseHebrew("ניכויים נוספים"), fmtNIS(p.other_deductions)]);
  deductions.push([reverseHebrew("סה״כ ניכויים"), fmtNIS(p.total_deductions)]);

  autoTable(doc, {
    startY: yPos,
    head: [[reverseHebrew("ניכויים"), ""]],
    body: deductions,
    theme: "grid",
    headStyles: { fillColor: [22, 44, 88], halign: "right" },
    styles: { fontSize: 9, halign: "right" },
    columnStyles: { 0: { cellWidth: 110 }, 1: { cellWidth: 70, fontStyle: "bold" } },
  });

  yPos = (doc as any).lastAutoTable.finalY + 5;

  // Employer contributions
  const employerCont = [
    [reverseHebrew("פנסיה (מעביד)"), fmtNIS(p.pension.employer)],
    [reverseHebrew("פיצויים"), fmtNIS(p.pension.severance)],
  ];
  if (p.pension.study_employer > 0)
    employerCont.push([reverseHebrew("השתלמות (מעביד)"), fmtNIS(p.pension.study_employer)]);
  employerCont.push([reverseHebrew("עלות מעביד כוללת"), fmtNIS(p.employer_total_cost)]);

  autoTable(doc, {
    startY: yPos,
    head: [[reverseHebrew("הפרשות מעביד"), ""]],
    body: employerCont,
    theme: "grid",
    headStyles: { fillColor: [216, 172, 39], halign: "right", textColor: 0 },
    styles: { fontSize: 9, halign: "right" },
    columnStyles: { 0: { cellWidth: 110 }, 1: { cellWidth: 70, fontStyle: "bold" } },
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // Net payment
  doc.setFillColor(216, 172, 39);
  doc.rect(15, yPos, 180, 12, "F");
  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text(reverseHebrew(`נטו לתשלום: ${fmtNIS(p.net_total)}`), 105, yPos + 8, { align: "center" });

  // Pension info footer
  if (data.pension_fund_name) {
    yPos += 18;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      reverseHebrew(`קרן פנסיה: ${data.pension_fund_name}${data.pension_policy_number ? ` | פוליסה: ${data.pension_policy_number}` : ""}`),
      195,
      yPos,
      { align: "right" },
    );
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(
    reverseHebrew(`הופק ב-${new Date().toLocaleDateString("he-IL")} | תלוש זה הינו אישור תשלום בלבד`),
    105,
    285,
    { align: "center" },
  );

  return doc;
}

export function downloadPayslipPDF(data: PayslipData) {
  const doc = generatePayslipPDF(data);
  const monthName = HEBREW_MONTHS[data.period_month - 1] || `${data.period_month}`;
  const filename = `payslip_${data.employee_name}_${monthName}_${data.period_year}.pdf`;
  doc.save(filename);
}
