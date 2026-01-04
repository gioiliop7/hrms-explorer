// app/api/organizational-units/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://hrms.gov.gr/api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationCode = searchParams.get('organizationCode');

    if (!organizationCode) {
      return NextResponse.json(
        { error: 'organizationCode is required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${BASE_URL}/public/organizational-units?organizationCode=${organizationCode}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch organizational units' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get organizational units error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}