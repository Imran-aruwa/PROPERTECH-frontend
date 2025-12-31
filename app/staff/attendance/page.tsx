'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '@/app/lib/api-services';

interface AttendanceRecord {
  id: string;
  date: string;
  check_in: string;
  check_out: string;
  status: string;
  hours_worked: number;
}

export default function StaffAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.get('/staff/attendance/');

        if (response.success && response.data) {
          const data = response.data;
          setIsCheckedIn(data.is_checked_in || data.isCheckedIn || false);
          const items = data.records || data.attendance || [];
          setRecords(Array.isArray(items) ? items.map((r: any) => ({
            id: r.id?.toString() || '',
            date: r.date || '',
            check_in: r.check_in || r.checkIn || '-',
            check_out: r.check_out || r.checkOut || '-',
            status: r.status || 'present',
            hours_worked: r.hours_worked || r.hoursWorked || 0,
          })) : []);
        } else {
          setRecords([]);
        }
      } catch (err) {
        console.error('Failed to fetch attendance:', err);
        setError('Failed to load attendance');
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const handleCheckIn = async () => {
    try {
      const response = await apiClient.post('/staff/attendance/check-in/');
      if (response.success) {
        setIsCheckedIn(true);
        alert('Checked in successfully!');
      }
    } catch (err) {
      console.error('Failed to check in:', err);
      alert('Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      const response = await apiClient.post('/staff/attendance/check-out/');
      if (response.success) {
        setIsCheckedIn(false);
        alert('Checked out successfully!');
      }
    } catch (err) {
      console.error('Failed to check out:', err);
      alert('Failed to check out');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'half_day': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">Track your daily attendance</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}. Showing empty state.</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Today's Attendance</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleCheckIn}
              disabled={isCheckedIn}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium transition ${
                isCheckedIn
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              {isCheckedIn ? 'Already Checked In' : 'Check In'}
            </button>
            <button
              onClick={handleCheckOut}
              disabled={!isCheckedIn}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium transition ${
                !isCheckedIn
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              <XCircle className="w-5 h-5" />
              Check Out
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Attendance History</h2>
          {records.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No attendance records</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Check In</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Check Out</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Hours</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{record.date}</td>
                      <td className="px-4 py-3 text-gray-600">{record.check_in}</td>
                      <td className="px-4 py-3 text-gray-600">{record.check_out}</td>
                      <td className="px-4 py-3 text-gray-600">{record.hours_worked}h</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {record.status.replace('_', ' ').toUpperCase()}
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
  );
}
