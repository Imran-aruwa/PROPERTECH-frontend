'use client'

import { useState } from 'react'
import { ClipboardList, Plus, Search } from 'lucide-react'

type GardenerTask = {
  id: string
  title: string
  property: string
  priority: 'Low' | 'Medium' | 'High'
  status: 'Open' | 'In Progress' | 'Done'
  dueDate?: string
}

export default function GardenerTasksPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | GardenerTask['status']>('All')
  const [tasks] = useState<GardenerTask[]>([])

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.property.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-7 h-7 text-emerald-600" />
              <h1 className="text-2xl font-semibold text-slate-900">
                Gardener Tasks
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Create and monitor daily gardening tasks for each property.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            New task
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search task or property..."
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Status:</span>
            <div className="flex flex-wrap gap-2">
              {(['All', 'Open', 'In Progress', 'Done'] as const).map((s) => (
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
          {filteredTasks.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-900">
                No gardener tasks created
              </p>
              <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                Use this section to manage recurring and one-time gardening tasks
                such as lawn mowing, hedge trimming, watering, and clean up.
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <Plus className="w-4 h-4" />
                Create first task
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Task
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Property
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Due date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900">{t.title}</td>
                      <td className="px-4 py-3 text-slate-700">{t.property}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            t.priority === 'High'
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : t.priority === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-slate-50 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            t.status === 'Done'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : t.status === 'In Progress'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-slate-50 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {t.dueDate || (
                          <span className="text-slate-400 text-xs italic">
                            Not set
                          </span>
                        )}
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
