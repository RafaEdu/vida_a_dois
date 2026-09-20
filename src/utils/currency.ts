const BRL = "pt-BR";

export function formatCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "R$ 0,00";
  return value.toLocaleString(BRL, {
    style: "currency",
    currency: "BRL",
  });
}

export function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  const amount = Number(digits) / 100;
  return amount.toLocaleString(BRL, {
    style: "currency",
    currency: "BRL",
  });
}

export function parseCurrencyInput(value: string): number {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return 0;
  const amount = Number(digits) / 100;
  return Number.isFinite(amount) ? amount : 0;
}

export function parseDecimalInput(value: string): number {
  if (!value) return 0;

  let cleaned = value.trim().replace(/[^\d.,]/g, "");
  if (!cleaned) return 0;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (lastComma >= 0) {
    cleaned = cleaned.replace(",", ".");
  } else if (lastDot >= 0) {
    const dotCount = (cleaned.match(/\./g) ?? []).length;
    if (dotCount > 1) cleaned = cleaned.replace(/\./g, "");
  }

  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}
