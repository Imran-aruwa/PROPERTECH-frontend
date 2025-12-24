'use client'

import { useState } from 'react'
import { BarChart3, Search } from 'lucide-react'

type GuardPerformance = {
  id: string
  guardName: string
  post: string
  period: string
  rating: number // 1–5
  incidentsHandled: number
  attendanceScore: number // 0–100
}

export default function SecurityPerformancePage() {
  const [search, setSearch] = useState('')
  const [minRating, setMinRating] = useState<number | null>(null)
  const [performance] = useState<GuardPerformance[]>([])

  const filtered = performance.filter((r) => {
    const matchesSearch =
      !search ||
      r.guardName.toLowerCase().includes(search.toLowerCase()) ||
      r.post.toLowerCase().includes(search.toLowerCase())
    const matchesRating = minRating == null || r.rating >= minRating
    return matchesSearch && matchesRating
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-sky-600" />
              <h1 className="text-2xl font-semibold text-slate-900">
                Security Performance
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Review guard performance based on attendance, incident handling, and ratings.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guard or post..."
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Minimum rating:</span>
            <div className="flex flex-wrap gap-2">
              {[null, 3, 4, 5].map((value) => (
                <button
                  key={value === null ? 'all' : value}
                  type="button"
                  onClick={() => setMinRating(value)}
                  className={`rounded-full px-3 py-1 border text-xs font-medium ${
                    minRating === value
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {value === null ? 'All' : `${value}+`}
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
                No performance records yet
              </p>
              <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                Once you start evaluating security staff, performance summaries
                and scores will appear here for each guard and time period.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Guard
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Post
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Period
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Rating
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Incidents handled
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Attendance score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900">{r.guardName}</td>
                      <td className="px-4 py-3 text-slate-700">{r.post}</td>
                      <td className="px-4 py-3 text-slate-700">{r.period}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <span className="font-semibold">{r.rating.toFixed(1)}</span>
                        <span className="text-xs text-slate-400 ml-1">/ 5</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {r.incidentsHandled}
                      </td>
                      <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              r.attendanceScore >= 90
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : r.attendanceScore >= 75
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}
                          >
                            {r.attendanceScore}%
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
