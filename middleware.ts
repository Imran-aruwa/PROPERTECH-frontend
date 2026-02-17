import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route configurations for role-based access
const ROLE_ROUTES: Record<string, string[]> = {
  owner: ['/owner'],
  agent: ['/agent'],
  caretaker: ['/caretaker'],
  tenant: ['/tenant'],
  staff: ['/staff'],
  admin: ['/admin'],
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/logout',
  '/contact',
  '/unauthorized',
  '/checkout',
  '/payment/success',
  '/payment/cancel',
  '/privacy',
  '/terms',
  '/cookies',
  '/sign',
  '/',
];

// Route normalization - redirect old routes to new standard routes
const ROUTE_REDIRECTS: Record<string, string> = {
  '/owner/property': '/owner/properties',
  '/agent/property': '/agent/properties',
  '/caretaker/property': '/caretaker/properties',
  '/owner/dashboard': '/owner',
  '/agent/dashboard': '/agent',
  '/caretaker/dashboard': '/caretaker',
  '/tenant/dashboard': '/tenant',
};

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check for route redirects (normalize old routes to new convention)
  for (const [oldRoute, newRoute] of Object.entries(ROUTE_REDIRECTS)) {
    if (path.startsWith(oldRoute)) {
      const newPath = path.replace(oldRoute, newRoute);
      return NextResponse.redirect(new URL(newPath, request.url));
    }
  }

  // Skip public routes
  if (PUBLIC_ROUTES.some(route => path === route || (route !== '/' && path.startsWith(route)))) {
    return NextResponse.next();
  }

  // Check for auth cookie (set by client after login)
  const authToken = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  // If no auth token in cookie, let client-side handle redirect
  // This allows the auth context to manage authentication state
  if (!authToken) {
    // Set a header to indicate server couldn't verify auth
    const response = NextResponse.next();
    response.headers.set('x-auth-status', 'unverified');
    return response;
  }

  // Role-based route protection
  for (const [role, routes] of Object.entries(ROLE_ROUTES)) {
    for (const route of routes) {
      if (path.startsWith(route)) {
        // If user role is set and doesn't match required role
        if (userRole && userRole !== role) {
          // Allow admin to access all routes
          if (userRole === 'admin') {
            return NextResponse.next();
          }
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
        break;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protected routes
    '/owner/:path*',
    '/agent/:path*',
    '/caretaker/:path*',
    '/tenant/:path*',
    '/staff/:path*',
    '/admin/:path*',
    // Routes to check for redirects
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};