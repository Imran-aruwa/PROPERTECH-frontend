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

export async function POST(request: NextRequest) {
  try {
    const authHeader = getAuthToken(request);
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const bodyStr = JSON.stringify(body);
    let response = await fetch(`${BACKEND_URL}/api/payments/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
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
          headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
          body: bodyStr,
        });
      }
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ success: false, error: data.detail || 'Payment initialization failed' }, { status: response.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Payment Initialize Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
