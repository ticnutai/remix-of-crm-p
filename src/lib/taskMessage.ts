export const normalizeTaskMessagePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return `972${digits.slice(1)}`;
  return digits;
};

export const extractTaskMessagePhones = (value: string) => {
  const matches =
    value.match(/(?<!\d)(?:\+?972|0)(?:[\s().-]*\d){9}(?!\d)/g) || [];
  const normalized = matches
    .map(normalizeTaskMessagePhone)
    .filter((phone) => /^972\d{9}$/.test(phone));

  if (normalized.length > 0) {
    return [...new Set(normalized)];
  }

  const fallback = normalizeTaskMessagePhone(value);
  return /^972\d{9}$/.test(fallback) ? [fallback] : [];
};

export const fillTaskMessageTemplate = (
  template: string,
  values: Record<string, string>,
) =>
  Object.entries(values).reduce(
    (message, [key, value]) =>
      message.replace(new RegExp(`\\{${key}\\}`, "g"), value),
    template,
  );
