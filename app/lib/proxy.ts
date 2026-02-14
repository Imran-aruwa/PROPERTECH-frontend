import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.propertechsoftware.com';

/**
 * Extract auth token from request headers or cookies.
 * Returns a properly formatted "Bearer <token>" string or null.
 */
export function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader) {
    return authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`;
  }

  const token = request.cookies.get('auth_token')?.value || request.cookies.get('token')?.value;
  if (token) {
    return `Bearer ${token}`;
  }

  return null;
}

/**
 * Proxy a request to the backend API.
 * Handles:
 * - Token extraction from headers and cookies
 * - All HTTP methods (GET, POST, PUT, PATCH, DELETE)
 * - FastAPI 307/308 redirects (preserves Authorization header)
 * - http→https redirect fix for Railway TLS proxy
 * - Response unwrapping (backend double-wrapping)
 * - Content-Type forwarding
 *
 * @param request - The incoming Next.js request
 * @param backendPath - The backend path (e.g., "/api/properties/")
 * @param options - Optional overrides
 */
export async function proxyToBackend(
  request: NextRequest,
  backendPath: string,
  options?: {
    requireAuth?: boolean;
    unwrapResponse?: boolean;
    method?: string;
  }
): Promise<NextResponse> {
  const requireAuth = options?.requireAuth !== false;
  const unwrapResponse = options?.unwrapResponse !== false;
  const method = options?.method || request.method;

  try {
    const authHeader = getAuthToken(request);

    if (requireAuth && !authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
      redirect: 'manual',
    };

    // Add body for write methods
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const body = await request.text();
        if (body) {
          fetchOptions.body = body;
        }
      } catch {
        // No body
      }
    }

    // Include query string
    const url = new URL(request.url);
    const queryString = url.search;
    const fullUrl = `${BACKEND_URL}${backendPath}${queryString}`;

    console.log(`[Proxy] ${method} ${backendPath} - Auth: ${authHeader ? 'Present' : 'MISSING'}`);

    let response = await fetch(fullUrl, fetchOptions);

    // Handle FastAPI 307/308 redirects - preserve Authorization header
    if (response.status === 307 || response.status === 308) {
      let redirectUrl = response.headers.get('location');
      if (redirectUrl) {
        // Fix: FastAPI behind Railway TLS proxy returns http:// redirect URLs
        redirectUrl = redirectUrl.replace(/^http:\/\//i, 'https://');
        console.log(`[Proxy] Following redirect to: ${redirectUrl}`);
        const redirectOptions = { ...fetchOptions, redirect: 'follow' as RequestRedirect };
        response = await fetch(redirectUrl, redirectOptions);
      }
    }

    console.log(`[Proxy] ${method} ${backendPath} - Status: ${response.status}`);

    // Parse response
    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.detail || data?.message || data?.error || `Request failed with status ${response.status}`,
        },
        { status: response.status }
      );
    }

    // Unwrap double-wrapped responses from backend
    let responseData = data;
    if (unwrapResponse && data?.data && (Array.isArray(data.data) || typeof data.data === 'object')) {
      responseData = data.data;
    }

    return NextResponse.json({ success: true, data: responseData });
  } catch (error: any) {
    console.error(`[Proxy] Error for ${method} ${backendPath}:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
