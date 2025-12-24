'use client'

import { useState } from 'react'
import { CalendarCheck, Search } from 'lucide-react'

type SecurityAttendance = {
  id: string
  guardName: string
  post: string
  shift: 'Day' | 'Night'
  date: string
  status: 'Present' | 'Absent' | 'Late'
}

export default function SecurityAttendancePage() {
  const [search, setSearch] = useState('')
  const [shiftFilter, setShiftFilter] = useState<'All' | SecurityAttendance['shift']>('All')
  const [attendance] = useState<SecurityAttendance[]>([])

  const filtered = attendance.filter((r) => {
    const matchesSearch =
      !search ||
      r.guardName.toLowerCase().includes(search.toLowerCase()) ||
      r.post.toLowerCase().includes(search.toLowerCase())
    const matchesShift = shiftFilter === 'All' || r.shift === shiftFilter
    return matchesSearch && matchesShift
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-7 h-7 text-sky-600" />
              <h1 className="text-2xl font-semibold text-slate-900">
                Security Attendance
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Monitor guard attendance by date, shift, and post.
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
            <span className="text-slate-500">Shift:</span>
            <div className="flex flex-wrap gap-2">
              {(['All', 'Day', 'Night'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setShiftFilter(s as any)}
                  className={`rounded-full px-3 py-1 border text-xs font-medium ${
                    shiftFilter === s
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
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
                No attendance records yet
              </p>
              <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                Once you start recording guard attendance, you will see daily
                presence, lateness, and absence trends here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Guard
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Post
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Shift
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">{r.date}</td>
                      <td className="px-4 py-3 text-slate-900">{r.guardName}</td>
                      <td className="px-4 py-3 text-slate-700">{r.post}</td>
                      <td className="px-4 py-3 text-slate-700">{r.shift}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            r.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : r.status === 'Late'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}
                        >
                          {r.status}
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
