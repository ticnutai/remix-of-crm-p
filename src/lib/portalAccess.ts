export function normalizeIsraeliPhone(value: string): string {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("00972")) {
    digits = digits.slice(5);
  } else if (digits.startsWith("972")) {
    digits = digits.slice(3);
  }

  if (digits.length === 9 && digits.startsWith("5")) {
    return `0${digits}`;
  }

  return digits;
}

export function isValidIsraeliPhone(value: string): boolean {
  return /^0\d{8,9}$/.test(normalizeIsraeliPhone(value));
}

export function toWhatsAppPhone(value: string): string {
  const local = normalizeIsraeliPhone(value);
  return local.startsWith("0") ? `972${local.slice(1)}` : local;
}

