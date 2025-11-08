export async function submitWaitlist(data: { email: string }) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res;
  } catch (error) {
    console.error('Error submitting waitlist:', error);
    throw error;
  }
}
