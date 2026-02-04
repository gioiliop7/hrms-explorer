import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

/**
 * Interface defining the structure of GSIS data
 */
export interface GsisData {
  aahtCode: string;
  aahtAfm: string;
  aahtName: string;
  authority: string;
  authorityType: string;
  supervisor: string;
  ministry: string;
  clearingServiceCode: string;
  clearingService: string;
  aahtCodeStartDate: string;
  aahtCodeEndDate: string;
  clearingServiceConnectionStartDate: string;
  clearingServiceConnectionEndDate: string;
}

/**
 * Fetches GSIS data for a given organization name
 * @param organizationName - The name to search for
 * @returns Array of matching GSIS records or null if none found
 */
export async function getGsisData(
  organizationName: string
): Promise<GsisData[] | null> {
  if (!organizationName) return null;

  try {
    // Normalize query: Convert to lowercase and remove ALL spaces
    const normalizedQuery = organizationName.toLowerCase().replace(/\s+/g, "");

    // Resolve the path to the XLSX file
    const filePath = path.join(process.cwd(), "gsis.xlsx");

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn("GSIS data file (gsis.xlsx) not found on server.");
      return null;
    }

    // Read the file as a Buffer
    const fileBuffer = await fs.promises.readFile(filePath);

    // Parse the workbook using the XLSX library
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON array of arrays (header: 1)
    const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, {
      header: 1,
    });

    // Remove header row
    const dataRows = jsonData.slice(1);

    const results: GsisData[] = [];

    // Iterate through rows and filter
    for (const row of dataRows) {
      if (!row || row.length === 0) continue;

      // Extract raw values
      const aahtName = (row[2] || "").toString();
      const authority = (row[3] || "").toString();

      // Normalize data for comparison
      const normalizedAahtName = aahtName.toLowerCase().replace(/\s+/g, "");
      const normalizedAuthority = authority.toLowerCase().replace(/\s+/g, "");

      // Check match on normalized strings
      if (
        normalizedAahtName.includes(normalizedQuery) ||
        normalizedAuthority.includes(normalizedQuery)
      ) {
        const entry: GsisData = {
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

        results.push(entry);
      }
    }

    return results.length > 0 ? results : null;
  } catch (error) {
    console.error("Error fetching GSIS data:", error);
    return null;
  }
}