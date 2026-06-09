/**
 * Extended Israeli payroll calculations (2026).
 *
 * Builds on top of `src/lib/payroll.ts` with:
 * - Automatic tax credit points calculation (gender, marital status, children, aliyah, single parent, disability)
 * - Recuperation (Havraa) entitlement and payment calculation
 * - Transport allowance by distance (km)
 * - Company car/phone tax value (Shovi)
 * - Full extended payroll wrapper
 */

import {
  calcPayrollWithLaw,
  DEFAULT_PAYROLL_LAW_PROFILE,
  type PayrollLawProfile,
  type PayrollInputs,
  type PayrollResult,
  yearsOfService,
} from "./payroll";

// ============================================================================
// Tax Credit Points - Auto Calculation
// ============================================================================

export interface TaxCreditInputs {
  gender?: "male" | "female" | "other" | null;
  marital_status?: "single" | "married" | "divorced" | "widowed" | "separated" | null;
  children_data?: Array<{
    birth_date?: string | null;
    has_custody?: boolean;
  }> | null;
  aliyah_date?: string | null;
  disability_pct?: number | null;
  academic_degree?: string | null;
  degree_completion_year?: number | null;
  is_resident?: boolean;
}

export interface TaxCreditBreakdown {
  total: number;
  items: Array<{ label: string; points: number }>;
}

/**
 * Calculate tax credit points automatically per Israeli law 2026.
 * Returns a breakdown so the user sees WHY.
 */
export function calcTaxCreditPoints(
  inputs: TaxCreditInputs,
  refYear: number = new Date().getFullYear(),
): TaxCreditBreakdown {
  const items: Array<{ label: string; points: number }> = [];

  // Basic resident point (every Israeli resident)
  if (inputs.is_resident !== false) {
    items.push({ label: "נקודת זיכוי בסיס (תושב)", points: 2.25 });
  }

  // Woman gets +0.5
  if (inputs.gender === "female") {
    items.push({ label: "נקודת זיכוי לאישה", points: 0.5 });
  }

  // Children points
  const children = inputs.children_data || [];
  if (children.length > 0) {
    let childrenPoints = 0;
    const isMother = inputs.gender === "female";
    const isSingleParent =
      inputs.marital_status === "divorced" ||
      inputs.marital_status === "widowed" ||
      inputs.marital_status === "separated";

    children.forEach((child) => {
      if (!child.birth_date) return;
      const age = calcAge(child.birth_date, new Date(refYear, 5, 30));
      // Per current law (simplified):
      // Mother (or single parent father with custody):
      //   year of birth: 1.5
      //   age 1-5: 2.5
      //   age 6-12: 1
      //   age 13-17: 0.5
      // Father (not single parent): only year of birth + age 1-5 gets 1 point
      const isPrimary = isMother || (isSingleParent && child.has_custody !== false);

      if (age < 0) return;
      if (age === 0) childrenPoints += isPrimary ? 1.5 : 1.0;
      else if (age <= 5) childrenPoints += isPrimary ? 2.5 : 1.0;
      else if (age <= 12) childrenPoints += isPrimary ? 1.0 : 0;
      else if (age <= 17) childrenPoints += isPrimary ? 0.5 : 0;
    });

    if (childrenPoints > 0) {
      items.push({
        label: `נקודות זיכוי עבור ${children.length} ילד/ים`,
        points: Number(childrenPoints.toFixed(2)),
      });
    }
  }

  // Single parent bonus
  if (
    (inputs.marital_status === "divorced" ||
      inputs.marital_status === "widowed" ||
      inputs.marital_status === "separated") &&
    (inputs.children_data?.length ?? 0) > 0
  ) {
    items.push({ label: "הורה יחיד", points: 1 });
  }

  // New immigrant (Oleh Chadash) - reduced over 4.5 years
  if (inputs.aliyah_date) {
    const monthsSinceAliyah = monthsBetween(inputs.aliyah_date, new Date());
    if (monthsSinceAliyah >= 0 && monthsSinceAliyah < 18) {
      items.push({ label: "עולה חדש - 18 חודשים ראשונים", points: 3 });
    } else if (monthsSinceAliyah < 30) {
      items.push({ label: "עולה חדש - 12 חודשים הבאים", points: 2 });
    } else if (monthsSinceAliyah < 42) {
      items.push({ label: "עולה חדש - 12 חודשים נוספים", points: 1 });
    }
  }

  // Disability >= 90%
  if ((inputs.disability_pct ?? 0) >= 90) {
    items.push({ label: "נכות 90%+", points: 2 });
  }

  // Academic degree bonus (Year after completion: BSc=+1 for 3 years; MSc=+0.5; PhD=+1)
  if (inputs.degree_completion_year) {
    const yearsSince = refYear - inputs.degree_completion_year;
    const degree = (inputs.academic_degree || "").toLowerCase();
    if (yearsSince >= 0 && yearsSince <= 2) {
      if (degree.includes("ראשון") || degree.includes("bsc") || degree.includes("ba")) {
        items.push({ label: "תואר ראשון (3 שנים)", points: 1 });
      } else if (degree.includes("שני") || degree.includes("msc") || degree.includes("ma")) {
        items.push({ label: "תואר שני (2 שנים)", points: 0.5 });
      } else if (degree.includes("דוקטור") || degree.includes("phd")) {
        items.push({ label: "דוקטורט", points: 1 });
      }
    }
  }

  const total = items.reduce((s, i) => s + i.points, 0);
  return { total: Number(total.toFixed(2)), items };
}

