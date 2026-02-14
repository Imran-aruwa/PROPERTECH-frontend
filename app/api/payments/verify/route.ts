import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/app/lib/proxy';

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/api/payments/verify/');
}
