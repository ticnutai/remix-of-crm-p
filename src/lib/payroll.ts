/**
 * Israeli payroll & pension calculation utilities (2026 brackets, approximate).
 *
 * IMPORTANT: These calculations are APPROXIMATE and intended for planning,
 * estimation and reporting only. They are NOT a substitute for a licensed
 * payroll system or a certified accountant. Tax brackets, credit point value,
 * Bituach Leumi & health-tax rates change yearly.
 *
 * All amounts are in NIS (₪) per month unless noted.
 */

// ---------- Constants (2026 approximation) ----------

/** Approximate value of a single tax credit point per month (NIS). */
export const TAX_CREDIT_POINT_VALUE = 248;

/** Income-tax brackets (monthly, NIS). */
export const INCOME_TAX_BRACKETS: Array<{ upTo: number; rate: number }> = [
  { upTo:   7010, rate: 0.10 },
  { upTo:  10060, rate: 0.14 },
  { upTo:  16150, rate: 0.20 },
  { upTo:  22440, rate: 0.31 },
  { upTo:  46690, rate: 0.35 },
  { upTo:  60130, rate: 0.47 },
  { upTo: Infinity, rate: 0.50 },
];

/** Bituach Leumi (NI) — reduced rate up to threshold, full above. */
export const NI_REDUCED_RATE = 0.004;   // up to threshold
export const NI_FULL_RATE    = 0.07;
/** Health insurance (Mas Briut). */
export const HEALTH_REDUCED_RATE = 0.031;
export const HEALTH_FULL_RATE    = 0.05;
export const NI_HEALTH_THRESHOLD = 7522;
export const NI_HEALTH_CEILING   = 49030;

/** Standard hours per month (full time) — used for hourly→monthly conversion. */
export const STANDARD_MONTHLY_HOURS = 182;

/** Daily wage divisor for monthly employees. */
export const WORK_DAYS_PER_MONTH = 22;

// ---------- Annual leave entitlement (Israeli law, 5-day week) ----------

/** Returns annual vacation entitlement in working days, given years of service. */
export function annualLeaveEntitlement(years: number): number {
  if (!years || years < 1) return 12;
  if (years <= 4)  return 12;
  if (years === 5) return 14;
  if (years === 6) return 16;
  if (years === 7) return 18;
  if (years === 8) return 19;
  if (years === 9) return 20;
  if (years === 10) return 21;
  if (years === 11) return 22;
  if (years === 12) return 23;
  if (years === 13) return 24;
  return 28;
}

/** Years of service from hire date until a reference date (default: today). */
export function yearsOfService(hireDate: Date | string | null, ref: Date = new Date()): number {
  if (!hireDate) return 0;
  const hd = typeof hireDate === "string" ? new Date(hireDate) : hireDate;
  if (Number.isNaN(hd.getTime())) return 0;
  let years = ref.getFullYear() - hd.getFullYear();
  const m = ref.getMonth() - hd.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < hd.getDate())) years--;
  return Math.max(0, years);
}

// ---------- Tax calculations ----------

/** Compute progressive monthly income tax on a gross amount. */
export function calcIncomeTaxRaw(monthlyGross: number): number {
  let tax = 0;
  let prev = 0;
  for (const b of INCOME_TAX_BRACKETS) {
    if (monthlyGross <= prev) break;
    const slice = Math.min(monthlyGross, b.upTo) - prev;
    tax += slice * b.rate;
    prev = b.upTo;
    if (monthlyGross <= b.upTo) break;
  }
  return Math.max(0, tax);
}

/** Apply tax credit points (each point reduces tax by the point value). */
export function applyCreditPoints(rawTax: number, creditPoints: number): number {
  const reduction = (creditPoints || 0) * TAX_CREDIT_POINT_VALUE;
  return Math.max(0, rawTax - reduction);
}

/** Bituach Leumi + health combined (employee portion). */
export function calcNationalInsuranceAndHealth(monthlyGross: number): {
  national_insurance: number;
  health_tax: number;
} {
  const reducedBase = Math.min(monthlyGross, NI_HEALTH_THRESHOLD);
  const fullBase    = Math.max(0, Math.min(monthlyGross, NI_HEALTH_CEILING) - NI_HEALTH_THRESHOLD);
  return {
    national_insurance: reducedBase * NI_REDUCED_RATE + fullBase * NI_FULL_RATE,
    health_tax:         reducedBase * HEALTH_REDUCED_RATE + fullBase * HEALTH_FULL_RATE,
  };
}

// ---------- Pension ----------

export interface PensionInputs {
  pensionableBase: number;          // base wage subject to pension (usually base salary, no allowances)
  employeePct: number;              // e.g. 6.0
  employerPct: number;              // e.g. 6.5
  severancePct: number;             // e.g. 6.0 (or 8.33)
  studyEmployeePct?: number;        // קרן השתלמות עובד (e.g. 2.5)
  studyEmployerPct?: number;        // קרן השתלמות מעביד (e.g. 7.5)
}

export interface PensionResult {
  employee: number;
  employer: number;
  severance: number;
  study_employee: number;
  study_employer: number;
  total_employee_deduction: number;
  total_employer_cost: number;
}

