import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/app/lib/proxy';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return proxyToBackend(request, `/api/properties/${params.id}/units/`);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return proxyToBackend(request, `/api/properties/${params.id}/units/`);
}
