// lib/khmdhs/client.ts
//
// Server-side only: ΚΗΜΔΗΣ sends no CORS headers, so these calls must originate
// from the server actions in lib/actions.ts, never from a client component.

import type {
  KhmdhsActType,
  KhmdhsPage,
  KhmdhsSearchFilters,
} from "./types.ts";

const BASE_URL = "https://cerpp.eprocurement.gov.gr/khmdhs-opendata";

/**
 * ΚΗΜΔΗΣ answers 429 to the default fetch agent no matter how low the volume,
 * so a browser User-Agent is required rather than merely polite.
 */
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** ΚΗΜΔΗΣ silently clamps any range wider than this, so we chunk explicitly. */
export const MAX_RANGE_DAYS = 180;

/** Results per page, fixed by the API. */
export const PAGE_SIZE = 50;

/** Acts are refreshed upstream once every 24h, so a long cache costs nothing. */
const REVALIDATE_SECONDS = 60 * 60 * 6;

export class KhmdhsError extends Error {
  // Declared as a plain field rather than a constructor parameter property, so this
  // module still loads under Node's type-stripping (scripts/smoke-khmdhs.mjs).
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "KhmdhsError";
    this.status = status;
  }
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/**
 * Splits a date range into windows the API will accept whole.
 *
 * Left unsplit, ΚΗΜΔΗΣ quietly truncates `dateTo` to `dateFrom + 180 days` and
 * returns a successful-looking response covering only part of what was asked for —
 * which would show up as an organization that simply stopped procuring.
 */
export function chunkDateRange(
  dateFrom: string,
  dateTo: string,
): { dateFrom: string; dateTo: string }[] {
  const start = new Date(`${dateFrom}T00:00:00Z`);
  const end = new Date(`${dateTo}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new KhmdhsError(`Invalid date range: ${dateFrom} → ${dateTo}`);
  }
  if (start > end) return [];

  const chunks: { dateFrom: string; dateTo: string }[] = [];
  let cursor = start;

  while (cursor <= end) {
    // -1 so a window is inclusive of both endpoints and spans exactly MAX_RANGE_DAYS.
    const chunkEnd = addDays(cursor, MAX_RANGE_DAYS - 1);
    chunks.push({
      dateFrom: toISODate(cursor),
      dateTo: toISODate(chunkEnd > end ? end : chunkEnd),
    });
    cursor = addDays(chunkEnd, 1);
  }

  return chunks;
}

/**
 * Minimum spacing between request *starts*.
 *
 * The documented limit is 350/minute. Measured against the live API, short bursts
 * are fine — ten concurrent requests and a sustained ten per second both came back
 * clean — so this is not tuned to avoid an imminent 429. What does earn one is
 * sustained heavy use (the registry harvest, which makes thousands of calls), and
 * the 429 then persists for a while afterwards. Spacing plus the backoff below is
 * insurance against a page load landing in that state; an ordinary render makes
 * about fifteen requests and never approaches the limit.
 */
const MIN_REQUEST_INTERVAL_MS = 150;

const MAX_RETRIES = 3;

// A promise chain, so concurrent callers queue for their slot in arrival order
// instead of all reading the same stale timestamp and starting together.
let pacingChain: Promise<void> = Promise.resolve();
let lastRequestAt = 0;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function nextSlot(): Promise<void> {
  const slot = pacingChain.then(async () => {
    const wait = lastRequestAt + MIN_REQUEST_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();
  });

  pacingChain = slot.catch(() => {});
  return slot;
}

/** One page of one act type. Throws on transport or HTTP failure. */
export async function searchActs<T = Record<string, unknown>>(
  actType: KhmdhsActType,
  filters: KhmdhsSearchFilters,
  page = 0,
): Promise<KhmdhsPage<T>> {
  for (let attempt = 0; ; attempt++) {
    await nextSlot();

    const response = await fetch(`${BASE_URL}/${actType}?page=${page}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify(filters),
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (response.status === 429) {
      if (attempt >= MAX_RETRIES) {
        throw new KhmdhsError("Υπέρβαση ορίου αιτημάτων στο ΚΗΜΔΗΣ", 429);
      }
      await sleep(1000 * 2 ** attempt);
      continue;
    }

    // ΚΗΜΔΗΣ answers 404 for a filter that matches nothing rather than returning an
    // empty page — observed for act types an organization has simply never filed.
    // Treated as the empty result it is: the alternative, failing the act type,
    // would make "this authority publishes no contracts" indistinguishable from
    // "the lookup broke".
    if (response.status === 404) {
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: page,
        size: PAGE_SIZE,
        last: true,
        first: page === 0,
        empty: true,
      };
    }

    if (!response.ok) {
      throw new KhmdhsError(
        `ΚΗΜΔΗΣ ${actType} επέστρεψε ${response.status}`,
        response.status,
      );
    }

    return response.json();
  }
}

/**
 * Every act of one type in a date range, following pagination and splitting the
 * range into API-sized windows.
 *
 * `maxPages` bounds the work per window: a ministry can publish thousands of
 * payments a year, and a page-by-page walk of all of them would blow the request
 * budget for a single card render. `truncated` reports when that bound was hit.
 */
export async function fetchAllActs<T = Record<string, unknown>>(
  actType: KhmdhsActType,
  filters: KhmdhsSearchFilters,
  options: { maxPages?: number } = {},
): Promise<{ acts: T[]; totalElements: number; truncated: boolean }> {
  const { maxPages = 6 } = options;
  const windows =
    filters.dateFrom && filters.dateTo
      ? chunkDateRange(filters.dateFrom, filters.dateTo)
      : [{ dateFrom: filters.dateFrom!, dateTo: filters.dateTo! }];

  const acts: T[] = [];
  let totalElements = 0;
  let truncated = false;

  for (const window of windows) {
    const windowFilters = { ...filters, ...window };

    const first = await searchActs<T>(actType, windowFilters, 0);
    acts.push(...(first.content ?? []));
    totalElements += first.totalElements ?? 0;

    const pagesToFetch = Math.min(first.totalPages ?? 1, maxPages);
    if ((first.totalPages ?? 1) > maxPages) truncated = true;

    // Pages within a window are independent, so fetch them together. The rate
    // limit is 350/min; a handful of pages per window stays comfortably inside it.
    const rest = await Promise.all(
      Array.from({ length: Math.max(0, pagesToFetch - 1) }, (_, i) =>
        searchActs<T>(actType, windowFilters, i + 1),
      ),
    );
    for (const page of rest) acts.push(...(page.content ?? []));
  }

  return { acts, totalElements, truncated };
}

/** Public URL of an act's PDF on ΚΗΜΔΗΣ. */
export function attachmentUrl(
  actType: KhmdhsActType,
  referenceNumber: string,
): string {
  return `${BASE_URL}/${actType}/attachment/${referenceNumber}`;
}
