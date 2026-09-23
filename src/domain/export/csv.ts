import {
  formatDateFromTimestamp,
  formatDateOnlyForDisplay,
} from "../../utils/date";

/** Separador usado no CSV para conviver com a vírgula decimal (pt-BR). */
export const CSV_DELIMITER = ";";
export const CSV_NEWLINE = "\r\n";
/** BOM UTF-8 para o Excel abrir acentuação corretamente. */
export const CSV_UTF8_BOM = "\uFEFF";

export type CsvCell = string | number | boolean | null | undefined;

/** Escapa uma célula segundo as regras do CSV (aspas duplicadas). */
export function escapeCsvCell(value: CsvCell): string {
  const text = value == null ? "" : String(value);
  if (
    text.includes(CSV_DELIMITER) ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Serializa linhas em CSV com BOM UTF-8, delimitador `;` e fim de linha CRLF.
 * Os valores devem chegar já formatados para leitura humana (datas pt-BR,
 * decimais com vírgula).
 */
export function toCsv(headers: string[], rows: CsvCell[][]): string {
  const lines = [headers, ...rows].map((row) =>
    row.map(escapeCsvCell).join(CSV_DELIMITER),
  );
  return `${CSV_UTF8_BOM}${lines.join(CSV_NEWLINE)}${CSV_NEWLINE}`;
}

/** Número para CSV com duas casas e vírgula decimal (ex.: `1234.5` → `1234,50`). */
export function formatCsvNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "0,00";
  return value.toFixed(2).replace(".", ",");
}

/** Data ISO (timestamp) para CSV como `DD/MM/AAAA`. */
export function formatCsvTimestamp(value: string | null | undefined): string {
  return formatDateFromTimestamp(value);
}

/** Data `AAAA-MM-DD` para CSV como `DD/MM/AAAA`. */
export function formatCsvDateOnly(value: string | null | undefined): string {
  return formatDateOnlyForDisplay(value);
}

/** Booleano para CSV como `Sim`/`Não`. */
export function formatCsvBoolean(value: boolean): string {
  return value ? "Sim" : "Não";
}
