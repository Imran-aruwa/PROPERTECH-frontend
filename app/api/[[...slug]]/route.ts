import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.propertechsoftware.com';

/**
 * Catch-all API route that proxies requests to the backend
 * This handles ALL /api/* routes that don't have specific handlers
 */

async function proxyRequest(request: NextRequest, method: string) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;

    // Skip if this is a specific route that already exists
    // Those routes should handle themselves
    const specificRoutes = [
      '/api/auth/login',
      '/api/auth/signup',
      '/api/auth/me',
      '/api/auth/forgot-password',
      '/api/waitlist',
      '/api/properties',
      '/api/owner/dashboard',
      '/api/payments',
      '/api/tenants',
      '/api/maintenance',
      '/api/reports'
    ];

    // Check if path starts with any specific route
    const isSpecificRoute = specificRoutes.some(route =>
      path === route || path === route + '/'
    );

    if (isSpecificRoute) {
      // Let the specific route handler deal with it
      return NextResponse.json({ error: 'Route handler not found' }, { status: 404 });
    }

    // Build the backend URL
    const backendUrl = `${BACKEND_URL}${path}${url.search}`;

    console.log(`[API Proxy] ${method} ${path} -> ${backendUrl}`);

    // Get headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Build fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    // Add body for POST, PUT, PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const body = await request.text();
        if (body) {
          fetchOptions.body = body;
        }
      } catch {
        // No body - that's okay
      }
    }

    // Make request to backend
    const response = await fetch(backendUrl, fetchOptions);

    // Get response data
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Return response
    return NextResponse.json(
      typeof data === 'object' ? data : { data },
      { status: response.status }
    );

  } catch (error) {
    console.error(`[API Proxy] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request, 'PUT');
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request, 'PATCH');
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, 'DELETE');
}
