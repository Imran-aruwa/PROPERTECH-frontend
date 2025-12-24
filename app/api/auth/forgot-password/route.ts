import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

    const data = await response.json();

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
