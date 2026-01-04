// app/api/organizations/route.ts
import { NextResponse } from 'next/server';

const BASE_URL = 'https://hrms.gov.gr/api';

export async function GET() {
  try {
    const response = await fetch(`${BASE_URL}/public/organizations`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch organizations' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get all organizations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}