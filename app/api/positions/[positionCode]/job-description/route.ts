// app/api/positions/[positionCode]/job-description/route.ts
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://hrms.gov.gr/api";

export async function GET(
  request: NextRequest,
  // 1. Update the type definition: params is now a Promise
  { params }: { params: Promise<{ positionCode: string }> }
) {
  // 2. Await the params to unwrap the Promise
  const { positionCode } = await params;

  try {
    const response = await fetch(
      // 3. Use the unwrapped variable
      `${BASE_URL}/public/positions/${positionCode}/job-description`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch job description" },
        { status: response.status }
      );
    }

    const blob = await response.blob();

    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/pdf",
        // 4. Use the unwrapped variable here as well
        "Content-Disposition": `attachment; filename="${positionCode}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Get job description error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