function calcAge(birthDate: string, refDate: Date = new Date()): number {
  const bd = new Date(birthDate);
  if (Number.isNaN(bd.getTime())) return -1;
  let age = refDate.getFullYear() - bd.getFullYear();
  const m = refDate.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && refDate.getDate() < bd.getDate())) age--;
  return age;
}

function monthsBetween(fromDate: string, toDate: Date = new Date()): number {
  const fd = new Date(fromDate);
  if (Number.isNaN(fd.getTime())) return -1;
  return (
    (toDate.getFullYear() - fd.getFullYear()) * 12 +
    (toDate.getMonth() - fd.getMonth())
  );
}

// ============================================================================
// Recuperation (Havraa)
// ============================================================================

/** Annual recuperation days entitlement per Israeli law (private sector). */
export function recuperationDaysEntitlement(yearsServed: number): number {
  if (yearsServed < 1) return 0;
  if (yearsServed === 1) return 5;
  if (yearsServed <= 3) return 6;
  if (yearsServed <= 10) return 7;
  if (yearsServed <= 15) return 8;
  if (yearsServed <= 19) return 9;
  return 10;
}

/** Recuperation pay = entitlement × daily rate × position ratio. */
export function calcRecuperationPay(
  hireDate: string | null | undefined,
  dailyRate: number,
  positionRatioPct: number = 100,
  daysAlreadyPaid: number = 0,
  refDate: Date = new Date(),
): { entitledDays: number; remainingDays: number; amount: number } {
  if (!hireDate) return { entitledDays: 0, remainingDays: 0, amount: 0 };
  const years = yearsOfService(hireDate, refDate);
  const entitled = recuperationDaysEntitlement(years);
  const remaining = Math.max(0, entitled - daysAlreadyPaid);
  const amount = remaining * dailyRate * (positionRatioPct / 100);
  return { entitledDays: entitled, remainingDays: remaining, amount };
}

// ============================================================================
// Transport allowance by distance
// ============================================================================

/** 2026 max daily transport reimbursement (NIS). */
export const MAX_DAILY_TRANSPORT_2026 = 22.6;
export const WORK_DAYS_PER_MONTH = 22;

/**
 * Calculate monthly transport allowance based on commute distance.
 * Uses the legal "cheapest public transport" rule with a daily cap.
 */
export function calcTransportByDistance(
  distanceKm: number,
  workDaysPerMonth: number = WORK_DAYS_PER_MONTH,
  maxDaily: number = MAX_DAILY_TRANSPORT_2026,
): number {
  if (!distanceKm || distanceKm <= 0) return 0;
  // Rough proxy: 1.2 NIS per km, capped daily. (Real law: actual public transport cost)
  const estDaily = Math.min(distanceKm * 2 * 1.2, maxDaily);
  return Math.round(estDaily * workDaysPerMonth * 100) / 100;
}

// ============================================================================
// Company car / phone "Shovi" (taxable benefit value)
// ============================================================================

/** Returns the monthly taxable value (Shovi) - added to gross for tax purposes only. */
export function calcCompanyCarShovi(carValue: number): number {
  // Israeli law: monthly shovi calculated based on car group, here we use the provided value directly.
  return carValue || 0;
}

export function calcCompanyPhoneShovi(phoneValue: number): number {
  // Standard minimum shovi for company phone is ~105 NIS/month (2026 estimate)
  return Math.max(phoneValue || 0, phoneValue ? 105 : 0);
}

