import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.propertechsoftware.com') + '/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, role, phone } = body;

    // Validate input
    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Transform role to uppercase for backend
    const backendData = {
      email,
      password,
      full_name,
      role: role.toUpperCase(), // Convert 'owner' -> 'OWNER', 'agent' -> 'AGENT'
      ...(phone && { phone }),
    };

    // Proxy request to FastAPI backend
    const backendResponse = await fetch(`${BACKEND_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData),
    });

    const responseData = await backendResponse.json();

    // Forward backend response status and data
    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: responseData.error || responseData.detail || 'Signup failed' },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: responseData.message || 'Account created successfully',
      user: responseData,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Signup proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 500 }
    );
  }
}