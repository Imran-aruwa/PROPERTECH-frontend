import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.propertechsoftware.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const rawText = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error(`[forgot-password] Backend returned non-JSON (status ${response.status}):`, rawText.slice(0, 200));
      return NextResponse.json(
        { success: false, error: 'Service temporarily unavailable. Please try again in a moment.' },
        { status: 503 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || data.message || 'Failed to send reset email' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: data });
  } catch (error: any) {
    console.error('Forgot Password API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send reset email' },
      { status: 500 }
    );
  }
}
