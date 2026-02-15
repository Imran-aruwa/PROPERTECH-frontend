import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/app/lib/proxy';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return proxyToBackend(request, `/api/staff/${params.id}/`);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return proxyToBackend(request, `/api/staff/${params.id}/`);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return proxyToBackend(request, `/api/staff/${params.id}/`);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return proxyToBackend(request, `/api/staff/${params.id}/`);
}
