'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Target, Plus, Phone, Mail, Calendar, Loader2, User } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { apiClient } from '@/app/lib/api-services';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  property_interest: string;
  budget: number;
  status: string;
  source: string;
  created_at: string;
  notes: string;
}

interface Stats {
  totalLeads: number;
  newLeads: number;
  contacted: number;
  converted: number;
}

export default function AgentLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    property_interest: '',
    budget: '',
    source: 'website',
    notes: '',
  });

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.get('/agent/leads/');

        if (response.success && response.data) {
          const data = response.data;
          setStats({
            totalLeads: data.total_leads || data.totalLeads || 0,
            newLeads: data.new_leads || data.newLeads || 0,
            contacted: data.contacted || 0,
            converted: data.converted || 0,
          });

          const items = data.leads || [];
          setLeads(items.map((l: any) => ({
            id: l.id?.toString() || '',
            name: l.name || l.full_name || '',
            email: l.email || '',
            phone: l.phone || '',
            property_interest: l.property_interest || l.propertyInterest || '',
            budget: l.budget || 0,
            status: l.status || 'new',
            source: l.source || '',
            created_at: l.created_at || l.createdAt || '',
            notes: l.notes || '',
          })));
        } else {
          setStats({ totalLeads: 0, newLeads: 0, contacted: 0, converted: 0 });
          setLeads([]);
        }
      } catch (err) {
        console.error('Failed to fetch leads:', err);
        setError('Failed to load leads');
        setStats({ totalLeads: 0, newLeads: 0, contacted: 0, converted: 0 });
        setLeads([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Please fill in required fields (Name and Phone)');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiClient.post('/agent/leads/', {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : 0,
      });

      if (response.success) {
        alert('Lead added successfully!');
        setShowForm(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          property_interest: '',
          budget: '',
          source: 'website',
          notes: '',
        });
        // Refresh leads
        const refreshResponse = await apiClient.get('/agent/leads/');
        if (refreshResponse.success && refreshResponse.data) {
          const items = refreshResponse.data.leads || [];
          setLeads(items.map((l: any) => ({
            id: l.id?.toString() || '',
            name: l.name || l.full_name || '',
            email: l.email || '',
            phone: l.phone || '',
            property_interest: l.property_interest || l.propertyInterest || '',
            budget: l.budget || 0,
            status: l.status || 'new',
            source: l.source || '',
            created_at: l.created_at || l.createdAt || '',
            notes: l.notes || '',
          })));
        }
      } else {
        alert(response.error || 'Failed to add lead');
      }
    } catch (err) {
      console.error('Failed to add lead:', err);
      alert('Failed to add lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (filter === 'all') return true;
    return lead.status === filter;
  });

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      header: 'Lead',
      accessor: (row: Lead) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-sm text-gray-500">{row.source}</p>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: (row: Lead) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-3 h-3 text-gray-400" />
            {row.phone || '-'}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-3 h-3 text-gray-400" />
            {row.email || '-'}
          </div>
        </div>
      ),
    },
    {
      header: 'Interest',
      accessor: (row: Lead) => row.property_interest || '-',
    },
    {
      header: 'Budget',
      accessor: (row: Lead) => row.budget ? formatCurrency(row.budget) : '-',
    },
    {
      header: 'Status',
      accessor: (row: Lead) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
          {row.status.toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: (row: Lead) => row.created_at || '-',
    },
  ];

  const statsCards = stats ? [
    { title: 'Total Leads', label: 'All time', value: stats.totalLeads.toString(), icon: Target, trend: "up" as const },
    { title: 'New Leads', label: 'This month', value: stats.newLeads.toString(), icon: User, trend: "up" as const },
    { title: 'Contacted', label: 'In progress', value: stats.contacted.toString(), icon: Phone, trend: "up" as const },
    { title: 'Converted', label: 'Success', value: stats.converted.toString(), icon: Calendar, trend: "up" as const },
  ] : [];

  // Mobile card view
  const MobileCardView = () => (
    <div className="space-y-4 md:hidden">
      {filteredLeads.map((lead) => (
        <div key={lead.id} className="bg-white rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-gray-900">{lead.name}</p>
              <p className="text-sm text-gray-500">{lead.source}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
              {lead.status.toUpperCase()}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            {lead.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href={`tel:${lead.phone}`} className="text-blue-600">{lead.phone}</a>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
          </div>
          <div className="pt-2 border-t grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Interest</p>
              <p className="font-medium">{lead.property_interest || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500">Budget</p>
              <p className="font-medium">{lead.budget ? formatCurrency(lead.budget) : '-'}</p>
            </div>
          </div>
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
            <p className="text-gray-600">Loading leads...</p>
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Leads Management</h1>
            <p className="text-gray-600 mt-1">Track and manage your property leads</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Lead
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
            <h2 className="text-lg font-semibold mb-4">Add New Lead</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Phone number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget (KES)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Budget amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Interest</label>
                  <input
                    type="text"
                    value={formData.property_interest}
                    onChange={(e) => setFormData({ ...formData, property_interest: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 2BR Apartment, Westlands"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="social_media">Social Media</option>
                    <option value="walk_in">Walk-in</option>
                    <option value="phone">Phone Inquiry</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Additional notes about this lead"
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
                      Adding...
                    </>
                  ) : (
                    'Add Lead'
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
            {['all', 'new', 'contacted', 'qualified', 'converted', 'lost'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No leads found</p>
            <p className="text-gray-400 text-sm mt-1">Click "Add Lead" to create your first lead</p>
          </div>
        ) : (
          <>
            <MobileCardView />
            <div className="hidden md:block bg-white rounded-lg shadow-sm border p-6">
              <DataTable data={filteredLeads} columns={columns} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
