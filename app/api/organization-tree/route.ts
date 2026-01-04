// app/api/organization-tree/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://hrms.gov.gr/api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationCode = searchParams.get('organizationCode');
    const unitCode = searchParams.get('unitCode');

    if (!organizationCode) {
      return NextResponse.json(
        { error: 'organizationCode is required' },
        { status: 400 }
      );
    }

    let url = `${BASE_URL}/public/organization-tree?organizationCode=${organizationCode}`;
    if (unitCode) {
      url += `&unitCode=${unitCode}`;
    }

    const response = await fetch(url, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch organization tree' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get organization tree error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}