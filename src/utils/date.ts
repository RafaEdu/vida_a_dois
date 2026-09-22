const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const BIRTH_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const YEAR_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function isValidCalendarDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > daysInMonth(year, month)) return false;
  return true;
}

export function isValidDateOnly(value: string): boolean {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return isValidCalendarDate(year, month, day);
}

export function formatDateOnlyForDisplay(
  value: string | null | undefined,
): string {
  if (!value) return "";
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return "";
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export function formatBirthDateInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function parseBirthDateToISO(value: string): string | null {
  const match = BIRTH_DATE_PATTERN.exec(value);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (!isValidCalendarDate(year, month, day)) return null;
  if (year <= 1900 || year >= new Date().getFullYear()) return null;

  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function getYearMonthFromDateOnly(value: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (!match) return "";
  return `${match[1]}-${match[2]}`;
}

export function getYearMonthFromTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

export function getCurrentYearMonth(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

export function formatYearMonthLong(yearMonth: string): string {
  const match = YEAR_MONTH_PATTERN.exec(yearMonth);
  if (!match) return "";
  const name = MONTH_NAMES[Number(match[2]) - 1];
  if (!name) return "";
  return `${name} de ${match[1]}`;
}

export function shiftYearMonth(yearMonth: string, delta: number): string {
  const match = YEAR_MONTH_PATTERN.exec(yearMonth);
  if (!match || !Number.isFinite(delta)) return yearMonth;

  const date = new Date(Number(match[1]), Number(match[2]) - 1 + delta, 1);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function toDateOnly(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Human label for a date group in the transactions list: `Hoje`, `Ontem` or
 * the canonical `DD/MM/AAAA`. Returns `Sem data` for missing/invalid values.
 */
export function formatDateGroupLabel(
  dateOnly: string,
  today = new Date(),
): string {
  if (dateOnly === toDateOnly(today)) return "Hoje";

  const yesterday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 1,
  );
  if (dateOnly === toDateOnly(yesterday)) return "Ontem";

  return formatDateOnlyForDisplay(dateOnly) || "Sem data";
}

/**
 * Formats a timestamp (ISO string) as the canonical `DD/MM/AAAA` in local
 * time. Returns an empty string for missing/invalid values.
 */
export function formatDateFromTimestamp(
  value: string | null | undefined,
): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

/**
 * Human elapsed time since a timestamp, e.g. `há 3 dias`, `há 2 meses`,
 * `há 1 ano e 3 meses`. Returns `null` for missing/invalid values.
 */
export function formatElapsedSince(
  value: string | null | undefined,
  now = new Date(),
): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = now.getTime() - date.getTime();
  if (diffMs <= 0) return "agora";

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return "há poucos minutos";

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} ${hours === 1 ? "hora" : "horas"}`;

  const days = Math.floor(diffMs / 86400000);
  if (days < 30) return `há ${days} ${days === 1 ? "dia" : "dias"}`;

  const months = Math.floor(days / 30);
  if (months < 12) return `há ${months} ${months === 1 ? "mês" : "meses"}`;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const yearLabel = `${years} ${years === 1 ? "ano" : "anos"}`;
  if (remainingMonths === 0) return `há ${yearLabel}`;

  const monthLabel = `${remainingMonths} ${
    remainingMonths === 1 ? "mês" : "meses"
  }`;
  return `há ${yearLabel} e ${monthLabel}`;
}
