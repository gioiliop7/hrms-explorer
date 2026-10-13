// lib/csv.ts
//
// CSV export built for Greek Excel, which is where these files actually get opened.
//
// Three things have to be right or the file looks broken to the user:
//   * a UTF-8 BOM, or Excel reads the Greek as mojibake;
//   * ";" as the delimiter, because a Greek locale writes decimals as "1234,56"
//     and a comma-delimited file splits every number into two columns;
//   * CRLF line endings, per RFC 4180.

// Self-contained by design: lib/utils.ts imports downloadCsv for the org-tree
// export, so this module must not import back from it.

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | Date | null | undefined;
}

export interface CsvOptions {
  /** Defaults to ";" for Greek Excel. Pass "," for a locale-neutral file. */
  delimiter?: string;
  /** Include the UTF-8 BOM. Defaults to true. */
  bom?: boolean;
}

const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

/** Whether a rendered value would be read as a formula by a spreadsheet. */
function looksLikeFormula(value: string): boolean {
  if (!FORMULA_PREFIXES.some((prefix) => value.startsWith(prefix))) return false;

  // A lone "-" is the placeholder these registries use for "no value", and a
  // negative number is a number. Neither is a formula, and prefixing them turns a
  // clean cell into "'-" and a numeric column into text.
  if (value.length === 1) return false;
  if (/^[-+]\d+(?:[.,]\d+)?$/.test(value)) return false;

  return true;
}

/**
 * Renders one value as a CSV field.
 *
 * Text beginning with =, +, -, or @ is prefixed with an apostrophe. Spreadsheets
 * treat those as formulas, and this file carries third-party text — contractor
 * names and act titles typed by hundreds of different authorities — straight into
 * the user's Excel. Neutralizing them here keeps a crafted name from executing on
 * open.
 */
function escapeField(
  raw: string | number | boolean | Date | null | undefined,
  delimiter: string,
): string {
  if (raw === null || raw === undefined) return "";

  let value: string;
  if (raw instanceof Date) {
    value = Number.isNaN(raw.getTime()) ? "" : raw.toLocaleDateString("el-GR");
  } else if (typeof raw === "number") {
    // Greek Excel expects a decimal comma; with a "," delimiter that would be
    // ambiguous, so only switch when the delimiter leaves room for it.
    if (!Number.isFinite(raw)) return "";
    value =
      delimiter === ";" ? String(raw).replace(".", ",") : String(raw);
  } else if (typeof raw === "boolean") {
    value = raw ? "Ναι" : "Όχι";
  } else {
    value = raw;
  }

  if (looksLikeFormula(value)) {
    value = `'${value}`;
  }

  const needsQuoting =
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r") ||
    value !== value.trim();

  return needsQuoting ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Builds the CSV text for a set of rows. */
export function toCsv<T>(
  rows: T[],
  columns: CsvColumn<T>[],
  options: CsvOptions = {},
): string {
  const { delimiter = ";" } = options;

  const lines = [
    columns.map((column) => escapeField(column.header, delimiter)).join(delimiter),
    ...rows.map((row) =>
      columns
        .map((column) => escapeField(column.value(row), delimiter))
        .join(delimiter),
    ),
  ];

  return lines.join("\r\n");
}

/** Hands a generated blob to the browser as a file download. */
function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Builds the CSV and hands it to the browser as a download. */
export function downloadCsv<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[],
  options: CsvOptions = {},
): void {
  const { bom = true } = options;
  const csv = toCsv(rows, columns, options);

  const blob = new Blob([bom ? `\uFEFF${csv}` : csv], {
    type: "text/csv;charset=utf-8;",
  });

  downloadFile(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

/** Timestamped filename, e.g. "khmdhs-symvaseis-2026-09-08.csv". */
export function timestampedFilename(base: string): string {
  return `${base}-${new Date().toISOString().slice(0, 10)}.csv`;
}
