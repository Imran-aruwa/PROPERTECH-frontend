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

    console.log('[API/tenant/dashboard] Auth present:', !!authHeader);

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const backendUrl = `${BACKEND_URL}/api/tenant/dashboard`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      cache: 'no-store',
      redirect: 'follow',
    });

    console.log('[API/tenant/dashboard] Backend status:', response.status);
    const data = await response.json();

    if (!response.ok) {
      console.log('[API/tenant/dashboard] Backend error:', JSON.stringify(data));
      return NextResponse.json(
        { success: false, error: data.detail || data.message || 'Failed to fetch dashboard' },
        { status: response.status }
      );
    }

    // Handle potential double-wrapping
    let dashboardData = data;
    if (data.data && typeof data.data === 'object') {
      dashboardData = data.data;
    }

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error: any) {
    console.error('Tenant Dashboard API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dashboard' },
      { status: 500 }
    );
  }
}
