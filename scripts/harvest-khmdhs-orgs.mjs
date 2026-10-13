// scripts/harvest-khmdhs-orgs.mjs
//
// Builds data/khmdhs-organizations.json — the ΚΗΜΔΗΣ contracting-authority registry.
//
// ΚΗΜΔΗΣ exposes no organization lookup endpoint (every plausible GET path returns
// the generic 500 catch-all), and its search filter takes a numeric organization key
// rather than a name or ΑΦΜ. The only way to learn which keys exist is to read them
// off the acts themselves: sweep the open-data search with no organization filter and
// collect the distinct `organization` objects that come back.
//
// Coverage comes from sampling days spread across a long window rather than a
// consecutive block, so authorities that only publish occasionally still show up.
// The script prints how many new organizations each sampled day contributed — when
// that number flattens out, the sweep has saturated and can be stopped.
//
// Usage:
//   node scripts/harvest-khmdhs-orgs.mjs [--days 30] [--window 400] [--max-pages 60]

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://cerpp.eprocurement.gov.gr/khmdhs-opendata";

// ΚΗΜΔΗΣ rejects the default fetch/curl agent with 429 regardless of actual volume.
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// The documented ceiling is 350 requests/minute. Stay under it with room to spare:
// a 429 costs a backoff that is slower than just pacing correctly in the first place.
const CONCURRENCY = 4;
const MIN_REQUEST_INTERVAL_MS = 220; // ~270 req/min

// `request` acts (πρωτογενή αιτήματα) are by far the highest-volume type — roughly
// 2.700 per day across all authorities — which makes them the densest source of
// distinct organization keys per request spent.
const SWEEP_ENDPOINT = "request";

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag, fallback) => {
    const i = args.indexOf(flag);
    return i !== -1 && args[i + 1] ? Number(args[i + 1]) : fallback;
  };
  return {
    days: get("--days", 30),
    window: get("--window", 400),
    maxPages: get("--max-pages", 60),
  };
}

let lastRequestAt = 0;

async function paced() {
  const wait = lastRequestAt + MIN_REQUEST_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

async function search(endpoint, body, page, attempt = 0) {
  await paced();

  let response;
  try {
    response = await fetch(`${BASE_URL}/${endpoint}?page=${page}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (attempt >= 4) throw error;
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    return search(endpoint, body, page, attempt + 1);
  }

  if (response.status === 429) {
    if (attempt >= 6) throw new Error("Rate limited repeatedly; giving up.");
    await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
    return search(endpoint, body, page, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`${endpoint} page ${page} returned ${response.status}`);
  }

  return response.json();
}

/** Dates spread evenly across the window, newest first. */
function sampleDates(count, windowDays) {
  const step = Math.max(1, Math.floor(windowDays / count));
  const dates = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1 - i * step);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function collect(registry, page) {
  let added = 0;
  for (const act of page.content ?? []) {
    // Both the authority itself and the operating unit / signer carry organization
    // keys, but only `organization` is what the `organizations` search filter matches.
    const org = act.organization;
    if (!org?.key || !org?.value) continue;

    const existing = registry.get(org.key);
    if (existing) {
      existing.actCount += 1;
      continue;
    }
    registry.set(org.key, { key: org.key, name: org.value.trim(), actCount: 1 });
    added += 1;
  }
  return added;
}

/** Runs `worker` over `items` with a bounded number of in-flight tasks. */
async function pool(items, limit, worker) {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      await worker(queue.shift());
    }
  });
  await Promise.all(runners);
}

async function harvestDay(registry, date, maxPages) {
  const body = { dateFrom: date, dateTo: date };

  const first = await search(SWEEP_ENDPOINT, body, 0);
  let added = collect(registry, first);

  const totalPages = Math.min(first.totalPages ?? 1, maxPages);
  const rest = Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => i + 1);

  await pool(rest, CONCURRENCY, async (page) => {
    try {
      added += collect(registry, await search(SWEEP_ENDPOINT, body, page));
    } catch (error) {
      console.warn(`  ! ${date} page ${page}: ${error.message}`);
    }
  });

  return { added, totalPages: first.totalPages ?? 1, acts: first.totalElements ?? 0 };
}

async function main() {
  const { days, window, maxPages } = parseArgs();
  const dates = sampleDates(days, window);
  const registry = new Map();

  console.log(
    `Sweeping ${days} days sampled across ${window} days (max ${maxPages} pages/day)\n`,
  );

  const outPath = path.join(process.cwd(), "data", "khmdhs-organizations.json");
  await mkdir(path.dirname(outPath), { recursive: true });

  for (const [index, date] of dates.entries()) {
    const before = registry.size;
    let result;
    try {
      result = await harvestDay(registry, date, maxPages);
    } catch (error) {
      console.warn(`${date}: failed (${error.message})`);
      continue;
    }

    console.log(
      `${date}  acts=${String(result.acts).padStart(5)}  ` +
        `pages=${String(result.totalPages).padStart(3)}  ` +
        `+${String(registry.size - before).padStart(4)} new  ` +
        `total=${registry.size}`,
    );

    // Checkpoint as we go so an interrupted sweep still leaves a usable registry.
    if (index % 5 === 4) await write(outPath, registry);
  }

  await write(outPath, registry);
  console.log(`\nWrote ${registry.size} organizations to ${outPath}`);
}

async function write(outPath, registry) {
  const organizations = [...registry.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "el"),
  );
  await writeFile(
    outPath,
    JSON.stringify({ harvestedAt: new Date().toISOString(), organizations }, null, 1),
    "utf8",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
