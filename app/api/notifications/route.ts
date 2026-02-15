import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend, getAuthToken } from '@/app/lib/proxy';

export async function GET(request: NextRequest) {
  // Notifications are optional - return empty array if no auth
  const authHeader = getAuthToken(request);
  if (!authHeader) {
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }

  try {
    const result = await proxyToBackend(request, '/api/notifications/');
    const data = await result.json();

    // If backend errors, return empty array (notifications shouldn't block the app)
    if (!data.success) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    // Handle different response formats
    const notifications = Array.isArray(data.data) ? data.data : (data.data?.notifications || []);
    return NextResponse.json({ success: true, data: notifications }, { status: 200 });
  } catch {
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/api/notifications/mark-all-read/');
}
