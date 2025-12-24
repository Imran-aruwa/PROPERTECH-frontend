'use client'

import { useState } from 'react'
import { Leaf, Plus, Search } from 'lucide-react'

type GardenerEquipment = {
  id: string
  name: string
  category: string
  condition: 'Good' | 'Needs Service' | 'Out of Order'
  assignedTo?: string
}

export default function GardenerEquipmentPage() {
  const [search, setSearch] = useState('')
  const [conditionFilter, setConditionFilter] =
    useState<'All' | GardenerEquipment['condition']>('All')
  const [equipment] = useState<GardenerEquipment[]>([])

  const filtered = equipment.filter((item) => {
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
    const matchesCondition = conditionFilter === 'All' || item.condition === conditionFilter
    return matchesSearch && matchesCondition
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Leaf className="w-7 h-7 text-emerald-600" />
              <h1 className="text-2xl font-semibold text-slate-900">
                Gardener Equipment
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Track gardening tools, equipment condition, and staff assignments.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            Add equipment
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search equipment or category..."
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Condition:</span>
            <div className="flex flex-wrap gap-2">
              {(['All', 'Good', 'Needs Service', 'Out of Order'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setConditionFilter(c as any)}
                  className={`rounded-full px-3 py-1 border text-xs font-medium ${
                    conditionFilter === c
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {c}
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
                No gardening equipment recorded
              </p>
              <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                Add gardening tools and equipment to keep track of their condition,
                maintenance, and who is using them.
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <Plus className="w-4 h-4" />
                Add first equipment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Condition
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Assigned to
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900">{item.name}</td>
                      <td className="px-4 py-3 text-slate-700">{item.category}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            item.condition === 'Good'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : item.condition === 'Needs Service'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}
                        >
                          {item.condition}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {item.assignedTo || (
                          <span className="text-slate-400 text-xs italic">
                            Not assigned
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
