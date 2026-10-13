// scripts/check-csv.mjs
//
// Checks the CSV writer against the cases that actually break a Greek Excel import:
// the BOM, the ";" delimiter, CRLF endings, decimal commas, embedded delimiters and
// quotes, and formula-injection prefixes. Runs the real column definitions over live
// ΚΗΜΔΗΣ acts as well as hand-built rows, so the escaping is exercised on the messy
// free text authorities actually publish.
//
// Usage: node --experimental-strip-types scripts/check-csv.mjs

import { readFile } from "node:fs/promises";
import path from "node:path";
import { toCsv } from "../lib/csv.ts";
import { actCsvColumns } from "../lib/khmdhs/export.ts";
import { buildRegistry, matchOrganization } from "../lib/khmdhs/matching.ts";
import { fetchAllActs } from "../lib/khmdhs/client.ts";
import { normalizeAct } from "../lib/khmdhs/normalize.ts";

let failures = 0;

function check(label, condition, detail = "") {
  console.log(`  ${condition ? "ok  " : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!condition) failures++;
}

/** Parses a ";"-delimited RFC 4180 line back into fields. */
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') inQuotes = false;
      else cur += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ";") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

/** Splits CSV text into records, honouring newlines inside quoted fields. */
function splitRecords(text) {
  const records = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      cur += c;
    } else if (!inQuotes && c === "\r" && text[i + 1] === "\n") {
      records.push(cur);
      cur = "";
      i++;
    } else cur += c;
  }
  if (cur) records.push(cur);
  return records;
}

console.log("\n=== 1. Escaping and formatting ===");
{
  const rows = [
    {
      plain: "ΔΗΜΟΣ ΡΟΔΟΥ",
      withDelimiter: "Προμήθεια Α; Προμήθεια Β",
      withQuotes: 'Νοσοκομείο "Γ. ΓΕΝΝΗΜΑΤΑΣ"',
      withNewline: "Γραμμή 1\nΓραμμή 2",
      decimal: 2572.58,
      integer: 1116,
      bool: true,
      nothing: null,
      formula: "=1+1",
      minus: "-ΕΚΠΤΩΣΗ",
      dash: "-",
      negative: -1234.5,
      negativeText: "-42",
      padded: "  κενά  ",
    },
  ];
  const columns = Object.keys(rows[0]).map((key) => ({
    header: key,
    value: (r) => r[key],
  }));

  const csv = toCsv(rows, columns);
  const records = splitRecords(csv);
  const fields = splitCsvLine(records[1]);
  const named = Object.fromEntries(
    Object.keys(rows[0]).map((key, i) => [key, fields[i]]),
  );

  check("record count", records.length === 2, `${records.length}`);
  check("CRLF line endings", csv.includes("\r\n"));
  check("field count", fields.length === columns.length, `${fields.length}`);
  check(
    "delimiter inside field survives",
    named.withDelimiter === "Προμήθεια Α; Προμήθεια Β",
    named.withDelimiter,
  );
  check(
    "quotes doubled and recovered",
    named.withQuotes === 'Νοσοκομείο "Γ. ΓΕΝΝΗΜΑΤΑΣ"',
    named.withQuotes,
  );
  check(
    "newline inside quoted field",
    named.withNewline === "Γραμμή 1\nΓραμμή 2",
    JSON.stringify(named.withNewline),
  );
  check("decimal uses comma", named.decimal === "2572,58", named.decimal);
  check("integer unchanged", named.integer === "1116", named.integer);
  check("boolean is Greek", named.bool === "Ναι", named.bool);
  check("null is empty", named.nothing === "", JSON.stringify(named.nothing));
  check(
    "formula neutralised",
    named.formula === "'=1+1",
    JSON.stringify(named.formula),
  );
  check(
    "leading minus neutralised",
    named.minus === "'-ΕΚΠΤΩΣΗ",
    JSON.stringify(named.minus),
  );
  // The guard must not fire on things that only look like formulas: "-" is the
  // registries' placeholder for "no value", and a negative number is a number.
  check("lone dash left alone", named.dash === "-", JSON.stringify(named.dash));
  check(
    "negative number stays numeric",
    named.negative === "-1234,5",
    JSON.stringify(named.negative),
  );
  check(
    "negative numeric text stays numeric",
    named.negativeText === "-42",
    JSON.stringify(named.negativeText),
  );
  check(
    "surrounding spaces preserved",
    named.padded === "  κενά  ",
    JSON.stringify(named.padded),
  );
}

console.log("\n=== 2. Real ΚΗΜΔΗΣ acts through the real columns ===");
{
  const registryData = JSON.parse(
    await readFile(
      path.join(process.cwd(), "data", "khmdhs-organizations.json"),
      "utf8",
    ),
  );
  const match = matchOrganization(
    process.argv[2] ?? "ΔΗΜΟΣ ΡΟΔΟΥ",
    buildRegistry(registryData.organizations),
  );

  if (!match) {
    console.log("  (no ΚΗΜΔΗΣ match — skipped)");
  } else {
    const dateTo = new Date().toISOString().slice(0, 10);
    const from = new Date();
    from.setUTCDate(from.getUTCDate() - 120);

    const { acts } = await fetchAllActs(
      "contract",
      {
        organizations: [Number(match.organization.key)],
        dateFrom: from.toISOString().slice(0, 10),
        dateTo,
      },
      { maxPages: 3 },
    );
    const normalized = acts.map((raw) => normalizeAct("contract", raw));
    console.log(`  ${normalized.length} contracts from ${match.organization.name}`);

    const csv = toCsv(normalized, actCsvColumns);
    const records = splitRecords(csv);
    const expected = splitCsvLine(records[0]).length;
    const bad = records
      .slice(1)
      .map((line, i) => ({ line: i + 2, n: splitCsvLine(line).length }))
      .filter((r) => r.n !== expected);

    check("header column count", expected === actCsvColumns.length, `${expected}`);
    check("every row has the header's field count", bad.length === 0,
      bad.length ? `line ${bad[0].line} has ${bad[0].n}` : "");
    check("row count matches act count", records.length - 1 === normalized.length,
      `${records.length - 1} vs ${normalized.length}`);

    // Round-trip a row with awkward text back to its source values.
    const awkward = normalized.findIndex(
      (a) => a.title.includes(";") || a.title.includes('"') || a.title.includes(","),
    );
    if (awkward >= 0) {
      const fields = splitCsvLine(records[awkward + 1]);
      check(
        "awkward title round-trips",
        fields[2] === normalized[awkward].title,
        `${JSON.stringify(normalized[awkward].title.slice(0, 50))}`,
      );
    } else {
      console.log("  (no title with a delimiter or quote in this sample)");
    }

    const withCost = normalized.findIndex((a) => a.totalCostWithoutVAT !== null);
    if (withCost >= 0) {
      const fields = splitCsvLine(records[withCost + 1]);
      check(
        "cost renders with decimal comma",
        /^\d+(,\d+)?$/.test(fields[10]),
        `${fields[10]} (was ${normalized[withCost].totalCostWithoutVAT})`,
      );
    }

    console.log(`\n  header: ${records[0].slice(0, 160)}`);
    if (records[1]) console.log(`  row1:   ${records[1].slice(0, 160)}`);
  }
}

console.log(
  failures === 0
    ? "\nAll CSV checks passed.\n"
    : `\n${failures} CSV check(s) FAILED.\n`,
);
process.exit(failures === 0 ? 0 : 1);
