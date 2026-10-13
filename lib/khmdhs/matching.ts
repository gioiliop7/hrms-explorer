// lib/khmdhs/matching.ts
//
// Name-matching between the ΗΡΜΣ organization register and the harvested ΚΗΜΔΗΣ one.
//
// ΚΗΜΔΗΣ publishes no organization lookup and accepts no ΑΦΜ filter, so its numeric
// organization key can only be reached by matching names — and the two registers do
// not write names the same way. ΗΡΜΣ spells them out; ΚΗΜΔΗΣ is full of clipped
// forms such as "ΠΕΡΙΦ. ΠΑΝΕΠΙΣΤ. ΓΕΝ. ΝΟΣΟΚ. ΗΡΑΚΛΕΙΟΥ".
//
// Counting shared words does not work here, because Greek public-sector names are
// mostly boilerplate. "ΔΗΜΟΣΙΑ ΚΕΝΤΡΙΚΗ ΒΙΒΛΙΟΘΗΚΗ ΛΑΜΙΑΣ" and "ΔΗΜΟΣΙΑ ΒΙΒΛΙΟΘΗΚΗ
// ΒΕΡΟΙΑΣ (ΚΕΝΤΡΙΚΗ)" share three words out of four and differ only in the one that
// identifies them. So words are weighted by how rare they are across the register
// (IDF): "βιβλιοθηκη" appears in dozens of names and counts for little, "λαμιας" in
// one or two and counts for a lot. A candidate only wins if the rare words line up.
//
// Kept free of I/O so it can be measured against the full ΗΡΜΣ register
// (scripts/check-khmdhs-matching.mjs); organizations.ts supplies the data.

import { normalizeGreekTokens, normalizeGreekText } from "../text.ts";
import type { KhmdhsOrganization } from "./types.ts";

export interface RegistryEntry extends KhmdhsOrganization {
  normalized: string;
  tokens: string[];
}

export interface Registry {
  entries: RegistryEntry[];
  /** Inverse document frequency per token, over the ΚΗΜΔΗΣ register. */
  idf: Map<string, number>;
  /** Weight given to a token the register has never seen — necessarily rare. */
  maxIdf: number;
}

export interface KhmdhsMatch {
  organization: KhmdhsOrganization;
  confidence: "exact" | "partial";
  score: number;
}

/** Words too common to carry any signal even after IDF weighting. */
const STOPWORDS = new Set([
  "και",
  "του",
  "της",
  "των",
  "το",
  "τα",
  "ο",
  "η",
  "οι",
  "στο",
  "στη",
  "στην",
  "ae",
  "αε",
]);

/**
 * Minimum weighted agreement, in both directions, for a match to be accepted.
 *
 * Set to prefer "no data" over a confident wrong attribution: a great many ΗΡΜΣ
 * entries are units, committees and ΕΛΚΕ that never contract in their own name, so
 * a miss is the correct answer far more often than a match. Showing one authority's
 * contracts under another's name is the failure that actually matters.
 */
export const MIN_SCORE = 0.62;

/**
 * Tokenizes a name for matching: accents and punctuation dropped, stopwords and
 * single letters removed.
 *
 * Single letters are dropped because punctuation-heavy abbreviations shatter into
 * them — "Κ.Α.Τ." becomes κ/α/τ — and they would otherwise count as several
 * unmatched rare tokens against an entry that simply writes "ΚΑΤ".
 */
export function tokenize(name: string): string[] {
  return normalizeGreekTokens(name).filter(
    (token) => token.length > 1 && !STOPWORDS.has(token),
  );
}

/**
 * Whether two tokens refer to the same word, allowing for ΚΗΜΔΗΣ-style clipping:
 * "νοσοκ" matches "νοσοκομειο", "πανεπιστ" matches "πανεπιστημιακο".
 *
 * The 4-character floor keeps stems that short from matching broadly — without it
 * "δημ" would join δημος, δημοτικη, δημοσια and δημαρχειο into one word.
 */
function tokensAgree(a: string, b: string): boolean {
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  return shorter.length >= 4 && longer.startsWith(shorter);
}

export function buildRegistry(
  organizations: KhmdhsOrganization[],
): Registry {
  const entries: RegistryEntry[] = organizations.map((org) => ({
    ...org,
    normalized: normalizeGreekText(org.name),
    tokens: tokenize(org.name),
  }));

  const documentFrequency = new Map<string, number>();
  for (const entry of entries) {
    for (const token of new Set(entry.tokens)) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }

  const total = entries.length || 1;
  const idf = new Map<string, number>();
  for (const [token, frequency] of documentFrequency) {
    idf.set(token, Math.log(total / (1 + frequency)));
  }

  return { entries, idf, maxIdf: Math.log(total) };
}

function weightOf(token: string, registry: Registry): number {
  // An unseen token is by definition rare, so it gets the maximum weight — that is
  // what makes an unmatched place name expensive.
  return Math.max(registry.idf.get(token) ?? registry.maxIdf, 0.01);
}

