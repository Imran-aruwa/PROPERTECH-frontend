// ============================================
// FILE: app/api/auth/signup/route.ts (FIXED - Backend Proxy)
// ============================================
import { NextRequest, NextResponse } from 'next/server';

// Backend FastAPI URL
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, role } = await request.json();

    // Validate input
    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Only OWNER and AGENT can sign up directly
    if (role !== 'OWNER' && role !== 'AGENT') {
      return NextResponse.json(
        { error: 'Only Property Owners and Agents can sign up directly' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Proxy request to FastAPI backend
    const backendResponse = await fetch(`${BACKEND_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        fullName,
        role,
      }),
    });

    const backendData = await backendResponse.json();

    // Forward backend response status and data
    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: backendData.error || 'Signup failed' },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: backendData.message || 'Account created successfully',
      user: backendData.user || {
        id: backendData.id,
        email: backendData.email,
        name: backendData.fullName || backendData.name,
        role: backendData.role,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Signup proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 500 }
    );
  }
}
