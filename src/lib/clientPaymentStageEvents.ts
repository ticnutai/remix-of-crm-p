export const CLIENT_PAYMENT_STAGE_UPDATED_EVENT = "client-payment-stage-updated";

export function notifyClientPaymentStageUpdated(clientId: string) {
  window.dispatchEvent(
    new CustomEvent(CLIENT_PAYMENT_STAGE_UPDATED_EVENT, {
      detail: { clientId },
    }),
  );
}
