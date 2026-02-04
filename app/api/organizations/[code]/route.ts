import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import path from "path";
import { promises as fs } from "fs";
import { getGsisData } from "@/lib/gsisHelper";
import * as cheerio from "cheerio";

const BASE_URL = "https://hrms.gov.gr/api";

interface MitosProcess {
  id: string;
  title: string;
  link: string | null;
}

const normalizeText = (text: string | undefined) => {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\*/g, "")
    .replace(/\s+/g, "")
    .toUpperCase();
};

// Helper function για το scraping του Μίτος
async function getMitosProcedures(orgId: string): Promise<MitosProcess[]> {
  const url = `https://mitos.gov.gr/index.php/%CE%95%CE%B9%CE%B4%CE%B9%CE%BA%CF%8C:EMDViewOrg?org=${orgId}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return [];

    const html = await response.text();
    const $ = cheerio.load(html);
    const processes: MitosProcess[] = [];

    $("#tab-owner table tbody tr").each((_, element) => {
      const cells = $(element).find("td");
      if (cells.length >= 2) {
        const id = $(cells[0]).text().trim();
        const linkElem = $(cells[1]).find("a");
        const title = linkElem.text().trim();
        const href = linkElem.attr("href");

        if (id && title) {
          processes.push({
            id,
            title,
            link: href ? `${href}` : null,
          });
        }
      }
    });

    return processes;
  } catch (err) {
    console.error("Mitos scraping error:", err);
    return [];
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    // 1. Fetch organization from API
    const response = await fetch(`${BASE_URL}/public/organizations/${code}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch organization" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 2. Normalize the API name for comparison
    const searchName = normalizeText(data.data.preferredLabel);

    let elstatInfo = null;

    // --- ELSTAT LOGIC ---
    try {
      const filePath = path.join(process.cwd(), "elstat.xlsx");
      
      await fs.access(filePath);
      const fileBuffer = await fs.readFile(filePath);
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });

      const sectors = [
        { sheet: "S1311", label: "Κεντρική Κυβέρνηση", code: "S1311" },
        {
          sheet: "S1311 ΔΗΜΟΣΙΑ ΝΟΣΟΚΟΜΕΙΑ",
          label: "Δημόσια Νοσοκομεία",
          code: "S1311-HOSP",
        },
        {
          sheet: "S1313",
          label: "Οργανισμοί Τοπικής Αυτοδιοίκησης (ΟΤΑ)",
          code: "S1313",
        },
        {
          sheet: "S1314",
          label: "Οργανισμοί Κοινωνικής Ασφάλισης (ΟΚΑ)",
          code: "S1314",
        },
      ];

      for (const sector of sectors) {
        const worksheet = workbook.Sheets[sector.sheet];
        if (worksheet) {
          const rows = XLSX.utils.sheet_to_json(worksheet, {
            range: 2,
          }) as any[];
          const found = rows.find(
            (row: any) => normalizeText(row["ΕΠΩΝΥΜΙΑ ΦΟΡΕΑ"]) === searchName
          );

          if (found) {
            elstatInfo = {
              code: sector.code,
              description: sector.label,
              sheetName: sector.sheet,
            };
            break;
          }
        }
      }
    } catch (err) {
      console.warn("Excel processing skipped:", err);
    }

    const [gsisInfo, mitosProcedures] = await Promise.all([
      getGsisData(data.data.preferredLabel),
      getMitosProcedures(code),
    ]);

    data.data.elstat = elstatInfo;
    data.data.gsis = gsisInfo;
    data.data.mitos = {
      total: mitosProcedures.length,
      procedures: mitosProcedures,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get organization error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
