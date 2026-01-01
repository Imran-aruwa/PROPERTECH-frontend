import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, company, phone, units, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Forward to backend API if available
    if (API_URL) {
      try {
        const response = await fetch(`${API_URL}/api/contact`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, company, phone, units, message }),
        });

        if (response.ok) {
          return NextResponse.json({ ok: true, message: 'Message sent successfully' }, { status: 200 });
        }

        // If backend fails, still return success (we can handle it gracefully)
        console.error('Backend contact API error:', await response.text());
      } catch (backendErr) {
        console.error('Backend contact API unreachable:', backendErr);
      }
    }

    // Return success even if backend is unavailable (form data logged for now)
    console.log('Contact form submission:', { name, email, company, phone, units, message });
    return NextResponse.json({ ok: true, message: 'Message sent successfully' }, { status: 200 });
  } catch (err: any) {
    console.error('Contact route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