export function calcPension(inputs: PensionInputs): PensionResult {
  const { pensionableBase } = inputs;
  const employee = pensionableBase * (inputs.employeePct / 100);
  const employer = pensionableBase * (inputs.employerPct / 100);
  const severance = pensionableBase * (inputs.severancePct / 100);
  const study_employee = pensionableBase * ((inputs.studyEmployeePct || 0) / 100);
  const study_employer = pensionableBase * ((inputs.studyEmployerPct || 0) / 100);
  return {
    employee,
    employer,
    severance,
    study_employee,
    study_employer,
    total_employee_deduction: employee + study_employee,
    total_employer_cost: employer + severance + study_employer,
  };
}

// ---------- Overtime ----------

/** Israeli overtime: first 2h/day at 125%, beyond at 150%. Saturdays/holidays may be 150%/175%.
 *  Here we compute a pay multiplier given hours beyond regular daily 8.6h.
 */
export function splitOvertimeHours(extraHoursPerDay: number): { h125: number; h150: number } {
  const h125 = Math.max(0, Math.min(2, extraHoursPerDay));
  const h150 = Math.max(0, extraHoursPerDay - 2);
  return { h125, h150 };
}

// ---------- Full payroll calculation ----------

export interface PayrollInputs {
  /** monthly base salary OR derived from hourly */
  basePay: number;
  /** overtime split */
  overtime125Hours?: number;
  overtime150Hours?: number;
  hourlyRate?: number;
  /** non-pensionable additions */
  transport?: number;
  meal?: number;
  otherAdditions?: number;
  /** pension config */
  pensionEmployeePct?: number;
  pensionEmployerPct?: number;
  pensionSeverancePct?: number;
  studyEmployeePct?: number;
  studyEmployerPct?: number;
  /** tax */
  taxCreditPoints?: number;
  /** other deductions to apply against net */
  otherDeductions?: number;
}

export interface PayrollResult {
  base_pay: number;
  overtime_pay: number;
  transport: number;
  meal: number;
  other_additions: number;
  gross_total: number;
  pensionable_base: number;
  pension: PensionResult;
  income_tax: number;
  national_insurance: number;
  health_tax: number;
  other_deductions: number;
  total_deductions: number;
  net_total: number;
  employer_total_cost: number;
}

/** Compute a full monthly payroll snapshot. APPROXIMATE. */
export function calcPayroll(inputs: PayrollInputs): PayrollResult {
  const base_pay = inputs.basePay || 0;
  const hourlyRate = inputs.hourlyRate ?? (base_pay > 0 ? base_pay / STANDARD_MONTHLY_HOURS : 0);
  const ot125 = (inputs.overtime125Hours || 0) * hourlyRate * 1.25;
  const ot150 = (inputs.overtime150Hours || 0) * hourlyRate * 1.50;
  const overtime_pay = ot125 + ot150;
  const transport = inputs.transport || 0;
  const meal      = inputs.meal      || 0;
  const other_additions = inputs.otherAdditions || 0;

  const gross_total = base_pay + overtime_pay + transport + meal + other_additions;

  // Pensionable base — typically base + overtime, NOT allowances.
  const pensionable_base = base_pay + overtime_pay;
  const pension = calcPension({
    pensionableBase: pensionable_base,
    employeePct:  inputs.pensionEmployeePct  ?? 6.0,
    employerPct:  inputs.pensionEmployerPct  ?? 6.5,
    severancePct: inputs.pensionSeverancePct ?? 6.0,
    studyEmployeePct: inputs.studyEmployeePct,
    studyEmployerPct: inputs.studyEmployerPct,
  });

  const rawTax = calcIncomeTaxRaw(gross_total);
  const income_tax = applyCreditPoints(rawTax, inputs.taxCreditPoints ?? 2.25);
  const ni = calcNationalInsuranceAndHealth(gross_total);
  const other_deductions = inputs.otherDeductions || 0;

  const total_deductions =
    income_tax + ni.national_insurance + ni.health_tax +
    pension.employee + pension.study_employee + other_deductions;

  const net_total = gross_total - total_deductions;
  const employer_total_cost = gross_total + pension.total_employer_cost;

  return {
    base_pay,
    overtime_pay,
    transport,
    meal,
    other_additions,
    gross_total,
    pensionable_base,
    pension,
    income_tax,
    national_insurance: ni.national_insurance,
    health_tax: ni.health_tax,
    other_deductions,
    total_deductions,
    net_total,
    employer_total_cost,
  };
}

// ---------- Helpers ----------

/** Inclusive working days between two dates (excludes Friday & Saturday). */
export function workingDaysBetween(start: Date | string, end: Date | string): number {
  const s = typeof start === "string" ? new Date(start) : new Date(start.getTime());
  const e = typeof end   === "string" ? new Date(end)   : new Date(end.getTime());
  s.setHours(0, 0, 0, 0); e.setHours(0, 0, 0, 0);
  if (e < s) return 0;
  let days = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const dow = cur.getDay(); // 0=Sun ... 6=Sat
    if (dow !== 5 && dow !== 6) days++;
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

/** Format NIS amount. */
export function fmtNIS(n: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency", currency: "ILS", maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  vacation: "חופשה",
  sick:     "מחלה",
  mourning: "אבל",
  reserve:  "מילואים",
  maternity:"חופשת לידה",
  unpaid:   "חל\"ת",
  other:    "אחר",
};
