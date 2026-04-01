import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.propertechsoftware.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[API/auth/login] Login attempt for:', body.email);
    console.log('[API/auth/login] Calling backend:', `${BACKEND_URL}/api/auth/login`);

    // Try JSON format first
    let response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[API/auth/login] JSON attempt - Backend status:', response.status);

    // If JSON fails with 422 (validation error), try form-urlencoded format
    // FastAPI OAuth2PasswordBearer typically expects form data
    if (response.status === 422 || response.status === 400) {
      console.log('[API/auth/login] JSON failed, trying form-urlencoded...');

      const formData = new URLSearchParams();
      formData.append('username', body.email); // OAuth2 uses 'username' field
      formData.append('password', body.password);

      response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      console.log('[API/auth/login] Form attempt - Backend status:', response.status);
    }

    const rawText = await response.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error(`[login] Backend returned non-JSON (status ${response.status}):`, rawText.slice(0, 200));
      return NextResponse.json(
        { success: false, error: 'Service temporarily unavailable. Please try again in a moment.' },
        { status: 503 }
      );
    }
    console.log('[API/auth/login] Backend response keys:', Object.keys(data));

    if (!response.ok) {
      console.log('[API/auth/login] Login failed:', data.detail || data.message);
      return NextResponse.json(
        {
          success: false,
          error: data.detail || data.message || 'Login failed'
        },
        { status: response.status }
      );
    }

    // Log token info (first 50 chars only for security)
    if (data.access_token) {
      console.log('[API/auth/login] Token received:', data.access_token.substring(0, 50) + '...');
      console.log('[API/auth/login] Token length:', data.access_token.length);

      // Verify token is a valid JWT format
      const parts = data.access_token.split('.');
      console.log('[API/auth/login] Token JWT parts:', parts.length);
      if (parts.length !== 3) {
        console.log('[API/auth/login] WARNING: Token does not look like a valid JWT!');
      }
    } else {
      console.log('[API/auth/login] WARNING: No access_token in response!');
      console.log('[API/auth/login] Response data:', JSON.stringify(data).substring(0, 200));
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('Login API route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}