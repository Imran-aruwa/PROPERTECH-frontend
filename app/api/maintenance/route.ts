import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/app/lib/proxy';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/api/caretaker/maintenance/');
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/api/caretaker/maintenance/');
}
