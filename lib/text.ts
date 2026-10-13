// lib/text.ts
//
// Text normalization for cross-registry name matching. Deliberately dependency-free
// so it can be loaded by plain Node (scripts, checks) as well as by the app.

/**
 * Strips accents, case and punctuation so organization names coming from different
 * registries compare equal. Every registry spells the same authority differently
 * ("ΥΠΟΥΡΓΕΙΟ ΕΣΩΤΕΡΙΚΩΝ" / "Υπουργείο Εσωτερικών" / "ΥΠΟΥΡΓΕΙΟ  ΕΣΩΤΕΡΙΚΩΝ."),
 * and matching is the only way to join them.
 *
 * Note: lib/diavgeia.ts and lib/opengov.ts each carry a private copy of this;
 * they predate this helper and are left alone here.
 */
export function normalizeGreekText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9α-ω]/g, "");
}

/** Same normalization as normalizeGreekText, but keeping word boundaries. */
export function normalizeGreekTokens(text: string): string[] {
  if (!text) return [];
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9α-ω]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}
