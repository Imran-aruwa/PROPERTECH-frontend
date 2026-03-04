'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Menu, AlertCircle, DollarSign, Wrench, Users, Clock, Loader2 } from 'lucide-react';
import { notificationsApi, Notification } from '@/lib/api-services';
import { ThemeToggle } from '@/components/ThemeToggle';

interface HeaderProps {
  role: 'owner' | 'agent' | 'caretaker' | 'tenant' | 'security' | 'gardener';
  onMenuClick: () => void;
}

// Format relative time from ISO date string
const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
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
      return <Bell className="w-4 h-4 text-tx-muted" />;
  }
};

export function Header({ role, onMenuClick }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasFetched = useRef(false);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);
      const response = await notificationsApi.getAll();

      if (response.success && Array.isArray(response.data)) {
        setNotifications(response.data);
      } else if (Array.isArray(response.data)) {
        setNotifications(response.data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchNotifications();
    }
  }, [fetchNotifications]);

  useEffect(() => {
    const interval = setInterval(() => { fetchNotifications(); }, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

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

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    try {
      await notificationsApi.markAsRead(id);
    } catch {
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: false } : n)));
    }
  };

  const markAllAsRead = async () => {
    const prev = [...notifications];
    setNotifications(p => p.map(n => ({ ...n, read: true })));
    try {
      await notificationsApi.markAllAsRead();
    } catch {
      setNotifications(prev);
    }
  };

  return (
    <header className="bg-bg-card/80 backdrop-blur-md border-b border-bd shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-tx-muted hover:text-tx-primary rounded-lg hover:bg-bg-hover"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Logo / role badge */}
          <div className="flex items-center min-w-0 flex-1 ml-2 lg:ml-0">
            <h1 className="text-sm sm:text-base lg:text-xl font-bold text-tx-primary truncate">
              <span className="hidden md:inline">PROPERTECH SOFTWARE</span>
              <span className="md:hidden">PROPERTECH</span>
            </h1>
            <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-1.5 sm:px-2 py-0.5 rounded-full font-medium flex-shrink-0">
              {role.toUpperCase()}
            </span>
          </div>

          {/* Right side: ThemeToggle + Notifications + Avatar */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-1.5 sm:p-2 text-tx-muted hover:text-tx-primary rounded-lg hover:bg-bg-hover transition-colors"
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
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-bg-card rounded-xl shadow-lg border border-bd overflow-hidden z-50">
                  {/* Dropdown header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-bd bg-bg-secondary">
                    <h3 className="font-semibold text-tx-primary text-sm">Notifications</h3>
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
                    {loading && notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-tx-muted">
                        <Loader2 className="w-6 h-6 mx-auto mb-2 text-tx-muted animate-spin" />
                        <p className="text-sm">Loading notifications...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-tx-muted">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-tx-muted opacity-40" />
                        <p className="text-sm">No notifications</p>
                        <p className="text-xs text-tx-muted mt-1 opacity-70">You're all caught up!</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={`px-4 py-3 border-b border-bd hover:bg-bg-hover cursor-pointer transition-colors ${
                            !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${
                              notification.type === 'payment'     ? 'bg-green-100 dark:bg-green-900/30' :
                              notification.type === 'maintenance' ? 'bg-orange-100 dark:bg-orange-900/30' :
                              notification.type === 'tenant'      ? 'bg-blue-100 dark:bg-blue-900/30' :
                              notification.type === 'alert'       ? 'bg-red-100 dark:bg-red-900/30' :
                                                                    'bg-bg-secondary'
                            }`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-tx-primary truncate">
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-tx-secondary mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-1 mt-1 text-xs text-tx-muted">
                                <Clock className="w-3 h-3" />
                                {formatRelativeTime(notification.created_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-bd bg-bg-secondary">
                      <button className="w-full text-center text-xs text-blue-600 hover:text-blue-700 font-medium py-1">
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Avatar */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-md ring-2 ring-white/50 dark:ring-slate-900/50">
              {role.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
