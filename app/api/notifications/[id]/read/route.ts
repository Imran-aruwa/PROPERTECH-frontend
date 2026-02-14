import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/app/lib/proxy';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return proxyToBackend(request, `/api/notifications/${params.id}/read/`);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return proxyToBackend(request, `/api/notifications/${params.id}/read/`);
}
