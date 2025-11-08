// app/api/waitlist/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE env vars for waitlist route');
}

const supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body?.email || '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Check duplicate
    const { data: existing, error: selErr } = await supabaseServer
      .from('waitlist')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (selErr) {
      console.error('Supabase select error', selErr);
      // continue to attempt insert anyway
    }

    if (existing) {
      return NextResponse.json({ message: "You're already on the waitlist" }, { status: 200 });
    }

    const { error: insertErr } = await supabaseServer
      .from('waitlist')
      .insert({ email });

    if (insertErr) {
      console.error('Supabase insert error', insertErr);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "You're in! We'll email you soon." }, { status: 200 });
  } catch (err: any) {
    console.error('Waitlist route error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
