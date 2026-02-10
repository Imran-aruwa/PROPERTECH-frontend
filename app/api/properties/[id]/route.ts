// ============================================
// FILE: app/api/properties/[id]/route.ts
// ============================================
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = getAuthToken(request);

    console.log(`[API/properties/${params.id} GET] Auth present:`, !!authHeader);

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let response = await fetch(`${BACKEND_URL}/api/properties/${params.id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      cache: 'no-store',
      redirect: 'manual',
    });

    if (response.status === 307 || response.status === 308) {
      const redirectUrl = response.headers.get('location');
      if (redirectUrl) {
        response = await fetch(redirectUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          cache: 'no-store',
        });
      }
    }

    console.log(`[API/properties/${params.id} GET] Backend status:`, response.status);
    const data = await response.json();

    if (!response.ok) {
      console.log(`[API/properties/${params.id} GET] Backend error:`, JSON.stringify(data));
      return NextResponse.json(
        { success: false, error: data.detail || 'Property not found' },
        { status: response.status }
      );
    }

    // Handle potential double-wrapping
    let propertyData = data;
    if (data.data && typeof data.data === 'object') {
      propertyData = data.data;
    }

    return NextResponse.json({ success: true, data: propertyData });
  } catch (error: any) {
    console.error(`[API/properties/${params.id} GET] Error:`, error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = getAuthToken(request);

    console.log(`[API/properties/${params.id} PUT] Auth header present:`, !!authHeader);

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const bodyStr = JSON.stringify(body);
    let response = await fetch(`${BACKEND_URL}/api/properties/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: bodyStr,
      redirect: 'manual',
    });

    if (response.status === 307 || response.status === 308) {
      const redirectUrl = response.headers.get('location');
      if (redirectUrl) {
        response = await fetch(redirectUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: bodyStr,
        });
      }
    }

    console.log(`[API/properties/${params.id} PUT] Backend status:`, response.status);
    const data = await response.json();

    if (!response.ok) {
      console.log(`[API/properties/${params.id} PUT] Backend error:`, JSON.stringify(data));
      return NextResponse.json(
        { success: false, error: data.detail || 'Failed to update property' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: data });
  } catch (error: any) {
    console.error(`[API/properties/${params.id} PUT] Error:`, error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = getAuthToken(request);

    console.log(`[API/properties/${params.id} DELETE] Auth header present:`, !!authHeader);

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let response = await fetch(`${BACKEND_URL}/api/properties/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      redirect: 'manual',
    });

    if (response.status === 307 || response.status === 308) {
      const redirectUrl = response.headers.get('location');
      if (redirectUrl) {
        response = await fetch(redirectUrl, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
        });
      }
    }

    console.log(`[API/properties/${params.id} DELETE] Backend status:`, response.status);
    const data = await response.json();

    if (!response.ok) {
      console.log(`[API/properties/${params.id} DELETE] Backend error:`, JSON.stringify(data));
      return NextResponse.json(
        { success: false, error: data.detail || 'Failed to delete property' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: data });
  } catch (error: any) {
    console.error(`[API/properties/${params.id} DELETE] Error:`, error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
