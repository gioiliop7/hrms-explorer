// scripts/smoke-khmdhs.mjs
//
// End-to-end check against the live ΚΗΜΔΗΣ API: resolves an organization, pulls all
// five act types, and prints what normalization produced. Verifies the parts that
// only real payloads can — the per-endpoint field divergence, the 180-day chunking,
// and whether contractors and CPVs actually come through.
//
// Usage: node --experimental-strip-types scripts/smoke-khmdhs.mjs ["ΔΗΜΟΣ ΡΟΔΟΥ"]

import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildRegistry, matchOrganization } from "../lib/khmdhs/matching.ts";
import { fetchAllActs } from "../lib/khmdhs/client.ts";
import { normalizeAct } from "../lib/khmdhs/normalize.ts";
import { ACT_TYPES } from "../lib/khmdhs/types.ts";

const name = process.argv[2] ?? "ΥΠΟΥΡΓΕΙΟ ΑΓΡΟΤΙΚΗΣ ΑΝΑΠΤΥΞΗΣ ΚΑΙ ΤΡΟΦΙΜΩΝ";

const registryData = JSON.parse(
  await readFile(
    path.join(process.cwd(), "data", "khmdhs-organizations.json"),
    "utf8",
  ),
);
const registry = buildRegistry(registryData.organizations);

const match = matchOrganization(name, registry);
if (!match) {
  console.log(`No ΚΗΜΔΗΣ match for "${name}"`);
  process.exit(0);
}

console.log(
  `"${name}"\n  → [${match.organization.key}] ${match.organization.name}` +
    `  (${match.confidence}, score ${match.score.toFixed(2)})\n`,
);

// A 12-month window forces the 180-day chunking to actually split.
const dateTo = new Date().toISOString().slice(0, 10);
const from = new Date();
from.setUTCFullYear(from.getUTCFullYear() - 1);
const dateFrom = from.toISOString().slice(0, 10);

const filters = {
  organizations: [Number(match.organization.key)],
  dateFrom,
  dateTo,
};
console.log(`window ${dateFrom} → ${dateTo}\n`);

for (const actType of ACT_TYPES) {
  const started = Date.now();
  try {
    const { acts, totalElements, truncated } = await fetchAllActs(
      actType,
      filters,
      { maxPages: 2 },
    );
    const normalized = acts.map((raw) => normalizeAct(actType, raw));

    const withDate = normalized.filter((a) => a.signedDate).length;
    const withCost = normalized.filter((a) => a.totalCostWithoutVAT !== null).length;
    const withCpv = normalized.filter((a) => a.cpvCodes.length > 0).length;
    const withContractor = normalized.filter((a) => a.contractors.length > 0).length;
    const value = normalized.reduce(
      (sum, a) => sum + (a.cancelled ? 0 : (a.totalCostWithoutVAT ?? 0)),
      0,
    );

    console.log(
      `${actType.padEnd(9)} total=${String(totalElements).padStart(5)} ` +
        `fetched=${String(normalized.length).padStart(4)} ` +
        `dated=${withDate} cost=${withCost} cpv=${withCpv} contractor=${withContractor} ` +
        `${truncated ? "TRUNCATED " : ""}` +
        `value=${value.toLocaleString("el-GR", { maximumFractionDigits: 0 })}€ ` +
        `(${Date.now() - started}ms)`,
    );

    const sample = normalized[0];
    if (sample) {
      console.log(
        `          e.g. ${sample.referenceNumber} ${sample.signedDate} ` +
          `"${sample.title.slice(0, 60)}"`,
      );
      if (sample.contractors.length) {
        console.log(
          `               contractor: ${sample.contractors[0].name} ` +
            `(ΑΦΜ ${sample.contractors[0].vatNumber ?? "—"})`,
        );
      }
      if (sample.cpvCodes.length) {
        console.log(
          `               cpv: ${sample.cpvCodes[0].code} ${sample.cpvCodes[0].label}`,
        );
      }
    }
  } catch (error) {
    console.log(`${actType.padEnd(9)} FAILED: ${error.message}`);
  }
}
