// ============================================
// FILE: app/caretaker/maintenance/page.tsx
// ============================================
'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Wrench, Clock, CheckCircle, XCircle } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';

export default function MaintenancePage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  const stats = [
    {
      title: "Open Requests",
      label: "For reference",
      value: '12',
      change: '+3',
      icon: Wrench,
      trend: "up" as const
    },
    {
      title: "In Progress",
      label: "For reference",
      value: '5',
      change: '+1',
      icon: Clock,
      trend: "up" as const
    },
    {
      title: "Completed Today",
      label: "For reference",
      value: '4',
      change: '+4',
      icon: CheckCircle,
      trend: "up" as const
    },
  ];

  const maintenanceRequests = [
    {
      id: '1',
      unit: '204',
      tenant: 'John Kamau',
      issue: 'Leaking faucet',
      priority: 'high',
      status: 'pending',
      date: '2024-12-09',
      description: 'Kitchen sink faucet is leaking continuously',
    },
    {
      id: '2',
      unit: '305',
      tenant: 'Mary Wanjiku',
      issue: 'Broken door lock',
      priority: 'high',
      status: 'in_progress',
      date: '2024-12-08',
      description: 'Main door lock not functioning properly',
    },
    {
      id: '3',
      unit: '108',
      tenant: 'Peter Omondi',
      issue: 'Air conditioning',
      priority: 'medium',
      status: 'pending',
      date: '2024-12-09',
      description: 'AC unit making loud noise',
    },
  ];

  const filteredRequests =
    filter === 'all'
      ? maintenanceRequests
      : maintenanceRequests.filter((req) => req.status === filter);

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert(`Request ${requestId} updated to ${newStatus}`);
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[priority as keyof typeof colors]
        }`}
      >
        {priority.toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-bg-secondary text-tx-primary',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[status as keyof typeof colors]
        }`}
      >
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const columns = [
    {
      header: 'Unit',
      accessor: (row: typeof maintenanceRequests[0]) => row.unit,
    },
    {
      header: 'Tenant',
      accessor: (row: typeof maintenanceRequests[0]) => row.tenant,
    },
    {
      header: 'Issue',
      accessor: (row: typeof maintenanceRequests[0]) => row.issue,
    },
    {
      header: 'Priority',
      accessor: (row: typeof maintenanceRequests[0]) => getPriorityBadge(row.priority),
    },
    {
      header: 'Status',
      accessor: (row: typeof maintenanceRequests[0]) => getStatusBadge(row.status),
    },
    {
      header: 'Date',
      accessor: (row: typeof maintenanceRequests[0]) => row.date,
    },
    {
      header: 'Actions',
      accessor: (row: typeof maintenanceRequests[0]) => (
        <select
          onChange={(e) => handleStatusChange(row.id, e.target.value)}
          className="px-3 py-1 border border-bd-strong rounded text-sm"
          defaultValue={row.status}
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      ),
    },
  ];

  return (
    <DashboardLayout role="caretaker">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-tx-primary">Maintenance Requests</h1>
          <p className="text-tx-secondary mt-1">Manage and track all maintenance activities</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((stat, index) => (
            <StatCard key={index} title={stat.title} label={stat.label} value={stat.value} change={stat.change} icon={stat.icon} trend={stat.trend} />
          ))}
        </div>

        <div className="flex gap-2">
          {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as typeof filter)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-bg-secondary text-tx-secondary hover:bg-bd'
              }`}
            >
              {status.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div className="bg-bg-card rounded-lg shadow-sm border p-6">
          <DataTable data={filteredRequests} columns={columns} />
        </div>
      </div>
    </DashboardLayout>
  );
}