/** Share of `tokens`' total weight that finds a partner in `others`. */
function weightedCoverage(
  tokens: string[],
  others: string[],
  registry: Registry,
): number {
  if (tokens.length === 0) return 0;

  let total = 0;
  let matched = 0;

  for (const token of tokens) {
    const weight = weightOf(token, registry);
    total += weight;
    if (others.some((other) => tokensAgree(token, other))) matched += weight;
  }

  return total > 0 ? matched / total : 0;
}

/**
 * Whether every reasonably distinctive word in `tokens` finds a partner in `others`.
 *
 * Weighted averages let a single wrong word hide behind several right ones:
 * "ΟΡΓΑΝΙΣΜΟΣ ΛΙΜΕΝΟΣ ΗΡΑΚΛΕΙΟΥ" and "ΟΡΓΑΝΙΣΜΟΣ ΛΙΜΕΝΟΣ ΚΕΡΚΥΡΑΣ" agree on two
 * words out of three and score respectably while being different port authorities.
 * A hard veto is the right shape for this: boilerplate may go unmatched, an
 * identifying word may not.
 *
 * The cutoff is a fraction of the maximum possible weight, so it adapts to the size
 * of the register instead of being a magic number. It sits low enough to catch city
 * names — which are individually common across the register, and so score modestly
 * — while still tolerating the "ΑΝΩΝΥΜΗ ΕΤΑΙΡΕΙΑ / Ο.Τ.Α. / ΜΟΝΟΜΕΤΟΧΙΚΗ" filler
 * that the two registers add and drop freely.
 *
 * Tuned against the full ΗΡΜΣ register (scripts/check-khmdhs-matching.mjs), scoring
 * by how many ΚΗΜΔΗΣ keys end up claimed by more than one ΗΡΜΣ name — every such
 * collision is at least one wrong attribution:
 *
 *   ratio  matched  colliding keys
 *   0.30       870  1
 *   0.40       871  1   ← chosen
 *   0.45       894  4   (a port fund and an ΝΠΔΔ absorbed into their municipality)
 *
 * 0.45 buys 23 more matches at the cost of attributing subsidiaries' procurement to
 * their parent, which is the exact failure this module is built to avoid.
 */
const DISTINCTIVE_WEIGHT_RATIO = 0.4;

function noDistinctiveTokenUnmatched(
  tokens: string[],
  others: string[],
  registry: Registry,
): boolean {
  const floor = registry.maxIdf * DISTINCTIVE_WEIGHT_RATIO;

  for (const token of tokens) {
    if (weightOf(token, registry) < floor) continue;
    if (!others.some((other) => tokensAgree(token, other))) return false;
  }

  return true;
}

/**
 * Best ΚΗΜΔΗΣ organization for an ΗΡΜΣ name, or null when nothing is convincing.
 *
 * Agreement is scored in both directions and combined harmonically, so a candidate
 * has to account for the query's distinctive words *and* have its own accounted
 * for. One direction alone is not enough: "ΔΗΜΟΣ ΑΘΗΝΑΙΩΝ" is fully covered by
 * "ΔΗΜΟΣ ΑΘΗΝΑΙΩΝ ΕΠΙΧΕΙΡΗΣΗ ΡΑΔΙΟΦΩΝΙΑΣ" — a different legal entity — and only the
 * reverse direction reveals the mismatch.
 */
export function matchOrganization(
  organizationName: string,
  registry: Registry,
): KhmdhsMatch | null {
  if (!organizationName) return null;

  const normalized = normalizeGreekText(organizationName);
  if (!normalized) return null;

  const exact = registry.entries.find(
    (entry) => entry.normalized === normalized,
  );
  if (exact) return { organization: strip(exact), confidence: "exact", score: 1 };

  const queryTokens = tokenize(organizationName);
  if (queryTokens.length === 0) return null;

  let best: { entry: RegistryEntry; score: number } | null = null;

  for (const entry of registry.entries) {
    if (entry.tokens.length === 0) continue;

    const recall = weightedCoverage(queryTokens, entry.tokens, registry);
    // Cheap early exit: the harmonic mean cannot exceed either input, so a poor
    // recall rules the candidate out before the second pass is worth running.
    if (recall < MIN_SCORE) continue;

    const precision = weightedCoverage(entry.tokens, queryTokens, registry);
    if (precision < MIN_SCORE) continue;

    if (
      !noDistinctiveTokenUnmatched(queryTokens, entry.tokens, registry) ||
      !noDistinctiveTokenUnmatched(entry.tokens, queryTokens, registry)
    ) {
      continue;
    }

    const score = (2 * recall * precision) / (recall + precision);
    if (!best || score > best.score) best = { entry, score };
  }

  if (!best || best.score < MIN_SCORE) return null;

  return {
    organization: strip(best.entry),
    confidence: "partial",
    score: best.score,
  };
}

function strip(entry: RegistryEntry): KhmdhsOrganization {
  return { key: entry.key, name: entry.name, actCount: entry.actCount };
}
