// lib/khmdhs/overrides.ts
//
// Hand-maintained ΗΡΜΣ → ΚΗΜΔΗΣ mappings for bodies that name-matching cannot reach.
//
// Kept apart from organizations.ts, and free of imports beyond the tokenizer, so
// scripts/check-khmdhs-matching.mjs can both apply these and verify that every key
// still exists in the harvested register — a stale or mistyped key would otherwise
// fail silently, leaving the organization looking as though it has no procurement.

import { normalizeGreekText } from "../text.ts";

/**
 * Keyed by the ΗΡΜΣ label exactly as it reads, normalized on load — maintaining
 * this table means pasting a name, not hand-encoding one.
 *
 * What lands here is the two registers using genuinely different words for the same
 * body. The health regions are the clearest case: ΗΡΜΣ writes "1η Υ.ΠΕ. ΑΤΤΙΚΗΣ",
 * ΚΗΜΔΗΣ writes "ΔΥΠΕ Α' ΑΤΤΙΚΗΣ". No tokenizer turns "ΥΠΕ" into "ΔΥΠΕ", or an
 * Arabic numeral into a Greek ordinal letter.
 */
export const MANUAL_OVERRIDES: Record<string, string> = {
  "1η Υ.ΠΕ. ΑΤΤΙΚΗΣ": "99221492", // ΔΥΠΕ Α' ΑΤΤΙΚΗΣ
  "2η Υ.ΠΕ. ΠΕΙΡΑΙΩΣ ΚΑΙ ΑΙΓΑΙΟΥ": "99221499", // 2Η ΔΥΠΕ ΠΕΙΡΑΙΩΣ ΚΑΙ ΑΙΓΑΙΟΥ
  "3η Υ.ΠΕ. ΜΑΚΕΔΟΝΙΑΣ": "50048", // 3Η ΔΥΠΕ ΜΑΚΕΔΟΝΙΑΣ
  "4η Υ.ΠΕ. ΜΑΚΕΔΟΝΙΑΣ ΚΑΙ ΘΡΑΚΗΣ": "50185", // 4Η ΔΥΠΕ ΜΑΚΕΔΟΝΙΑΣ ΚΑΙ ΘΡΑΚΗΣ
  "5η Υ.ΠΕ. ΘΕΣΣΑΛΙΑΣ ΚΑΙ ΣΤΕΡΕΑΣ ΕΛΛΑΔΑΣ": "99221503",
  "6η Υ.ΠΕ. ΠΕΛΟΠΟΝΝΗΣΟΥ,ΙΟΝΙΩΝ ΝΗΣΩΝ,ΗΠΕΙΡΟΥ ΚΑΙ ΔΥΤΙΚΗΣ ΕΛΛΑΔΑΣ": "99221481",
  "7η Υ.ΠΕ. ΚΡΗΤΗΣ": "99221505", // ΔΥΠΕ ΚΡΗΤΗΣ
};

/** The same table, keyed by normalized name for lookup. */
export const OVERRIDES_BY_NORMALIZED = new Map(
  Object.entries(MANUAL_OVERRIDES).map(([name, key]) => [
    normalizeGreekText(name),
    key,
  ]),
);
