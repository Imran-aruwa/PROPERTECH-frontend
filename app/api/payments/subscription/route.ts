import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.propertechsoftware.com';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/payments/subscriptions`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ success: false, error: data.detail || 'Failed to fetch subscription' }, { status: response.status });
    }

    const activeSubscription = data.subscriptions?.[0] || null;
    return NextResponse.json({ success: true, data: activeSubscription });
  } catch (error: any) {
    console.error('Subscription API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
