export const DEFAULT_QUOTE_BASE_PRICE = 35_000;

interface PricingTierLike {
  name?: string | null;
  price?: number | string | null;
}

/** Resolve the exact price shown by the editor for every persistence flow. */
export function resolveQuoteBasePrice({
  basePrice,
  pricingTiers = [],
  selectedTier,
}: {
  basePrice?: number | string | null;
  pricingTiers?: PricingTierLike[] | null;
  selectedTier?: string | null;
}): number {
  const selected = (pricingTiers || []).find(
    (tier) => tier?.name === selectedTier && Number(tier?.price) > 0,
  );
  if (selected) return Number(selected.price);

  const explicit = Number(basePrice);
  return explicit > 0 ? explicit : DEFAULT_QUOTE_BASE_PRICE;
}
