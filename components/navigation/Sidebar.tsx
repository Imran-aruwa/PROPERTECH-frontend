'use client';

import { useAuth } from '@/app/lib/auth-context';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Building2, Users, DollarSign, Wrench, UserCircle,
  BarChart, LogOut, Settings, ChevronLeft, ChevronRight,
  ClipboardList, Calendar, Target, ShieldAlert, AlertTriangle, Timer, MessageSquare,
  ClipboardCheck, FileSignature, TrendingUp, Zap, BookOpen, Megaphone, Smartphone,
  Bot, ChevronDown,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { autopilotHealthApi } from '@/app/lib/api/automation';

type SubItem = { href: string; label: string };
type NavLink = {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  subItems?: SubItem[];
};

const BASE_OWNER_LINKS: NavLink[] = [
  { href: '/owner', icon: Home, label: 'Dashboard' },
  { href: '/owner/properties', icon: Building2, label: 'Properties' },
  { href: '/owner/leases', icon: FileSignature, label: 'Leases' },
  { href: '/owner/units', icon: Home, label: 'Units' },
  { href: '/owner/inspections', icon: ClipboardCheck, label: 'Inspections' },
  { href: '/owner/tenants', icon: Users, label: 'Tenants' },
  { href: '/owner/payments', icon: DollarSign, label: 'Payments' },
  { href: '/owner/maintenance', icon: Wrench, label: 'Maintenance' },
  { href: '/owner/staff', icon: UserCircle, label: 'Staff' },
  { href: '/owner/market-intelligence', icon: TrendingUp, label: 'Market Intel' },
  { href: '/owner/listings', icon: Megaphone, label: 'Listings' },
  { href: '/owner/mpesa', icon: Smartphone, label: 'Mpesa' },
  {
    href: '/owner/autopilot',
    icon: Bot,
    label: 'Autopilot',
    subItems: [
      { href: '/owner/autopilot/rules', label: 'Rules' },
      { href: '/owner/autopilot/executions', label: 'Executions' },
      { href: '/owner/autopilot/settings', label: 'Settings' },
    ],
  },
  { href: '/owner/accounting', icon: BookOpen, label: 'Accounting' },
];

const caretakerLinks: NavLink[] = [
  { href: '/caretaker', icon: Home, label: 'Dashboard' },
  { href: '/caretaker/properties', icon: Building2, label: 'Properties' },
  { href: '/caretaker/maintenance', icon: Wrench, label: 'Maintenance' },
  { href: '/caretaker/inspections', icon: ClipboardCheck, label: 'Inspections' },
];

const agentLinks: NavLink[] = [
  { href: '/agent', icon: Home, label: 'Dashboard' },
  { href: '/agent/properties', icon: Building2, label: 'Properties' },
  { href: '/agent/inspections', icon: ClipboardCheck, label: 'Inspections' },
  { href: '/agent/leads', icon: Target, label: 'Leads' },
  { href: '/agent/viewings', icon: Calendar, label: 'Viewings' },
  { href: '/agent/earnings', icon: DollarSign, label: 'Earnings' },
];

const tenantLinks: NavLink[] = [
  { href: '/tenant', icon: Home, label: 'Dashboard' },
  { href: '/tenant/payments', icon: DollarSign, label: 'Payments' },
  { href: '/tenant/maintenance', icon: Wrench, label: 'Maintenance' },
  { href: '/tenant/profile', icon: UserCircle, label: 'Profile' },
];

const staffLinks: NavLink[] = [
  { href: '/staff', icon: Home, label: 'Dashboard' },
  { href: '/staff/tasks', icon: ClipboardList, label: 'My Tasks' },
  { href: '/staff/attendance', icon: Calendar, label: 'Attendance' },
  { href: '/staff/maintenance', icon: Wrench, label: 'Maintenance' },
];

