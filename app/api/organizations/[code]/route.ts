// app/api/organizations/[code]/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import path from "path";
import { promises as fs } from "fs";

const BASE_URL = "https://hrms.gov.gr/api";

// --- HELPER FUNCTIONS ---

// Updated Normalize function (Same as in search route)
const normalizeText = (text: string | undefined) => {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\*/g, "") // Remove asterisks (*)
    .replace(/\s+/g, "") // Remove ALL spaces
    .toUpperCase();
};

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

    try {
      // Ensure consistency with the search route path (data/elstat.xlsx)
      const filePath = path.join(process.cwd(), "elstat.xlsx");

      try {
        await fs.access(filePath);
        const fileBuffer = await fs.readFile(filePath);
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });

        // Updated Sectors with correct Greek labels
        const sectors = [
          {
            sheet: "S1311",
            label: "Κεντρική Κυβέρνηση",
            code: "S1311",
          },
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

        // Loop through sectors to find the entity
        for (const sector of sectors) {
          const worksheet = workbook.Sheets[sector.sheet];
          if (worksheet) {
            const rows = XLSX.utils.sheet_to_json(worksheet, {
              range: 2,
            }) as any[];

            const found = rows.find((row: any) => {
              const excelName = normalizeText(row["ΕΠΩΝΥΜΙΑ ΦΟΡΕΑ"]);
              return excelName === searchName;
            });


            if (found) {
              elstatInfo = {
                code: sector.code, // Use the explicit code (e.g. S1311-HOSP)
                description: sector.label,
                sheetName: sector.sheet,
              };
              break; // Stop once found
            }
          }
        }
      } catch (fileError) {
        console.warn("Excel file not found or could not be read:", fileError);
      }
    } catch (err) {
      console.error("Error processing Excel logic:", err);
    }

    data.data.elstat = elstatInfo;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get organization error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
