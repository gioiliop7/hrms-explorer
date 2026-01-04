import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://hrms.gov.gr/api";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ unitCode: string }> }
) {
  try {
    const { unitCode } = await context.params;

    const response = await fetch(
      `${BASE_URL}/public/organization-path/${unitCode}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch organization path" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Get organization path error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
