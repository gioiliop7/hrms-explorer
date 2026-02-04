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

// Global caches
let globalElstatMap: Map<string, any> | null = null;
let globalGsisMap: Map<string, any[]> | null = null;

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

// Function to load GSIS Excel and create a lookup Map
async function getGsisLookupMap() {
  if (globalGsisMap) return globalGsisMap;

  const lookupMap = new Map<string, any[]>();

  try {
    const filePath = path.join(process.cwd(), "gsis.xlsx");

    try {
      await fs.access(filePath);
    } catch {
      console.warn("GSIS Excel file not found at:", filePath);
      return lookupMap;
    }

    const fileBuffer = await fs.readFile(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON array of arrays (header: 1)
    const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, {
      header: 1,
    });

    // Remove header row
    const dataRows = jsonData.slice(1);

    // Build the map
    for (const row of dataRows) {
      if (!row || row.length === 0) continue;

      const aahtName = (row[2] || "").toString();
      const authority = (row[3] || "").toString();

      // Normalize for lookup (same as the search logic)
      const normalizedAahtName = aahtName.toLowerCase().replace(/\s+/g, "");
      const normalizedAuthority = authority.toLowerCase().replace(/\s+/g, "");

      const entry = {
        aahtCode: (row[0] || "").toString(),
        aahtAfm: (row[1] || "").toString(),
        aahtName: aahtName,
        authority: authority,
        authorityType: (row[4] || "").toString(),
        supervisor: (row[5] || "").toString(),
        ministry: (row[6] || "").toString(),
        clearingServiceCode: (row[7] || "").toString(),
        clearingService: (row[8] || "").toString(),
        aahtCodeStartDate: (row[9] || "").toString(),
        aahtCodeEndDate: (row[10] || "").toString(),
        clearingServiceConnectionStartDate: (row[11] || "").toString(),
        clearingServiceConnectionEndDate: (row[12] || "").toString(),
      };

      // Add to map for both aahtName and authority
      if (normalizedAahtName) {
        if (!lookupMap.has(normalizedAahtName)) {
          lookupMap.set(normalizedAahtName, []);
        }
        lookupMap.get(normalizedAahtName)!.push(entry);
      }

      if (normalizedAuthority && normalizedAuthority !== normalizedAahtName) {
        if (!lookupMap.has(normalizedAuthority)) {
          lookupMap.set(normalizedAuthority, []);
        }
        lookupMap.get(normalizedAuthority)!.push(entry);
      }
    }

    globalGsisMap = lookupMap;
    return lookupMap;
  } catch (error) {
    console.error("Error loading GSIS Excel map:", error);
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

    // Load Excel Maps (both are cached globally)
    const elstatMap = await getElstatLookupMap();
    const gsisMap = await getGsisLookupMap();

    const enrichOrganization = (org: any) => {
      if (!org || !org.preferredLabel) return org;

      // Apply same strict normalization to API Data
      const searchKey = normalizeText(org.preferredLabel);

      // Get ELSTAT info
      const sectorInfo = elstatMap.get(searchKey);

      // Get GSIS info from cached map
      const normalizedOrgName = org.preferredLabel.toLowerCase().replace(/\s+/g, "");
      let gsisInfo = gsisMap.get(normalizedOrgName) || null;

      return {
        ...org,
        elstat: sectorInfo || null,
        gsis: gsisInfo, // Array or null
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