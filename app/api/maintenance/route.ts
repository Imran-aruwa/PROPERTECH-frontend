import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/app/lib/proxy';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/api/maintenance/');
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/api/maintenance/');
}

export async function PUT(request: NextRequest) {
  return proxyToBackend(request, '/api/maintenance/');
}

export async function PATCH(request: NextRequest) {
  return proxyToBackend(request, '/api/maintenance/');
}

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, '/api/maintenance/');
}
