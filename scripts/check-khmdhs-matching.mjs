// scripts/check-khmdhs-matching.mjs
//
// Measures how well lib/khmdhs/matching.ts joins the ΗΡΜΣ organization register to
// the harvested ΚΗΜΔΗΣ one, and prints samples to eyeball for false positives.
//
// The match rate is not expected to reach 100%: a large share of ΗΡΜΣ entries are
// units, committees and supervisory bodies that never contract in their own name.
// What matters is that the matches it does make are right — read the PARTIAL
// samples, since those are where a wrong attribution would come from.
//
// Usage: node --experimental-strip-types scripts/check-khmdhs-matching.mjs

import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildRegistry, matchOrganization } from "../lib/khmdhs/matching.ts";
import {
  MANUAL_OVERRIDES,
  OVERRIDES_BY_NORMALIZED,
} from "../lib/khmdhs/overrides.ts";
import { normalizeGreekText } from "../lib/text.ts";

const root = process.cwd();

const registryData = JSON.parse(
  await readFile(path.join(root, "data", "khmdhs-organizations.json"), "utf8"),
);
const registry = buildRegistry(registryData.organizations);

const response = await fetch("https://hrms.gov.gr/api/public/organizations", {
  headers: { Accept: "application/json" },
});
const hrms = (await response.json()).data ?? [];

console.log(
  `ΗΡΜΣ organizations: ${hrms.length}   ΚΗΜΔΗΣ register: ${registry.entries.length}\n`,
);

// Every override must still point at a live register entry. A key that has gone
// stale — the register is re-harvested periodically — would silently stop resolving
// and the organization would look as though it never procures.
console.log(`Manual overrides: ${Object.keys(MANUAL_OVERRIDES).length}`);
let staleOverrides = 0;
for (const [name, key] of Object.entries(MANUAL_OVERRIDES)) {
  const target = registry.entries.find((e) => e.key === key);
  if (!target) {
    console.log(`  STALE  ${name} → key ${key} is not in the register`);
    staleOverrides++;
  }
}
console.log(
  staleOverrides === 0
    ? "  all override keys resolve ✓\n"
    : `  ${staleOverrides} STALE OVERRIDE(S)\n`,
);

/** Mirrors findKhmdhsOrganization: overrides first, then the matcher. */
function resolve(name) {
  const key = OVERRIDES_BY_NORMALIZED.get(normalizeGreekText(name));
  if (key) {
    const entry = registry.entries.find((e) => e.key === key);
    if (entry) {
      return { organization: entry, confidence: "override", score: 1 };
    }
  }
  return matchOrganization(name, registry);
}

const exact = [];
const partial = [];
const overridden = [];
const missed = [];

for (const org of hrms) {
  const match = resolve(org.preferredLabel);
  if (!match) missed.push(org.preferredLabel);
  else if (match.confidence === "override")
    overridden.push([org.preferredLabel, match]);
  else if (match.confidence === "exact") exact.push([org.preferredLabel, match]);
  else partial.push([org.preferredLabel, match]);
}

const matched = exact.length + partial.length + overridden.length;
const pct = (n) => ((n / hrms.length) * 100).toFixed(1);

console.log(`exact    ${String(exact.length).padStart(5)}  ${pct(exact.length)}%`);
console.log(
  `partial  ${String(partial.length).padStart(5)}  ${pct(partial.length)}%`,
);
console.log(
  `override ${String(overridden.length).padStart(5)}  ${pct(overridden.length)}%`,
);
console.log(`missed   ${String(missed.length).padStart(5)}  ${pct(missed.length)}%`);
console.log(`TOTAL    ${String(matched).padStart(5)}  ${pct(matched)}%\n`);

// Collisions: two ΗΡΜΣ names resolving to the same ΚΗΜΔΗΣ key means at least one
// is wrong, so these are the highest-value thing to inspect.
const byKey = new Map();
for (const [name, match] of [...exact, ...partial, ...overridden]) {
  const list = byKey.get(match.organization.key) ?? [];
  list.push(name);
  byKey.set(match.organization.key, list);
}
const collisions = [...byKey.entries()].filter(([, names]) => names.length > 1);

console.log(`COLLISIONS (same ΚΗΜΔΗΣ key claimed by several ΗΡΜΣ names): ${collisions.length}`);
for (const [key, names] of collisions.slice(0, 12)) {
  const org = registry.entries.find((e) => e.key === key);
  console.log(`  [${key}] ${org?.name}`);
  for (const name of names) console.log(`      ← ${name}`);
}

console.log(`\nPARTIAL samples (lowest scores first — most likely to be wrong):`);
for (const [name, match] of [...partial].sort((a, b) => a[1].score - b[1].score).slice(0, 25)) {
  console.log(`  ${match.score.toFixed(2)}  ${name}`);
  console.log(`        → ${match.organization.name}`);
}

console.log(`\nMISSED samples:`);
for (const name of missed.slice(0, 15)) console.log(`  ${name}`);
