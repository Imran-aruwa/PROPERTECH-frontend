// ============================================
// FILE: components/layout/DashboardLayout.tsx
// ============================================
'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'owner' | 'agent' | 'caretaker' | 'tenant' | 'security' | 'gardener';
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar role={role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header role={role} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}