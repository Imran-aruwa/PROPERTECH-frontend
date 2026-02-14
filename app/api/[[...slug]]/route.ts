import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/app/lib/proxy';

/**
 * Catch-all API route that proxies requests to the backend.
 * Handles ALL /api/* routes that don't have specific handlers.
 * Next.js automatically prioritizes specific route files over catch-all.
 */

function getBackendPath(request: NextRequest): string {
  const url = new URL(request.url);
  return url.pathname; // e.g., /api/agent/leads/
}

export async function GET(request: NextRequest) {
  return proxyToBackend(request, getBackendPath(request));
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, getBackendPath(request));
}

export async function PUT(request: NextRequest) {
  return proxyToBackend(request, getBackendPath(request));
}

export async function PATCH(request: NextRequest) {
  return proxyToBackend(request, getBackendPath(request));
}

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, getBackendPath(request));
}
