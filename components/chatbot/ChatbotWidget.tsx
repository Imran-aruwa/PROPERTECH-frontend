'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'bot';
  timestamp: Date;
}

interface ChatbotWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
  theme?: 'purple' | 'blue' | 'green';
  greeting?: string;
  title?: string;
  subtitle?: string;
  autoOpen?: boolean;
}

const themes = {
  purple: {
    primary: 'from-purple-500 to-purple-700',
    button: 'bg-purple-600 hover:bg-purple-700',
    userMessage: 'bg-purple-600',
    focus: 'focus:ring-purple-500'
  },
  blue: {
    primary: 'from-blue-500 to-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700',
    userMessage: 'bg-blue-600',
    focus: 'focus:ring-blue-500'
  },
  green: {
    primary: 'from-green-500 to-green-700',
    button: 'bg-green-600 hover:bg-green-700',
    userMessage: 'bg-green-600',
    focus: 'focus:ring-green-500'
  }
};

const defaultResponses: Record<string, string> = {
  hello: 'Hello! How can I help you with your property management today?',
  hi: 'Hi there! What can I assist you with?',
  help: 'I can help you with:\n- Property information\n- Tenant management\n- Payment tracking\n- Maintenance requests\n\nWhat would you like to know more about?',
  property: 'You can manage your properties from the dashboard. Would you like me to help you add a new property or view existing ones?',
  tenant: 'I can help with tenant management. You can add tenants, view their information, or track their payments through the Tenants section.',
  payment: 'For payment tracking, visit the Payments section. You can view pending payments, record new payments, and generate reports.',
  maintenance: 'To submit or view maintenance requests, go to the Maintenance section. You can track the status of ongoing repairs there.',
  rent: 'You can track rent payments and view collection rates in the Payments or Analytics section.',
  report: 'You can generate various reports including occupancy rates, payment history, and financial summaries from the Reports section.',
  thank: "You're welcome! Is there anything else I can help you with?",
  bye: 'Goodbye! Feel free to chat anytime you need assistance.'
};

export function ChatbotWidget({
  position = 'bottom-right',
  theme = 'purple',
  greeting = 'Hi! How can I help you with property management today?',
  title = 'Propertech AI',
  subtitle = 'Property Assistant',
  autoOpen = false
}: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: greeting,
      type: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentTheme = themes[theme];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    for (const [keyword, response] of Object.entries(defaultResponses)) {
      if (lowerMessage.includes(keyword)) {
        return response;
      }
    }

    return "I understand you're looking for help. For specific assistance, you can:\n\n1. Visit your Dashboard for an overview\n2. Check Properties for unit details\n3. View Payments for financial tracking\n\nIs there something specific I can help you find?";
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = getResponse(input);
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: response,
      type: 'bot',
      timestamp: new Date()
    };

    setIsTyping(false);
    setMessages(prev => [...prev, botMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const positionClasses = position === 'bottom-right' ? 'right-4' : 'left-4';

  return (
    <div className={`fixed bottom-4 ${positionClasses} z-50`}>
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[380px] max-w-[calc(100vw-2rem)] bg-bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className={`bg-gradient-to-r ${currentTheme.primary} text-white p-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-bg-card/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm opacity-90 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    {subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-bg-card/20 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 h-[350px] overflow-y-auto p-4 space-y-4 bg-bg-secondary">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.type === 'user'
                      ? `${currentTheme.userMessage} text-white rounded-br-sm`
                      : 'bg-bg-card text-tx-primary shadow-sm rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-bg-card p-4 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-tx-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-tx-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-tx-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-bg-card border-t border-bd">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className={`flex-1 px-4 py-2 border border-bd-strong rounded-full focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent text-tx-primary bg-bg-card`}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className={`p-2 ${currentTheme.button} text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 ${currentTheme.button} text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95`}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}
