// src/lib/actions.ts
"use server";

import path from "path";
import { promises as fs } from "fs";
import {
  getDiavgeiaData,
  getDiavgeiaDecisionCounts,
  type DiavgeiaDecisionCounts,
} from "./diavgeia";
import { getOpenGovConsultationCount, getOpenGovConsultations } from "./opengov";
import { getMitosProcedures } from "./mitos";
import { findKhmdhsOrganization } from "./khmdhs";
import { updateTag } from "next/cache";
import { getKhmdhsActs, getKhmdhsData, khmdhsCacheTag } from "./khmdhs";
import type { KhmdhsActType } from "./khmdhs";

const FILES = ["1.json", "2.json"];

let cachedData: any[] | null = null;

async function getCachedData() {
  if (cachedData) return cachedData;

  const dataDirectory = path.join(process.cwd());
  let allItems: any[] = [];

  for (const fileName of FILES) {
    try {
      const filePath = path.join(dataDirectory, fileName);
      const fileContents = await fs.readFile(filePath, "utf8");
      const json = JSON.parse(fileContents);
      if (json.data && Array.isArray(json.data)) {
        allItems = [...allItems, ...json.data];
      }
    } catch (error) {
      console.error(`Error reading ${fileName}:`, error);
    }
  }

  cachedData = allItems;
  return allItems;
}

export async function getDescriptionById(id: number | string) {
  const data = await getCachedData();
  const searchId = Number(id);
  const foundItem = data.find((item: any) => item.id === searchId);
  return foundItem ? foundItem.description : null;
}

export async function fetchDiavgeiaAction(name: string) {
  try {
    const data = await getDiavgeiaData(name);
    return data;
  } catch (error) {
    console.error("Failed to fetch Diavgeia data via Server Action", error);
    return null;
  }
}

export async function fetchOpenGovAction(name: string) {
  try {
    const data = await getOpenGovConsultations(name);
    return data;
  } catch (error) {
    console.error("Failed to fetch OpenGov data via Server Action", error);
    return null;
  }
}

/** The period a ΚΗΜΔΗΣ lookup covers: a rolling window, or explicit dates. */
export interface KhmdhsPeriod {
  months?: number;
  dateFrom?: string;
  dateTo?: string;
}

/** ΚΗΜΔΗΣ summary for an organization's card. Null when it has no ΚΗΜΔΗΣ entry. */
export async function fetchKhmdhsAction(
  name: string,
  period: KhmdhsPeriod = {},
) {
  try {
    return await getKhmdhsData(name, period);
  } catch (error) {
    console.error("Failed to fetch ΚΗΜΔΗΣ data via Server Action", error);
    return null;
  }
}

/**
 * Drops every cached ΚΗΜΔΗΣ result for this organization, then fetches again.
 *
 * The period already forms part of the cache key, so simply changing the dates
 * queries ΚΗΜΔΗΣ afresh. This is for the other case: the user wants today's data
 * for a period they have already looked at, or a rate-limited attempt cached a
 * failure they want to retry.
 */
export async function refreshKhmdhsAction(
  name: string,
  period: KhmdhsPeriod = {},
) {
  try {
    // updateTag rather than revalidateTag: it expires the entry outright instead of
    // serving stale-while-revalidate, so the read below in this same action returns
    // the fresh data the user just asked for rather than the copy they rejected.
    updateTag(khmdhsCacheTag(name));
    return await getKhmdhsData(name, period);
  } catch (error) {
    console.error("Failed to refresh ΚΗΜΔΗΣ data via Server Action", error);
    return null;
  }
}

/** Figures from the registries other than ΚΗΜΔΗΣ, for the comparison view. */
export interface OrganizationExtraStats {
  diavgeia: DiavgeiaDecisionCounts | null;
  consultations: { count: number; siteKnown: boolean };
  /** Procedures registered in Μίτος, or null when the lookup failed. */
  mitosProcedures: number | null;
}

/**
 * Διαύγεια, OpenGov and Μίτος figures for one organization.
 *
 * Gathered in one action because each is a single cheap call, and the comparison
 * needs all three per organization; `allSettled` keeps one dead source from
 * blanking the other two.
 *
 * The Διαύγεια UID comes from the ΚΗΜΔΗΣ match when there is one — the two
 * registries use the same organization identifier — and falls back to Διαύγεια's
 * own name search otherwise.
 */
export async function fetchOrganizationExtraStatsAction(
  name: string,
  organizationCode: string,
  years: number[],
): Promise<OrganizationExtraStats> {
  const resolveUid = async (): Promise<string | null> => {
    const khmdhs = findKhmdhsOrganization(name);
    if (khmdhs) return khmdhs.organization.key;
    const diavgeia = await getDiavgeiaData(name);
    return diavgeia?.uid || null;
  };

  const [diavgeiaResult, consultationsResult, mitosResult] =
    await Promise.allSettled([
      resolveUid().then((uid) =>
        uid ? getDiavgeiaDecisionCounts(uid, years) : null,
      ),
      getOpenGovConsultationCount(name),
      getMitosProcedures(organizationCode),
    ]);

  return {
    diavgeia:
      diavgeiaResult.status === "fulfilled" ? diavgeiaResult.value : null,
    consultations:
      consultationsResult.status === "fulfilled"
        ? consultationsResult.value
        : { count: 0, siteKnown: false },
    mitosProcedures:
      mitosResult.status === "fulfilled" && mitosResult.value !== null
        ? mitosResult.value.length
        : null,
  };
}

/**
 * Every act of one type, for the CSV export.
 *
 * Separate from fetchKhmdhsAction because it walks far more pages: the card is
 * rendered on every organization selection and has to stay quick, while an export
 * is a deliberate click and can afford to be thorough.
 */
export async function fetchKhmdhsActsAction(
  name: string,
  actType: KhmdhsActType,
  period: KhmdhsPeriod = {},
) {
  try {
    return await getKhmdhsActs(name, actType, { ...period, maxPages: 20 });
  } catch (error) {
    console.error("Failed to fetch ΚΗΜΔΗΣ acts via Server Action", error);
    return null;
  }
}