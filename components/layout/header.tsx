'use client';

import React from 'react';
import { Bell, Menu, User } from 'lucide-react';

interface HeaderProps {
  role: 'owner' | 'agent' | 'caretaker' | 'tenant' | 'security' | 'gardener';
  onMenuClick: () => void;
}

export function Header({ role, onMenuClick }: HeaderProps) {
  const [notifications] = React.useState(3);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          {/* Logo/Title with role badge */}
          <div className="flex items-center min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">
              <span className="hidden sm:inline">PROPERTECH SOFTWARE</span>
              <span className="sm:hidden">PROPERTECH</span>
            </h1>
            <span className="ml-2 text-xs sm:text-sm bg-blue-100 text-blue-800 px-2 py-0.5 sm:py-1 rounded-full font-medium flex-shrink-0">
              {role.toUpperCase()}
            </span>
          </div>
          
          {/* Right side: Notifications + Avatar */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {notifications}
                </span>
              )}
            </button>
            
            {/* User Avatar */}
            <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md ring-2 ring-white/50">
              {role.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
