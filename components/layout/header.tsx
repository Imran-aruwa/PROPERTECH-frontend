'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Menu, X, Check, AlertCircle, DollarSign, Wrench, Users, Clock } from 'lucide-react';

interface Notification {
  id: string;
  type: 'payment' | 'maintenance' | 'tenant' | 'alert' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface HeaderProps {
  role: 'owner' | 'agent' | 'caretaker' | 'tenant' | 'security' | 'gardener';
  onMenuClick: () => void;
}

// Mock notifications - replace with API call when backend is ready
const getMockNotifications = (role: string): Notification[] => {
  const baseNotifications: Notification[] = [
    {
      id: '1',
      type: 'payment',
      title: 'Payment Received',
      message: 'Rent payment of KES 25,000 received from Unit A1',
      time: '5 min ago',
      read: false,
    },
    {
      id: '2',
      type: 'maintenance',
      title: 'Maintenance Request',
      message: 'New request: Leaking faucet in Unit B3',
      time: '1 hour ago',
      read: false,
    },
    {
      id: '3',
      type: 'tenant',
      title: 'Lease Expiring',
      message: 'Tenant in Unit C2 lease expires in 30 days',
      time: '2 hours ago',
      read: true,
    },
  ];

  if (role === 'tenant') {
    return [
      {
        id: '1',
        type: 'payment',
        title: 'Payment Due',
        message: 'Your rent payment of KES 25,000 is due in 3 days',
        time: '1 hour ago',
        read: false,
      },
      {
        id: '2',
        type: 'maintenance',
        title: 'Request Updated',
        message: 'Your maintenance request has been assigned',
        time: '3 hours ago',
        read: false,
      },
    ];
  }

  return baseNotifications;
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'payment':
      return <DollarSign className="w-4 h-4 text-green-600" />;
    case 'maintenance':
      return <Wrench className="w-4 h-4 text-orange-600" />;
    case 'tenant':
      return <Users className="w-4 h-4 text-blue-600" />;
    case 'alert':
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    default:
      return <Bell className="w-4 h-4 text-gray-600" />;
  }
};

export function Header({ role, onMenuClick }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load notifications (mock for now - replace with API call)
    setNotifications(getMockNotifications(role));
  }, [role]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Logo/Title with role badge */}
          <div className="flex items-center min-w-0 flex-1 ml-2 lg:ml-0">
            <h1 className="text-sm sm:text-base lg:text-xl font-bold text-gray-900 truncate">
              <span className="hidden md:inline">PROPERTECH SOFTWARE</span>
              <span className="md:hidden">PROPERTECH</span>
            </h1>
            <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 rounded-full font-medium flex-shrink-0">
              {role.toUpperCase()}
            </span>
          </div>

          {/* Right side: Notifications + Avatar */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Notifications Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-1.5 sm:p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-500 text-white text-[10px] sm:text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Panel */}
              {isOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${
                              notification.type === 'payment' ? 'bg-green-100' :
                              notification.type === 'maintenance' ? 'bg-orange-100' :
                              notification.type === 'tenant' ? 'bg-blue-100' :
                              notification.type === 'alert' ? 'bg-red-100' : 'bg-gray-100'
                            }`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {notification.time}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                      <button className="w-full text-center text-xs text-blue-600 hover:text-blue-700 font-medium py-1">
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Avatar */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-md ring-2 ring-white/50">
              {role.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
