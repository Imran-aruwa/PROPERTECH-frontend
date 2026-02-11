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

    console.log('[API/owner/dashboard] Auth present:', !!authHeader);

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const backendUrl = `${BACKEND_URL}/api/owner/dashboard`;

    // Use redirect: 'manual' to handle redirects ourselves and preserve auth
    let response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      cache: 'no-store',
      redirect: 'manual',
    });

    // Handle redirect manually to preserve Authorization header
    if (response.status === 307 || response.status === 308) {
      let redirectUrl = response.headers.get('location');
      // Fix: FastAPI behind Railway TLS proxy returns http:// redirect URLs
      if (redirectUrl) redirectUrl = redirectUrl.replace(/^http:\/\//i, 'https://');
      console.log('[API/owner/dashboard] Redirected to:', redirectUrl);
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

    console.log('[API/owner/dashboard] Backend status:', response.status);
    const data = await response.json();
    console.log('[API/owner/dashboard] Response data keys:', Object.keys(data));

    if (!response.ok) {
      console.log('[API/owner/dashboard] Backend error:', JSON.stringify(data));
      return NextResponse.json(
        { success: false, error: data.detail || data.message || 'Failed to fetch dashboard' },
        { status: response.status }
      );
    }

    // Handle potential double-wrapping from backend
    let dashboardData = data;
    if (data.data && typeof data.data === 'object') {
      dashboardData = data.data;
    }

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error: any) {
    console.error('Owner Dashboard API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dashboard' },
      { status: 500 }
    );
  }
}
