import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.propertechsoftware.com';

// Get auth token from Authorization header or cookies
function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader) return authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`;

  const token = request.cookies.get('auth_token')?.value || request.cookies.get('token')?.value;
  if (token) return `Bearer ${token}`;

  return null;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = getAuthToken(request);
    if (!authHeader) {
      console.error('[API/units/[id]] No token found in headers or cookies');
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const unitId = params.id;

    const response = await fetch(`${BACKEND_URL}/api/properties/units/${unitId}/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || 'Unit not found' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Unit GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = getAuthToken(request);
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const unitId = params.id;
    const body = await request.json();

    // Map frontend fields to backend fields if needed
    const updateData: Record<string, any> = {};

    if (body.unit_number !== undefined) updateData.unit_number = body.unit_number;
    if (body.bedrooms !== undefined) updateData.bedrooms = body.bedrooms;
    if (body.bathrooms !== undefined) updateData.bathrooms = body.bathrooms;
    if (body.toilets !== undefined) updateData.toilets = body.toilets;
    if (body.floor !== undefined) updateData.floor = body.floor;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.has_master_bedroom !== undefined) updateData.has_master_bedroom = body.has_master_bedroom;
    if (body.has_servant_quarters !== undefined) updateData.has_servant_quarters = body.has_servant_quarters;

    // Handle rent field (backend may use rent_amount or monthly_rent)
    if (body.monthly_rent !== undefined) {
      updateData.monthly_rent = body.monthly_rent;
      updateData.rent_amount = body.monthly_rent;
    }

    // Handle size field (backend may use square_feet or size_sqm)
    if (body.square_feet !== undefined) {
      updateData.square_feet = body.square_feet;
      updateData.size_sqm = body.square_feet;
    }

    const response = await fetch(`${BACKEND_URL}/api/properties/units/${unitId}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || 'Failed to update unit' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Unit PUT Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = getAuthToken(request);
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const unitId = params.id;

    const response = await fetch(`${BACKEND_URL}/api/properties/units/${unitId}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: data.detail || 'Failed to delete unit' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, message: 'Unit deleted successfully' });
  } catch (error: any) {
    console.error('Unit DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
