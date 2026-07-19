export interface QuotePaymentStepLike {
  id?: string | null;
  percentage?: number | string | null;
  [key: string]: unknown;
}
export interface AtomicQuoteClientResult {
  client_id: string;
  saved_quote_id: string;
  contract_id: string;
  stages_added: number;
  tasks_added: number;
  payments_added: number;
  payments_linked: number;
  idempotent_replay: boolean;
}

export const isExpiredAuthError = (error: unknown): boolean => {
  const message = String(
    (error as { message?: string; details?: string } | null)?.message ||
      (error as { details?: string } | null)?.details ||
      error ||
      "",
  );
  return /AUTH_SESSION_EXPIRED|JWT expired|not authenticated|לא מחובר/i.test(message);
};

/** Currency is stored and displayed to agorot, without losing half-shekel rows. */
export const formatIls = (amount: number): string =>
  new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

/** Stable payload shape for the single atomic database operation. */
export function buildAtomicQuoteClientRequest({
  idempotencyKey,
  existingClientId,
  client,
  quote,
  stageTemplateId,
  paymentSchedule,
}: {
  idempotencyKey: string;
  existingClientId?: string | null;
  client: Record<string, unknown>;
  quote: Record<string, unknown>;
  stageTemplateId?: string | null;
  paymentSchedule: QuotePaymentStepLike[];
}) {
  if (!idempotencyKey) throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  if (!(Number(quote.base_price) > 0)) throw new Error("QUOTE_PRICE_MUST_BE_POSITIVE");

  return {
    idempotency_key: idempotencyKey,
    existing_client_id: existingClientId || null,
    client,
    quote,
    stage_template_id: stageTemplateId || null,
    payment_schedule: paymentSchedule.map((step, index) => ({
      ...step,
      id: step.id || `step-${index + 1}`,
      percentage: Number(step.percentage) || 0,
    })),
  };
}
