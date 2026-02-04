import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

/**
 * Interface defining the structure of the response object with English keys.
 */
interface AuthorityData {
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

export async function GET(request: NextRequest) {
  try {
    // 1. Get the search parameter 'name' from the URL query string
    const searchParams = request.nextUrl.searchParams;
    let nameQuery = searchParams.get("name");

    if (!nameQuery) {
      return NextResponse.json(
        { error: 'Please provide a "name" query parameter.' },
        { status: 400 }
      );
    }

    // NORMALIZE QUERY: Convert to lowercase and remove ALL spaces
    const normalizedQuery = nameQuery.toLowerCase().replace(/\s+/g, "");

    // 2. Resolve the path to the XLSX file
    // Make sure the file name matches your actual file (gsis.xlsx or AAHTList.xlsx)
    const filePath = path.join(process.cwd(), "gsis.xlsx");

    // 3. Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Data file (gsis.xlsx) not found on server." },
        { status: 500 }
      );
    }

    // 4. Read the file as a Buffer
    const fileBuffer = await fs.promises.readFile(filePath);

    // 5. Parse the workbook using the XLSX library
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON array of arrays (header: 1)
    const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, {
      header: 1,
    });

    // Remove header row
    const dataRows = jsonData.slice(1);

    const results: AuthorityData[] = [];

    // 6. Iterate through rows and filter
    for (const row of dataRows) {
      if (!row || row.length === 0) continue;

      // Extract raw values
      const aahtName = (row[2] || "").toString();
      const authority = (row[3] || "").toString();

      // NORMALIZE DATA: Convert to lowercase and remove ALL spaces for comparison
      const normalizedAahtName = aahtName.toLowerCase().replace(/\s+/g, "");
      const normalizedAuthority = authority.toLowerCase().replace(/\s+/g, "");

      // CHECK MATCH on normalized strings
      if (
        normalizedAahtName.includes(normalizedQuery) ||
        normalizedAuthority.includes(normalizedQuery)
      ) {
        // Map data to English keys (return the original formatted names, not the normalized ones)
        const entry: AuthorityData = {
          aahtCode: (row[0] || "").toString(),
          aahtAfm: (row[1] || "").toString(),
          aahtName: aahtName, // Original name with spaces
          authority: authority, // Original authority with spaces
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

    // 7. Return the filtered JSON response
    return NextResponse.json({ count: results.length, data: results });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
