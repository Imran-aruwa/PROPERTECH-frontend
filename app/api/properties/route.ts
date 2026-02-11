// ============================================
// FILE: app/api/properties/route.ts
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

export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthToken(request);

    console.log('[API/properties GET] Auth present:', !!authHeader);

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    let response = await fetch(`${BACKEND_URL}/api/properties/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      cache: 'no-store',
      redirect: 'manual',
    });

    if (response.status === 307 || response.status === 308) {
      let redirectUrl = response.headers.get('location');
      if (redirectUrl) {
        // Fix: FastAPI behind Railway TLS proxy returns http:// redirect URLs
        redirectUrl = redirectUrl.replace(/^http:\/\//i, 'https://');
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

    console.log('[API/properties GET] Backend status:', response.status);
    const data = await response.json();

    if (!response.ok) {
      console.log('[API/properties GET] Backend error:', JSON.stringify(data));
      return NextResponse.json(
        { success: false, error: data.detail || data.message || 'Failed to fetch properties' },
        { status: response.status }
      );
    }

    // Handle potential double-wrapping from backend
    let propertiesData = data;
    if (data.data && (Array.isArray(data.data) || typeof data.data === 'object')) {
      propertiesData = data.data;
    }

    return NextResponse.json({ success: true, data: propertiesData });
  } catch (error: any) {
    console.error('Properties API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = getAuthToken(request);

    console.log('[API/properties POST] Auth present:', !!authHeader);

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const bodyStr = JSON.stringify(body);
    let response = await fetch(`${BACKEND_URL}/api/properties/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: bodyStr,
      redirect: 'manual',
    });

    if (response.status === 307 || response.status === 308) {
      let redirectUrl = response.headers.get('location');
      if (redirectUrl) {
        // Fix: FastAPI behind Railway TLS proxy returns http:// redirect URLs
        redirectUrl = redirectUrl.replace(/^http:\/\//i, 'https://');
        response = await fetch(redirectUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: bodyStr,
        });
      }
    }

    console.log('[API/properties POST] Backend response status:', response.status);

    const data = await response.json();

    if (!response.ok) {
      console.log('[API/properties POST] Backend error:', JSON.stringify(data));
      return NextResponse.json(
        { success: false, error: data.detail || data.message || data.error || 'Failed to create property' },
        { status: response.status }
      );
    }

    console.log('[API/properties POST] Success, property created');
    return NextResponse.json({ success: true, data: data });
  } catch (error: any) {
    console.error('Create Property Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create property' },
      { status: 500 }
    );
  }
}