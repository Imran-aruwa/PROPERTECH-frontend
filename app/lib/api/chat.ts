import { ChatContext } from '@/types/chat';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token')
  );
}

export const chatApi = {
  send: async (
    messages: { role: string; content: string }[],
    context: ChatContext
  ): Promise<{ reply: string; role: string }> => {
    const token = getToken();
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages, context }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.detail || `HTTP ${res.status}`);
    }

    return res.json();
  },
};
