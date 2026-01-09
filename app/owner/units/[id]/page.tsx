'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Building2, User, CreditCard, Wrench, ArrowLeft, Plus, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Unit {
  id: string;
  unit_number: string;
  bedrooms: number;
  bathrooms: number;
  monthly_rent: number;
  status: string;
  property: { id: string; name: string; address: string; };
  tenant: { id: string; full_name: string; email: string; phone: string; balance_due: number; } | null;
  payments: Array<{ id: string; amount: number; status: string; payment_type: string; }>;
  maintenance_requests: Array<{ id: string; title: string; status: string; priority: string; }>;
}

type TabType = "overview" | "tenant" | "payments" | "maintenance";

export default function UnitDetailPage() {
  const { isAuthenticated, role, isLoading: authLoading, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const unitId = params?.id as string;
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (role && role !== "owner") { router.push("/unauthorized"); return; }
    const fetchUnit = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/units/" + unitId, { headers: { "Authorization": "Bearer " + token } });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Failed to fetch unit");
        setUnit(data.data);
      } catch (err: any) { setError(err.message); } finally { setLoading(false); }
    };
    if (unitId) fetchUnit();
  }, [authLoading, isAuthenticated, role, router, unitId, token]);

  const tabs = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "tenant", label: "Tenant", icon: User },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
  ];

  const formatCurrency = (amount: number) => "KES " + amount.toLocaleString();
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = { vacant: "bg-yellow-100 text-yellow-800", occupied: "bg-green-100 text-green-800", pending: "bg-yellow-100 text-yellow-800", completed: "bg-green-100 text-green-800" };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (authLoading || loading) return <DashboardLayout role="owner"><div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div></DashboardLayout>;
  if (error || !unit) return <DashboardLayout role="owner"><div className="text-center py-12"><p className="text-red-600">{error || "Unit not found"}</p></div></DashboardLayout>;

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{unit.unit_number}</h1>
            <p className="text-gray-500">{unit.property.name}</p>
          </div>
          <span className={"px-3 py-1 rounded-full text-sm font-medium " + getStatusBadge(unit.status)}>{unit.status}</span>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex gap-8">{tabs.map((tab) => (<button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={"flex items-center gap-2 py-4 border-b-2 font-medium text-sm " + (activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500")}><tab.icon className="w-4 h-4" />{tab.label}</button>))}</nav>
        </div>

        {activeTab === "overview" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Unit Details</h3>
              <dl className="space-y-3">
                <div className="flex justify-between"><dt className="text-gray-500">Bedrooms</dt><dd className="font-medium">{unit.bedrooms}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Bathrooms</dt><dd className="font-medium">{unit.bathrooms}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Monthly Rent</dt><dd className="font-medium text-green-600">{formatCurrency(unit.monthly_rent)}</dd></div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === "tenant" && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {unit.tenant ? (
              <dl className="grid gap-4 md:grid-cols-2">
                <div><dt className="text-gray-500 text-sm">Name</dt><dd className="font-medium">{unit.tenant.full_name}</dd></div>
                <div><dt className="text-gray-500 text-sm">Email</dt><dd className="font-medium">{unit.tenant.email}</dd></div>
                <div><dt className="text-gray-500 text-sm">Phone</dt><dd className="font-medium">{unit.tenant.phone}</dd></div>
                <div><dt className="text-gray-500 text-sm">Balance</dt><dd className="font-medium">{formatCurrency(unit.tenant.balance_due)}</dd></div>
              </dl>
            ) : (
              <div className="text-center py-8"><p className="text-gray-500 mb-4">No tenant assigned</p><Link href="/owner/tenants/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Add Tenant</Link></div>
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b"><h3 className="text-lg font-semibold">Payments</h3></div>
            {unit.payments?.length > 0 ? (<div className="divide-y">{unit.payments.map((p) => (<div key={p.id} className="p-4 flex justify-between"><span>{formatCurrency(p.amount)}</span><span className={"px-2 py-1 rounded text-sm " + getStatusBadge(p.status)}>{p.status}</span></div>))}</div>) : (<div className="p-8 text-center text-gray-500">No payments</div>)}
          </div>
        )}

        {activeTab === "maintenance" && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b"><h3 className="text-lg font-semibold">Maintenance</h3></div>
            {unit.maintenance_requests?.length > 0 ? (<div className="divide-y">{unit.maintenance_requests.map((m) => (<div key={m.id} className="p-4 flex justify-between"><span>{m.title}</span><span className={"px-2 py-1 rounded text-sm " + getStatusBadge(m.status)}>{m.status}</span></div>))}</div>) : (<div className="p-8 text-center text-gray-500">No requests</div>)}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
