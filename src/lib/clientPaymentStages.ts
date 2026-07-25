export interface ClientPaymentStageLinkFields {
  amount?: number | null;
  amount_with_vat?: number | null;
}

/**
 * Detects the zero-value rows that were accidentally created by completing a
 * regular client-stage task. A real payment milestone must carry a payable
 * amount; zero-value task rows must never appear in payment totals or lists.
 */
export function isVisibleClientPaymentStage(
  stage: ClientPaymentStageLinkFields,
): boolean {
  return (
    Number(stage.amount || 0) > 0 || Number(stage.amount_with_vat || 0) > 0
  );
}