// ============================================================================
// Extended Payroll Calculation
// ============================================================================

export interface ExtendedPayrollInputs extends PayrollInputs {
  // Auto-computed
  companyCarShovi?: number;
  companyPhoneShovi?: number;
  recuperationPay?: number;
  clothingMonthly?: number;
}

export interface ExtendedPayrollResult extends PayrollResult {
  company_car_shovi: number;
  company_phone_shovi: number;
  recuperation_pay: number;
  clothing_monthly: number;
  taxable_gross: number; // gross + shovi
}

/**
 * Extended payroll wrapper. Adds shovi (taxable benefits), recuperation, and clothing.
 * Shovi is added to taxable income but NOT to net pay (it's a benefit, not cash).
 */
export function calcExtendedPayroll(
  inputs: ExtendedPayrollInputs,
  law: PayrollLawProfile = DEFAULT_PAYROLL_LAW_PROFILE,
): ExtendedPayrollResult {
  const carShovi = inputs.companyCarShovi || 0;
  const phoneShovi = inputs.companyPhoneShovi || 0;
  const recuperation = inputs.recuperationPay || 0;
  const clothing = inputs.clothingMonthly || 0;

  // Add shovi + recuperation + clothing as "other additions" - they affect tax
  const enriched: PayrollInputs = {
    ...inputs,
    otherAdditions:
      (inputs.otherAdditions || 0) + carShovi + phoneShovi + recuperation + clothing,
  };

  const base = calcPayrollWithLaw(enriched, law);

  return {
    ...base,
    company_car_shovi: carShovi,
    company_phone_shovi: phoneShovi,
    recuperation_pay: recuperation,
    clothing_monthly: clothing,
    taxable_gross: base.gross_total,
  };
}

// ============================================================================
// Profile completeness check - for AI assist
// ============================================================================

export interface CompletenessCheck {
  field: string;
  label: string;
  importance: "required" | "important" | "optional";
  reason: string;
}

export function checkEmployeeCompleteness(
  employee: Record<string, any>,
): CompletenessCheck[] {
  const missing: CompletenessCheck[] = [];

  const requiredForPayslip: Array<[string, string, string]> = [
    ["name", "שם מלא", "חובה לכל תלוש"],
    ["id_number", 'ת"ז', "חובה חוקית לתלוש שכר"],
    ["hire_date", "תאריך תחילת עבודה", "נדרש לחישוב ותק והבראה"],
    ["birth_date", "תאריך לידה", "נדרש לחישוב נקודות זיכוי"],
    ["gender", "מגדר", "משפיע על נק' זיכוי (אישה +0.5)"],
    ["bank_account_number", "מס' חשבון בנק", "נדרש להעברה"],
  ];

  const important: Array<[string, string, string]> = [
    ["marital_status", "מצב משפחתי", "משפיע על נק' זיכוי הורה יחיד"],
    ["address_city", "עיר מגורים", "חובה בתלוש שכר ישראלי"],
    ["address_street", "כתובת", "חובה בתלוש שכר"],
    ["work_distance_km", "מרחק לעבודה", "חישוב אוטומטי של דמי נסיעה"],
    ["pension_fund_name", "שם קרן פנסיה", "חובה בדוח לרשויות"],
    ["pension_policy_number", "מס' פוליסת פנסיה", "חובה בדוח לרשויות"],
  ];

  const optional: Array<[string, string, string]> = [
    ["children_data", "פרטי ילדים", "נק' זיכוי לפי גיל ילד"],
    ["aliyah_date", "תאריך עלייה", "נק' זיכוי לעולה חדש"],
    ["disability_pct", "אחוז נכות", "נק' זיכוי 90%+"],
    ["academic_degree", "תואר אקדמי", "נק' זיכוי 3 שנים אחרי סיום"],
    ["country_of_origin", "ארץ מוצא", "מידע סטטיסטי"],
  ];

  for (const [field, label, reason] of requiredForPayslip) {
    if (!employee[field]) missing.push({ field, label, importance: "required", reason });
  }
  for (const [field, label, reason] of important) {
    if (!employee[field]) missing.push({ field, label, importance: "important", reason });
  }
  for (const [field, label, reason] of optional) {
    const val = employee[field];
    const isEmpty = !val || (Array.isArray(val) && val.length === 0);
    if (isEmpty) missing.push({ field, label, importance: "optional", reason });
  }

  return missing;
}
