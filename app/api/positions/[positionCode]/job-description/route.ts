// app/api/positions/[positionCode]/job-description/route.ts
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://hrms.gov.gr/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { positionCode: string } }
) {
  try {
    const response = await fetch(
      `${BASE_URL}/public/positions/${params.positionCode}/job-description`,
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
        "Content-Disposition": `attachment; filename="EPT_${params.positionCode}.pdf"`,
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
