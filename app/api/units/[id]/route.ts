import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.propertechsoftware.com';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const unitId = params.id;

    const response = await fetch(`${BACKEND_URL}/api/properties/units/${unitId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ success: false, error: data.detail || 'Unit not found' }, { status: response.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Unit API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
