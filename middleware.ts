import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Get auth token from cookie or check localStorage via custom header
  // Since we're using custom auth-context with localStorage,
  // we'll let the client-side auth handle redirects
  // The middleware will just pass through - client-side useRequireAuth handles protection

  // For static pages, allow them through
  // Client-side auth context will handle redirects
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/owner/:path*',
    '/agent/:path*',
    '/caretaker/:path*',
    '/tenant/:path*',
    '/staff/:path*',
    '/admin/:path*',
  ],
};