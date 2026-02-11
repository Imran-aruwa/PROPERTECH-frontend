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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = getAuthToken(req);

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let response = await fetch(`${BACKEND_URL}/api/notifications/${params.id}/read/`, {
      method: 'PATCH',
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
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
        });
      }
    }

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { success: false, error: data.detail || 'Failed to mark notification as read' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
