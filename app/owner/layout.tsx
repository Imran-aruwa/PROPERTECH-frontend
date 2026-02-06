'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Header } from '@/components/layout/header';
import { useAuth } from '@/app/lib/auth-context';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { X } from 'lucide-react';
import { ChatbotWidget } from '@/components/chatbot';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'owner') {
        router.push('/unauthorized');
      }
    }
  }, [user, isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'owner') {
    return null;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Header - Fixed at top */}
      <Header role="owner" onMenuClick={() => setSidebarOpen(true)} />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main container with sidebar and content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Fixed height, scrollable inside */}
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-0
          h-[calc(100vh-4rem)] lg:h-auto
          transform transition-transform duration-300 ease-in-out
          lg:transform-none lg:transition-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Mobile close button */}
          <div className="lg:hidden absolute top-3 right-3 z-10">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <Sidebar />
        </div>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>

      {/* AI Chatbot Widget */}
      <ChatbotWidget
        position="bottom-right"
        theme="blue"
        title="Propertech Assistant"
        subtitle="Online"
        greeting="Hi! I'm your Propertech assistant. How can I help you manage your properties today?"
      />
    </div>
  );
}
