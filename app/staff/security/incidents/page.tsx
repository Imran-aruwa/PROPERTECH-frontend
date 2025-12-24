'use client'

import { useState } from 'react'
import { AlertTriangle, Plus, Search } from 'lucide-react'

type SecurityIncident = {
  id: string
  title: string
  property: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  status: 'Open' | 'Under Review' | 'Closed'
  reportedAt: string
}

export default function SecurityIncidentsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<'All' | SecurityIncident['status']>('All')
  const [incidents] = useState<SecurityIncident[]>([])

  const filtered = incidents.filter((i) => {
    const matchesSearch =
      !search ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.property.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || i.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
              <h1 className="text-2xl font-semibold text-slate-900">
                Security Incidents
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Log and track security incidents across all properties.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            Report incident
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search incident or property..."
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Status:</span>
            <div className="flex flex-wrap gap-2">
              {(['All', 'Open', 'Under Review', 'Closed'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s as any)}
                  className={`rounded-full px-3 py-1 border text-xs font-medium ${
                    statusFilter === s
                      ? 'border-rose-500 bg-rose-50 text-rose-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table / Empty state */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-900">
                No security incidents reported
              </p>
              <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                Use this section to log security incidents, track severity, and
                follow up until resolution.
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
              >
                <Plus className="w-4 h-4" />
                Report first incident
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Reported
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Property
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Severity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">{i.reportedAt}</td>
                      <td className="px-4 py-3 text-slate-900">{i.title}</td>
                      <td className="px-4 py-3 text-slate-700">{i.property}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            i.severity === 'Critical'
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : i.severity === 'High'
                              ? 'bg-orange-50 text-orange-700 border border-orange-100'
                              : i.severity === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-slate-50 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {i.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            i.status === 'Closed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : i.status === 'Under Review'
                              ? 'bg-sky-50 text-sky-700 border border-sky-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}
                        >
                          {i.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
