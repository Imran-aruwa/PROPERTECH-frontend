import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/app/lib/proxy';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  return proxyToBackend(request, `/api/leases/sign/${params.token}/verify-otp/`, {
    requireAuth: false,
  });
}
