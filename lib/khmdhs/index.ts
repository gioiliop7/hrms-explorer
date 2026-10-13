// lib/khmdhs/index.ts
//
// Public entry point for the ΚΗΜΔΗΣ integration (Κεντρικό Ηλεκτρονικό Μητρώο
// Δημοσίων Συμβάσεων). Server-side only — see client.ts.

import { unstable_cache } from "next/cache";

import { fetchAllActs } from "./client";
import { normalizeAct } from "./normalize";
import { findKhmdhsOrganization } from "./organizations";
import { normalizeGreekText } from "@/lib/text";
import {
  ACT_TYPES,
  type KhmdhsAct,
  type KhmdhsActType,
  type KhmdhsActTypeSummary,
  type KhmdhsOrganizationData,
} from "./types";

export * from "./types";
export {
  findKhmdhsOrganization,
  registryHarvestedAt,
  registrySize,
} from "./organizations";
export { attachmentUrl, chunkDateRange, KhmdhsError } from "./client";

/** ΚΗΜΔΗΣ refreshes published acts once a day, so a long cache costs no freshness. */
const CACHE_SECONDS = 60 * 60 * 6;

export interface GetKhmdhsDataOptions {
  /** How far back to look. Ignored when dateFrom/dateTo are given. */
  months?: number;
  /** Explicit start of the period (YYYY-MM-DD). */
  dateFrom?: string;
  /** Explicit end of the period (YYYY-MM-DD). */
  dateTo?: string;
  /** Which act types to query. Defaults to all five. */
  actTypes?: KhmdhsActType[];
  /** Pages (50 acts each) to pull per type per window. Bounds the request budget. */
  maxPagesPerType?: number;
  /** How many recent acts to keep for display. */
  recentLimit?: number;
}

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

/** Cache tag for one organization, so a refresh can drop every period at once. */
export function khmdhsCacheTag(organizationName: string): string {
  return `khmdhs:${normalizeGreekText(organizationName)}`;
}

/**
 * Ranks CPV codes by the value attached to them.
 *
 * Cost sits on the line item, not the CPV, and one line item can carry several
 * CPVs — the item's cost is attributed to each of them rather than split, since
 * the question this answers is "how much did they spend on things tagged X".
 */
function aggregateCpvs(acts: KhmdhsAct[]) {
  const totals = new Map<
    string,
    { code: string; label: string; count: number; totalCost: number }
  >();

  for (const act of acts) {
    if (act.cancelled) continue;

    for (const detail of act.objectDetails) {
      const cost = detail.costWithoutVAT ?? 0;
      for (const cpv of detail.cpvs) {
        const entry = totals.get(cpv.code) ?? {
          code: cpv.code,
          label: cpv.label,
          count: 0,
          totalCost: 0,
        };
        entry.count += 1;
        entry.totalCost += cost;
        totals.set(cpv.code, entry);
      }
    }
  }

  return [...totals.values()]
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 15);
}

/**
 * Ranks contractors by contracted value.
 *
 * Only awards and contracts name a contractor, and an act with several members
 * (a consortium) has no per-member breakdown, so the act's value is attributed
 * to each member.
 */
function aggregateContractors(acts: KhmdhsAct[]) {
  const totals = new Map<
    string,
    { name: string; vatNumber: string | null; count: number; totalCost: number }
  >();

  for (const act of acts) {
    if (act.cancelled || act.contractors.length === 0) continue;
    const cost = act.totalCostWithoutVAT ?? 0;

    for (const contractor of act.contractors) {
      // ΑΦΜ identifies a company far more reliably than its name, which appears
      // with different spellings, suffixes and casing across acts.
      const id = contractor.vatNumber ?? contractor.name;
      const entry = totals.get(id) ?? {
        name: contractor.name,
        vatNumber: contractor.vatNumber,
        count: 0,
        totalCost: 0,
      };
      entry.count += 1;
      entry.totalCost += cost;
      totals.set(id, entry);
    }
  }

  return [...totals.values()]
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 15);
}

/**
 * Fetches and aggregates an organization's ΚΗΜΔΗΣ presence, or null when the
 * organization has no entry in the harvested registry.
 *
 * Note on totals: the five act types are stages of the same procurement, not
 * separate spending. A request becomes a notice, then an award, then a contract,
 * then several payments — so summing `totalCostWithoutVAT` across types counts the
 * same euros up to five times. Summaries are therefore kept strictly per type, and
 * any single "spend" figure shown to a user should come from contracts alone.
 */
