'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Calendar, Plus, Clock, MapPin, User, Loader2 } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { apiClient } from '@/app/lib/api-services';

interface Viewing {
  id: string;
  property: string;
  client_name: string;
  client_phone: string;
  date: string;
  time: string;
  status: string;
  notes: string;
}

interface Stats {
  totalViewings: number;
  scheduledToday: number;
  completed: number;
  cancelled: number;
}

export default function AgentViewingsPage() {
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    property: '',
    client_name: '',
    client_phone: '',
    date: '',
    time: '',
    notes: '',
  });

  useEffect(() => {
    const fetchViewings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.get('/agent/viewings/');

        if (response.success && response.data) {
          const data = response.data;
          setStats({
            totalViewings: data.total_viewings || data.totalViewings || 0,
            scheduledToday: data.scheduled_today || data.scheduledToday || 0,
            completed: data.completed || 0,
            cancelled: data.cancelled || 0,
          });

          const items = data.viewings || [];
          setViewings(items.map((v: any) => ({
            id: v.id?.toString() || '',
            property: v.property || v.property_name || '',
            client_name: v.client_name || v.clientName || '',
            client_phone: v.client_phone || v.clientPhone || '',
            date: v.date || '',
            time: v.time || '',
            status: v.status || 'scheduled',
            notes: v.notes || '',
          })));
        } else {
          setStats({ totalViewings: 0, scheduledToday: 0, completed: 0, cancelled: 0 });
          setViewings([]);
        }
      } catch (err) {
        console.error('Failed to fetch viewings:', err);
        setError('Failed to load viewings');
        setStats({ totalViewings: 0, scheduledToday: 0, completed: 0, cancelled: 0 });
        setViewings([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchViewings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.property.trim() || !formData.client_name.trim() || !formData.date || !formData.time) {
      alert('Please fill in required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiClient.post('/agent/viewings/', formData);

      if (response.success) {
        alert('Viewing scheduled successfully!');
        setShowForm(false);
        setFormData({ property: '', client_name: '', client_phone: '', date: '', time: '', notes: '' });
        // Refresh viewings
        const refreshResponse = await apiClient.get('/agent/viewings/');
        if (refreshResponse.success && refreshResponse.data) {
          const items = refreshResponse.data.viewings || [];
          setViewings(items.map((v: any) => ({
            id: v.id?.toString() || '',
            property: v.property || v.property_name || '',
            client_name: v.client_name || v.clientName || '',
            client_phone: v.client_phone || v.clientPhone || '',
            date: v.date || '',
            time: v.time || '',
            status: v.status || 'scheduled',
            notes: v.notes || '',
          })));
        }
      } else {
        alert(response.error || 'Failed to schedule viewing');
      }
    } catch (err) {
      console.error('Failed to schedule viewing:', err);
      alert('Failed to schedule viewing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredViewings = viewings.filter(viewing => {
    if (filter === 'all') return true;
    return viewing.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      header: 'Property',
      accessor: (row: Viewing) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          {row.property}
        </div>
      ),
    },
    {
      header: 'Client',
      accessor: (row: Viewing) => (
        <div>
          <p className="font-medium text-gray-900">{row.client_name}</p>
          <p className="text-sm text-gray-500">{row.client_phone}</p>
        </div>
      ),
    },
    {
      header: 'Date & Time',
      accessor: (row: Viewing) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          {row.date} at {row.time}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row: Viewing) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
          {row.status.replace('_', ' ').toUpperCase()}
        </span>
      ),
    },
  ];

  const statsCards = stats ? [
    { title: 'Total Viewings', label: 'This month', value: stats.totalViewings.toString(), icon: Calendar, trend: "up" as const },
    { title: 'Today', label: 'Scheduled', value: stats.scheduledToday.toString(), icon: Clock, trend: "up" as const },
    { title: 'Completed', label: 'This month', value: stats.completed.toString(), icon: User, trend: "up" as const },
    { title: 'Cancelled', label: 'This month', value: stats.cancelled.toString(), icon: Calendar, trend: "up" as const },
  ] : [];

  // Mobile card view
  const MobileCardView = () => (
    <div className="space-y-4 md:hidden">
      {filteredViewings.map((viewing) => (
        <div key={viewing.id} className="bg-white rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-gray-900">{viewing.property}</p>
              <p className="text-sm text-gray-500">{viewing.client_name}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewing.status)}`}>
              {viewing.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {viewing.date}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {viewing.time}
            </div>
          </div>
          {viewing.client_phone && (
            <a href={`tel:${viewing.client_phone}`} className="text-blue-600 text-sm">
              {viewing.client_phone}
            </a>
          )}
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <DashboardLayout role="agent">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading viewings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="agent">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Property Viewings</h1>
            <p className="text-gray-600 mt-1">Schedule and manage property viewings</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Schedule Viewing
          </button>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}. Showing empty state.</p>
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <StatCard key={index} title={stat.title} label={stat.label} value={stat.value} icon={stat.icon} trend={stat.trend} />
          ))}
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4">Schedule New Viewing</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property *</label>
                  <input
                    type="text"
                    value={formData.property}
                    onChange={(e) => setFormData({ ...formData, property: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Property name or address"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Name *</label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Client full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Phone</label>
                  <input
                    type="tel"
                    value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Additional notes"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    'Schedule Viewing'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'scheduled', 'completed', 'cancelled', 'no_show'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'no_show' ? 'No Show' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredViewings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No viewings found</p>
            <p className="text-gray-400 text-sm mt-1">Click "Schedule Viewing" to create your first viewing</p>
          </div>
        ) : (
          <>
            <MobileCardView />
            <div className="hidden md:block bg-white rounded-lg shadow-sm border p-6">
              <DataTable data={filteredViewings} columns={columns} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
