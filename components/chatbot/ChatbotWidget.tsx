'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { chatApi } from '@/lib/api/chat';
import { ChatMessage } from '@/types/chat';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';

/* ------------------------------------------------------------------ */
/* Types & constants                                                    */
/* ------------------------------------------------------------------ */

interface ChatbotWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
  theme?: string;
  greeting?: string;
  title?: string;
  subtitle?: string;
  autoOpen?: boolean;
}

const STORAGE_KEY = 'propertech_aria_messages';

const QUICK_REPLIES: Record<string, string[]> = {
  owner: [
    'How many unpaid tenants do I have?',
    'Show my Mpesa collections this month',
    'Any pending autopilot approvals?',
    'What is my overall occupancy rate?',
  ],
  tenant: [
    'What is my current balance?',
    'When is my next rent due?',
    'I want to log a maintenance issue',
    'Show my lease details',
  ],
  agent: [
    'How many properties am I managing?',
    'What is the current occupancy rate?',
    'Show vacant units',
  ],
  staff: [
    'What are my tasks today?',
    'How do I log a maintenance update?',
  ],
  caretaker: [
    'What are my tasks today?',
    'How do I log a maintenance update?',
  ],
  admin: [
    'Show overall platform stats',
    'How many active subscriptions?',
  ],
};

function buildWelcome(firstName: string): ChatMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    content: `Hi ${firstName}! I'm **ARIA**, your PROPERTECH AI assistant. I have live access to your data and can help with payments, leases, maintenance, autopilot, and more. What would you like to know?`,
    timestamp: new Date(),
  };
}

function serializeMessages(msgs: ChatMessage[]): string {
  return JSON.stringify(msgs.map(m => ({ ...m, timestamp: m.timestamp.toISOString() })));
}

function deserializeMessages(raw: string): ChatMessage[] {
  try {
    const parsed = JSON.parse(raw);
    return parsed.map((m: ChatMessage & { timestamp: string }) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

export function ChatbotWidget({
  position = 'bottom-right',
}: ChatbotWidgetProps) {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();

  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const role = user?.role || 'owner';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ---- restore / init messages ---- */
  useEffect(() => {
    if (!isAuthenticated) return;
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = deserializeMessages(raw);
      setMessages(stored.length ? stored : [buildWelcome(firstName)]);
    } else {
      setMessages([buildWelcome(firstName)]);
    }
  }, [isAuthenticated, firstName]);

  /* ---- persist messages ---- */
  useEffect(() => {
    if (messages.length) {
      sessionStorage.setItem(STORAGE_KEY, serializeMessages(messages));
    }
  }, [messages]);

  /* ---- scroll to bottom ---- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* ---- focus textarea on open ---- */
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
    if (isOpen) setHasUnread(false);
  }, [isOpen]);

  /* ---- textarea auto-resize ---- */
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 72) + 'px';
  }, []);

  /* ---------------------------------------------------------------- */
  /* Send message                                                      */
  /* ---------------------------------------------------------------- */
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Build history excluding the static welcome message
      const history = [...messages.filter(m => m.id !== 'welcome'), userMsg]
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const context = {
        page: pathname || '/',
        role,
        user_id: user?.id || '',
        owner_id: user?.id || '',
      };

      const { reply } = await chatApi.send(history, context);

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      if (!isOpen) setHasUnread(true);
    } catch (err: unknown) {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: err instanceof Error
          ? `Sorry, I ran into an issue: ${err.message}. Please try again.`
          : 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, messages, pathname, role, user, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!isAuthenticated) return null;

  const posClass = position === 'bottom-right' ? 'right-4' : 'left-4';
  const quickReplies = QUICK_REPLIES[role] || QUICK_REPLIES.owner;

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */
  return (
    <div className={`fixed bottom-4 ${posClass} z-50 flex flex-col items-end`}>

      {/* ---- Chat panel ---- */}
      <div
        className={`mb-3 w-[380px] max-w-[calc(100vw-2rem)] bg-bg-card rounded-2xl shadow-2xl border border-bd flex flex-col overflow-hidden transition-all duration-200 ease-out origin-bottom-right ${
          isOpen
            ? 'scale-100 opacity-100 pointer-events-auto'
            : 'scale-95 opacity-0 pointer-events-none'
        }`}
        style={{ height: '520px' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">ARIA</p>
              <p className="text-xs text-white/80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                AI Property Assistant
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close ARIA"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-bg-secondary">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand text-tx-inverse rounded-br-sm'
                    : 'bg-bg-card border border-bd text-tx-primary rounded-bl-sm shadow-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-bg-card border border-bd px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 bg-tx-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-tx-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-tx-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick replies (show only when just welcome message visible) */}
        {messages.length <= 1 && !isTyping && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0 bg-bg-secondary">
            {quickReplies.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-xs px-2.5 py-1 rounded-full border border-bd bg-bg-card text-tx-secondary hover:border-brand hover:text-brand transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 bg-bg-card border-t border-bd flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={e => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder="Ask ARIA anything…"
              className="flex-1 resize-none px-3 py-2 rounded-xl border border-bd bg-bg-secondary text-tx-primary text-sm placeholder-tx-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
              style={{ minHeight: '36px', maxHeight: '72px' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-tx-muted mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>

      {/* ---- Bubble toggle ---- */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="relative w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        aria-label={isOpen ? 'Close ARIA' : 'Open ARIA'}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Sparkles className="w-6 h-6" />
        )}

        {/* Unread badge */}
        {hasUnread && !isOpen && (
          <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>
    </div>
  );
}
