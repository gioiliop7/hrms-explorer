import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Ορισμός του σχήματος των δεδομένων μας
interface MitosProcess {
  id: string;
  title: string;
  link: string | null;
}

interface ApiResponse {
  orgId: string;
  total: number;
  processes: MitosProcess[];
  error?: string;
}

// Τυποποίηση των params του Next.js route
interface RouteContext {
  params: Promise<{ orgId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse | { error: string }>> {
  // Στο Next.js 15+ τα params είναι Promise
  const { orgId } = await context.params;

  const url = `https://mitos.gov.gr/index.php/%CE%95%CE%B9%CE%B4%CE%B9%CE%BA%CF%8C:EMDViewOrg?org=${orgId}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Αποτυχία σύνδεσης στον Μίτο (Status: ${response.status})` },
        { status: 502 }
      );
    }

    const html: string = await response.text();
    const $: cheerio.CheerioAPI = cheerio.load(html);
    const processes: MitosProcess[] = [];

    $("#tab-owner table tbody tr").each((_, element: any) => {
      const cells = $(element).find("td");

      if (cells.length >= 2) {
        const idCell = $(cells[0]);
        const linkCell = $(cells[1]).find("a");

        const id: string = idCell.text().trim();
        const title: string = linkCell.text().trim();
        const relativeHref: string | undefined = linkCell.attr("href");

        // Καθαρισμός και κατασκευή του link
        const fullLink: string | null = relativeHref
          ? `https://mitos.gov.gr${relativeHref}`
          : null;

        if (id && title) {
          processes.push({
            id,
            title,
            link: fullLink,
          });
        }
      }
    });

    return NextResponse.json({
      orgId,
      total: processes.length,
      processes,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Scraping error:", errorMessage);

    return NextResponse.json(
      { error: "Εσωτερικό σφάλμα κατά το scraping των δεδομένων" },
      { status: 500 }
    );
  }
}
