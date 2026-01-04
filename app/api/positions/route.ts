// app/api/positions/route.ts
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://hrms.gov.gr/api";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationCode = searchParams.get("organizationCode");
    const unitCode = searchParams.get("unitCode");

    const params = new URLSearchParams();
    if (organizationCode) params.append("organizationCode", organizationCode);
    if (unitCode) params.append("unitCode", unitCode);

    const queryString = params.toString();
    const url = `${BASE_URL}/public/positions${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch positions" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Get positions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
