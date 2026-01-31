// app/api/organizations/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import path from "path";
import { promises as fs } from "fs";

const BASE_URL = "https://hrms.gov.gr/api";

// --- HELPER FUNCTIONS ---

// Updated Normalize function
// 1. Removes accents
// 2. Removes asterisks (*) used in Excel for ministries
// 3. Removes ALL whitespace to handle formatted hyphens (e.g. " - " vs "-")
const normalizeText = (text: string | undefined) => {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\*/g, "") // Remove asterisks (*)
    .replace(/\s+/g, "") // Remove ALL spaces (start, end, and middle)
    .toUpperCase();
};

// Global cache
let globalElstatMap: Map<string, any> | null = null;

// Function to load Excel and create a lookup Map
async function getElstatLookupMap() {
  if (globalElstatMap) return globalElstatMap;

  const lookupMap = new Map<string, any>();

  try {
    // Make sure 'elstat.xlsx' is the correct name in your data folder
    const filePath = path.join(process.cwd(), "elstat.xlsx");

    try {
      await fs.access(filePath);
    } catch {
      console.warn("Excel file not found at:", filePath);
      return lookupMap;
    }

    const fileBuffer = await fs.readFile(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });

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

    sectors.forEach((sector) => {
      const worksheet = workbook.Sheets[sector.sheet];
      if (worksheet) {
        const rows = XLSX.utils.sheet_to_json(worksheet, { range: 2 }) as any[];

        rows.forEach((row: any) => {
          const name = row["ΕΠΩΝΥΜΙΑ ΦΟΡΕΑ"];
          if (name) {
            // Apply strict normalization to Excel Data
            const normalizedName = normalizeText(name);
            lookupMap.set(normalizedName, {
              code: sector.code,
              description: sector.label,
              sheetName: sector.sheet,
            });
          }
        });
      }
    });

    globalElstatMap = lookupMap;
    return lookupMap;
  } catch (error) {
    console.error("Error loading Excel map:", error);
    return new Map();
  }
}

// --- MAIN ROUTE HANDLER ---

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BASE_URL}/public/organizations/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch organizations" },
        { status: response.status }
      );
    }

    const responseData = await response.json();

    // Load Excel Map
    const elstatMap = await getElstatLookupMap();

    const enrichOrganization = (org: any) => {
      if (!org || !org.preferredLabel) return org;

      // Apply same strict normalization to API Data
      const searchKey = normalizeText(org.preferredLabel);

      // Debug logs to verify matching (check your server console)
      // console.log(`Searching for: [${searchKey}]`);

      const sectorInfo = elstatMap.get(searchKey);

      return {
        ...org,
        elstat: sectorInfo || null,
      };
    };

    if (responseData.data && Array.isArray(responseData.data)) {
      responseData.data = responseData.data.map(enrichOrganization);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
