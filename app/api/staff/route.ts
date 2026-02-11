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

    console.log('[API/staff GET] Auth present:', !!authHeader);

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    let response = await fetch(`${BACKEND_URL}/api/staff/`, {
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

    console.log('[API/staff GET] Backend status:', response.status);
    const data = await response.json();

    if (!response.ok) {
      console.log('[API/staff GET] Backend error:', JSON.stringify(data));
      return NextResponse.json(
        { success: false, error: data.detail || data.message || 'Failed to fetch staff' },
        { status: response.status }
      );
    }

    // Handle potential double-wrapping from backend
    let staffData = data;
    if (data.data && (Array.isArray(data.data) || typeof data.data === 'object')) {
      staffData = data.data;
    }

    return NextResponse.json({ success: true, data: staffData });
  } catch (error: any) {
    console.error('Staff API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = getAuthToken(request);

    console.log('[API/staff POST] Auth present:', !!authHeader);

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const bodyStr = JSON.stringify(body);
    let response = await fetch(`${BACKEND_URL}/api/staff/`, {
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

    console.log('[API/staff POST] Backend status:', response.status);
    const data = await response.json();

    if (!response.ok) {
      console.log('[API/staff POST] Backend error:', JSON.stringify(data));
      return NextResponse.json(
        { success: false, error: data.detail || 'Failed to create staff member' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: data });
  } catch (error: any) {
    console.error('Create Staff Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create staff member' },
      { status: 500 }
    );
  }
}
