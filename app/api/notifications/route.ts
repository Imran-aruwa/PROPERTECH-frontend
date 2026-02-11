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

export async function GET(req: NextRequest) {
  try {
    const authHeader = getAuthToken(req);

    console.log('[API/notifications] Auth present:', !!authHeader);

    if (!authHeader) {
      // Return empty array if no auth - notifications are optional
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    let response = await fetch(`${BACKEND_URL}/api/notifications/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
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
        });
      }
    }

    console.log('[API/notifications] Backend status:', response.status);

    if (!response.ok) {
      // If backend doesn't have notifications endpoint yet, return empty array
      if (response.status === 404) {
        return NextResponse.json({ success: true, data: [] }, { status: 200 });
      }
      // For other errors including auth errors, return empty array
      // Notifications shouldn't block the app
      console.log('[API/notifications] Backend error, returning empty array');
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    const data = await response.json();
    // Handle different response formats
    const notifications = Array.isArray(data) ? data : (data.data || data.notifications || []);
    return NextResponse.json({ success: true, data: notifications }, { status: 200 });
  } catch (error: any) {
    console.error('Notifications API error:', error);
    // Return empty array if backend is unreachable
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = getAuthToken(req);

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const bodyStr = JSON.stringify(body);
    let response = await fetch(`${BACKEND_URL}/api/notifications/mark-all-read/`, {
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

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || 'Failed to update notifications' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('Notifications POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