async function getKhmdhsDataUncached(
  organizationName: string,
  options: GetKhmdhsDataOptions = {},
): Promise<KhmdhsOrganizationData | null> {
  // One page per type per window keeps a card render at ~15 requests. The client
  // spaces request starts to stay clear of ΚΗΜΔΗΣ's burst limit, so each extra page
  // costs real wall-clock time; counts stay exact regardless (see the summary type),
  // and the CPV/contractor rankings degrade to "over the acts we saw" rather than
  // becoming wrong. Callers that need completeness raise this and wait.
  const {
    months = 12,
    actTypes = ACT_TYPES,
    maxPagesPerType = 1,
    recentLimit = 20,
  } = options;

  const match = findKhmdhsOrganization(organizationName);
  if (!match) return null;

  const dateFrom = options.dateFrom ?? isoDaysAgo(Math.round(months * 30.44));
  const dateTo = options.dateTo ?? new Date().toISOString().slice(0, 10);
  const filters = {
    organizations: [Number(match.organization.key)],
    dateFrom,
    dateTo,
  };

  const results = await Promise.all(
    actTypes.map(async (actType) => {
      try {
        const { acts, totalElements, truncated } = await fetchAllActs(
          actType,
          filters,
          { maxPages: maxPagesPerType },
        );
        return {
          actType,
          acts: acts.map((raw) => normalizeAct(actType, raw)),
          totalElements,
          truncated,
          failed: false,
        };
      } catch (error) {
        // One flaky act type should not blank out the whole card.
        console.error(`ΚΗΜΔΗΣ ${actType} failed:`, error);
        return {
          actType,
          acts: [] as KhmdhsAct[],
          totalElements: 0,
          truncated: false,
          failed: true,
        };
      }
    }),
  );

  // Note we do *not* return null here when everything failed: null is reserved for
  // "this organization is not in the ΚΗΜΔΗΣ register", and reporting a rate-limited
  // lookup as an absent organization would be a lie the UI cannot see through.
  const fetchFailed = results.every((result) => result.failed);

  const summaries: KhmdhsActTypeSummary[] = results.map((result) => ({
    actType: result.actType,
    // `totalElements` is exact even when only some pages were pulled, so counts
    // stay right regardless of maxPagesPerType — unlike the sums beside them.
    count: result.totalElements,
    sampledCount: result.acts.length,
    complete: !result.failed && result.acts.length >= result.totalElements,
    sampledCostWithoutVAT: sum(result.acts, (a) => a.totalCostWithoutVAT),
    sampledCostWithVAT: sum(result.acts, (a) => a.totalCostWithVAT),
    cancelledCount: result.acts.filter((a) => a.cancelled).length,
  }));

  const allActs = results.flatMap((result) => result.acts);

  const recentActs = [...allActs]
    .sort((a, b) => (b.signedDate ?? "").localeCompare(a.signedDate ?? ""))
    .slice(0, recentLimit);

  return {
    organization: match.organization,
    matchConfidence: match.confidence,
    dateFrom,
    dateTo,
    summaries,
    recentActs,
    topCpvs: aggregateCpvs(allActs),
    topContractors: aggregateContractors(allActs),
    truncated: results.some((result) => result.truncated),
    fetchFailed,
  };
}

/**
 * Fetches and aggregates an organization's ΚΗΜΔΗΣ presence, cached.
 *
 * Caching sits here, around the whole aggregation, rather than relying only on the
 * per-request `revalidate` in client.ts. Measured on a ministry: 62s cold, 3.3s on
 * a warm fetch cache — because a warm run still walks fifteen calls through the
 * client's request pacing before any of them reach the cache. One entry for the
 * finished result skips all of that, and gives the refresh button a single tag to
 * invalidate.
 *
 * The period is part of the cache key, so changing the date filter genuinely
 * re-queries ΚΗΜΔΗΣ for that range rather than reusing the previous one's answer.
 */
export async function getKhmdhsData(
  organizationName: string,
  options: GetKhmdhsDataOptions = {},
): Promise<KhmdhsOrganizationData | null> {
  const cached = unstable_cache(
    () => getKhmdhsDataUncached(organizationName, options),
    [
      "khmdhs-data",
      organizationName,
      String(options.months ?? 12),
      options.dateFrom ?? "",
      options.dateTo ?? "",
      (options.actTypes ?? ACT_TYPES).join(","),
      String(options.maxPagesPerType ?? 1),
    ],
    { revalidate: CACHE_SECONDS, tags: [khmdhsCacheTag(organizationName)] },
  );

  return cached();
}

function sum(acts: KhmdhsAct[], pick: (act: KhmdhsAct) => number | null): number {
  return acts.reduce(
    (total, act) => (act.cancelled ? total : total + (pick(act) ?? 0)),
    0,
  );
}

export interface GetKhmdhsActsOptions {
  months?: number;
  dateFrom?: string;
  dateTo?: string;
  maxPages?: number;
}

/** Every act of one type for one organization — used by the CSV export. */
export async function getKhmdhsActs(
  organizationName: string,
  actType: KhmdhsActType,
  options: GetKhmdhsActsOptions = {},
): Promise<{ acts: KhmdhsAct[]; truncated: boolean } | null> {
  const { months = 12, maxPages = 20 } = options;

  const match = findKhmdhsOrganization(organizationName);
  if (!match) return null;

  const { acts, truncated } = await fetchAllActs(
    actType,
    {
      organizations: [Number(match.organization.key)],
      dateFrom: options.dateFrom ?? isoDaysAgo(Math.round(months * 30.44)),
      dateTo: options.dateTo ?? new Date().toISOString().slice(0, 10),
    },
    { maxPages },
  );

  return { acts: acts.map((raw) => normalizeAct(actType, raw)), truncated };
}
