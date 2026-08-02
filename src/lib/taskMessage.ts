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

export type TaskMessageChannel = "whatsapp" | "sms";

export interface TaskMessageTemplate {
  id: string;
  name: string;
  message_template: string;
  default_channel: TaskMessageChannel;
}

export const normalizeTaskMessageTemplates = (
  value: unknown,
  fallback: TaskMessageTemplate,
) => {
  const templates = Array.isArray(value)
    ? value.flatMap((candidate) => {
        if (!candidate || typeof candidate !== "object") return [];
        const item = candidate as Record<string, unknown>;
        const id = typeof item.id === "string" ? item.id.trim() : "";
        const name = typeof item.name === "string" ? item.name.trim() : "";
        const messageTemplate =
          typeof item.message_template === "string"
            ? item.message_template.trim()
            : "";
        const channel = item.default_channel === "sms" ? "sms" : "whatsapp";
        if (!id || !name || !messageTemplate) return [];
        return [{ id, name, message_template: messageTemplate, default_channel: channel } as TaskMessageTemplate];
      })
    : [];

  return templates.length > 0 ? templates : [fallback];
};

export const resolveDefaultTaskMessageTemplate = (
  templates: TaskMessageTemplate[],
  defaultTemplateId: string | null | undefined,
) => templates.find((template) => template.id === defaultTemplateId) || templates[0];
