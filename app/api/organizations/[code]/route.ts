// app/api/organizations/[code]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://hrms.gov.gr/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const response = await fetch(
      `${BASE_URL}/public/organizations/${params.code}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch organization' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}