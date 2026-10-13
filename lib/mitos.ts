// lib/mitos.ts
//
// Μίτος (Εθνικό Μητρώο Διαδικασιών) has no public API, so the organization page is
// scraped. That makes it the most fragile source in the app: a markup change on
// mitos.gov.gr breaks it silently, which is why every failure here returns empty
// rather than throwing, and why callers treat a null count as "unknown" rather
// than "none".

import * as cheerio from "cheerio";

export interface MitosProcedure {
  id: string;
  title: string;
  link: string | null;
}

const ORG_PAGE =
  "https://mitos.gov.gr/index.php/%CE%95%CE%B9%CE%B4%CE%B9%CE%BA%CF%8C:EMDViewOrg";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Procedures a body owns, as listed on its Μίτος page.
 *
 * `organizationCode` is the ΗΡΜΣ code — Μίτος keys its pages by the same value.
 * Returns null when the page could not be read at all, so an outage is
 * distinguishable from a body that genuinely registers no procedures.
 */
export async function getMitosProcedures(
  organizationCode: string,
): Promise<MitosProcedure[] | null> {
  if (!organizationCode) return null;

  try {
    const response = await fetch(
      `${ORG_PAGE}?org=${encodeURIComponent(organizationCode)}`,
      {
        headers: { "User-Agent": USER_AGENT },
        next: { revalidate: 3600 },
      },
    );

    if (!response.ok) return null;

    const $ = cheerio.load(await response.text());
    const procedures: MitosProcedure[] = [];

    // "#tab-owner" is the panel listing procedures the body owns, as opposed to
    // ones it merely takes part in.
    $("#tab-owner table tbody tr").each((_, element) => {
      const cells = $(element).find("td");
      if (cells.length < 2) return;

      const id = $(cells[0]).text().trim();
      const link = $(cells[1]).find("a");
      const title = link.text().trim();
      const href = link.attr("href");

      if (id && title) {
        procedures.push({
          id,
          title,
          link: href ? `https://mitos.gov.gr${href}` : null,
        });
      }
    });

    return procedures;
  } catch (error) {
    console.error(`Μίτος scraping failed for ${organizationCode}:`, error);
    return null;
  }
}
