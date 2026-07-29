export const normalizeTaskMessagePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return `972${digits.slice(1)}`;
  return digits;
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