const adminLinks: NavLink[] = [
  { href: '/admin', icon: Home, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/properties', icon: Building2, label: 'Properties' },
  { href: '/admin/reports', icon: BarChart, label: 'Reports' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [pendingApprovals, setPendingApprovals] = useState(0);

  // Poll autopilot health every 60 s (owner only)
  useEffect(() => {
    if (user?.role !== 'owner') return;

    const poll = async () => {
      const res = await autopilotHealthApi.get();
      if (res.success && res.data) {
        setPendingApprovals(res.data.pending_approvals ?? 0);
      }
    };

    poll();
    const id = setInterval(poll, 60_000);
    return () => clearInterval(id);
  }, [user?.role]);

  // Auto-expand groups whose sub-routes are currently active
  useEffect(() => {
    BASE_OWNER_LINKS.forEach(link => {
      if (link.subItems && pathname.startsWith(link.href + '/')) {
        setExpandedGroups(prev => {
          if (prev.has(link.href)) return prev;
          const next = new Set(prev);
          next.add(link.href);
          return next;
        });
      }
    });
  }, [pathname]);

  const toggleGroup = (href: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  };

  const getLinks = (): NavLink[] => {
    switch (user?.role) {
      case 'owner': {
        // Inject live badge into the Autopilot entry
        return BASE_OWNER_LINKS.map(l =>
          l.href === '/owner/autopilot'
            ? { ...l, badge: pendingApprovals > 0 ? pendingApprovals : undefined }
            : l
        );
      }
      case 'caretaker': return caretakerLinks;
      case 'agent':     return agentLinks;
      case 'tenant':    return tenantLinks;
      case 'staff':     return staffLinks;
      case 'admin':     return adminLinks;
      default:          return [];
    }
  };

  const links = getLinks();

  const getRoleColor = () => {
    switch (user?.role) {
      case 'owner':     return 'bg-blue-600';
      case 'caretaker': return 'bg-teal-600';
      case 'agent':     return 'bg-indigo-600';
      case 'tenant':    return 'bg-purple-600';
      case 'staff':     return 'bg-green-600';
      case 'admin':     return 'bg-red-600';
      default:          return 'bg-gray-600';
    }
  };

  const getActiveClass = () => {
    switch (user?.role) {
      case 'owner':     return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'caretaker': return 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300';
      case 'agent':     return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'tenant':    return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'staff':     return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'admin':     return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:          return 'bg-bg-secondary text-tx-secondary dark:bg-slate-700 dark:text-slate-200';
    }
  };

  return (
    <aside className={`bg-bg-card border-r border-bd h-full flex flex-col transition-all duration-300 ${
      collapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-bd">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <Image
              src="/logo.png"
              alt="ProperTech Software"
              width={160}
              height={44}
              priority
              className="h-11 w-auto object-contain"
            />
          )}
          {collapsed && (
            <Image
              src="/logo.png"
              alt="ProperTech Software"
              width={40}
              height={40}
              priority
              className="h-8 w-auto object-contain mx-auto"
            />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 hover:bg-bg-hover rounded-lg transition-colors ${collapsed ? 'mx-auto mt-2' : ''}`}
          >
            {collapsed
              ? <ChevronRight className="w-5 h-5 text-tx-muted" />
              : <ChevronLeft  className="w-5 h-5 text-tx-muted" />}
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="flex-shrink-0 p-3 border-b border-bd">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className={`w-9 h-9 ${getRoleColor()} rounded-full flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-semibold text-sm">
              {user?.full_name?.charAt(0) || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-tx-primary truncate text-sm">{user?.full_name}</p>
              <p className="text-xs text-tx-muted capitalize">
                {user?.role === 'caretaker' ? 'Staff' : user?.role}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-nav px-3 py-3">
        <div className="space-y-1">
          {links.map(link => {
            const hasSubItems = !!link.subItems?.length;
            const isGroupActive = pathname === link.href || pathname.startsWith(link.href + '/');
            const isExpanded = expandedGroups.has(link.href);

            if (hasSubItems) {
              return (
                <div key={link.href}>
                  {/* Parent row */}
                  <Link
                    href={link.href}
                    onClick={() => toggleGroup(link.href)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isGroupActive
                        ? `${getActiveClass()} font-medium`
                        : 'text-tx-secondary hover:bg-bg-hover'
                    } ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? link.label : undefined}
                  >
                    {/* Collapsed: icon + small badge dot */}
                    {collapsed ? (
                      <div className="relative">
                        <link.icon className={`w-5 h-5 flex-shrink-0 ${isGroupActive ? '' : 'text-tx-muted'}`} />
                        {(link.badge ?? 0) > 0 && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                      </div>
                    ) : (
                      <>
                        <link.icon className={`w-5 h-5 flex-shrink-0 ${isGroupActive ? '' : 'text-tx-muted'}`} />
                        <span className="text-sm flex-1">{link.label}</span>
                        {(link.badge ?? 0) > 0 && (
                          <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 mr-1">
                            {link.badge! > 99 ? '99+' : link.badge}
                          </span>
                        )}
                        <ChevronDown className={`w-3.5 h-3.5 text-tx-muted transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                      </>
                    )}
                  </Link>

                  {/* Sub-items */}
                  {!collapsed && isExpanded && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-bd pl-3">
                      {link.subItems!.map(sub => {
                        const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                              isSubActive
                                ? `${getActiveClass()} font-medium`
                                : 'text-tx-secondary hover:bg-bg-hover'
                            }`}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Regular link
            const isActive =
              pathname === link.href ||
              (link.href !== `/${user?.role}` && pathname.startsWith(link.href + '/'));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? `${getActiveClass()} font-medium`
                    : 'text-tx-secondary hover:bg-bg-hover'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? link.label : undefined}
              >
                <link.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? '' : 'text-tx-muted'}`} />
                {!collapsed && <span className="text-sm">{link.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="flex-shrink-0 p-3 border-t border-bd space-y-1 bg-bg-card">
        <Link
          href={`/${user?.role}/settings`}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-tx-secondary hover:bg-bg-hover transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="w-5 h-5 text-tx-muted flex-shrink-0" />
          {!collapsed && <span className="text-sm">Settings</span>}
        </Link>

        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
