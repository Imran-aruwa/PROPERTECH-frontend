'use client'

import { useState } from 'react'
import { CalendarRange, Plus, Search } from 'lucide-react'

type GardenerAssignment = {
  id: string
  property: string
  area: string
  schedule: string
  status: 'Pending' | 'In Progress' | 'Completed'
}

export default function GardenerAssignmentsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | GardenerAssignment['status']>('All')
  const [assignments] = useState<GardenerAssignment[]>([])

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      !search ||
      a.property.toLowerCase().includes(search.toLowerCase()) ||
      a.area.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarRange className="w-7 h-7 text-emerald-600" />
              <h1 className="text-2xl font-semibold text-slate-900">
                Gardener Assignments
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Plan and track gardening assignments across your properties.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            New assignment
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search property or area..."
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Status:</span>
            <div className="flex flex-wrap gap-2">
              {(['All', 'Pending', 'In Progress', 'Completed'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s as any)}
                  className={`rounded-full px-3 py-1 border text-xs font-medium ${
                    statusFilter === s
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
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
          {filteredAssignments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-900">
                No gardener assignments yet
              </p>
              <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                When you create assignments for gardeners, they will appear here with
                their schedule, property, and status.
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <Plus className="w-4 h-4" />
                Create first assignment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Property
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Area
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Schedule
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssignments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900">{a.property}</td>
                      <td className="px-4 py-3 text-slate-700">{a.area}</td>
                      <td className="px-4 py-3 text-slate-700">{a.schedule}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            a.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : a.status === 'In Progress'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-slate-50 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {a.status}
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
