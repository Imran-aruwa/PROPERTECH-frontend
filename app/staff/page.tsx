'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRequireAuth } from '@/lib/auth-context';
import { staffApi, maintenanceApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/Toast';
import { CheckSquare, CheckCircle, Calendar, Wrench, Clock, TrendingUp, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function StaffDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth('staff');
  const { toasts, success, error: showError, removeToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [staffDataResponse, maintenanceDataResponse] = await Promise.all([
        staffApi.getAll(),
        maintenanceApi.getAll()
      ]);

      const staffData = Array.isArray(staffDataResponse) ? staffDataResponse : staffDataResponse.data;
      const maintenanceData = Array.isArray(maintenanceDataResponse) ? maintenanceDataResponse : maintenanceDataResponse.data;

      const currentStaff = staffData.find((s: any) => s.user_id === user?.id);
      if (currentStaff) {
        setStaffInfo(currentStaff);

        const assignedTasks = maintenanceData.filter(
          (m: any) => m.assigned_to === currentStaff.id && m.status !== 'completed'
        );
        setTasks(assignedTasks);

        const today = new Date().toISOString().split('T')[0];

        // Assuming attendance data is available on the staff object or fetch from all staff
        const attendanceData = currentStaff.attendance || [];
        setAttendance(attendanceData);

        const checkedInToday = attendanceData.some(
          (a: any) => a.date.startsWith(today) && a.check_in
        );
        setHasCheckedInToday(checkedInToday);
      }
    } catch (err: any) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchDashboardData();
    }
  }, [authLoading, isAuthenticated, fetchDashboardData]);

  const handleCheckIn = async () => {
    if (!staffInfo) return;

    try {
      setCheckingIn(true);
      await staffApi.create({
        staff_id: staffInfo.id,
        date: new Date().toISOString(),
        check_in: new Date().toISOString(),
        status: 'present'
      });
      success('Checked in successfully!');
      setHasCheckedInToday(true);
      fetchDashboardData();
    } catch (err: any) {
      showError(err.message || 'Failed to check in');
    } finally {
      setCheckingIn(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (!staffInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Staff Information Not Found</h2>
          <p className="text-gray-600">Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  const completedToday = tasks.filter(t => 
    t.completed_at && new Date(t.completed_at).toDateString() === new Date().toDateString()
  ).length;

  const thisMonthAttendance = attendance.filter(a => a.status === 'present').length;

  const stats = [
    {
      title: 'Pending Tasks',
      value: tasks.filter(t => t.status === 'pending').length,
      icon: CheckSquare,
      color: 'bg-yellow-500',
      link: '/staff/tasks'
    },
    {
      title: 'In Progress',
      value: tasks.filter(t => t.status === 'in_progress').length,
      icon: Clock,
      color: 'bg-blue-500',
      link: '/staff/tasks'
    },
    {
      title: 'Completed Today',
      value: completedToday,
      icon: CheckCircle,
      color: 'bg-green-500',
      link: '/staff/tasks'
    },
    {
      title: 'This Month',
      value: `${thisMonthAttendance} days`,
      icon: Calendar,
      color: 'bg-purple-500',
      link: '/staff/attendance'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.full_name || 'Staff Member'}!
              </h1>
              <p className="text-gray-600 mt-1">
                {staffInfo.position} • {staffInfo.department}
              </p>
            </div>
            {!hasCheckedInToday && (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                {checkingIn ? 'Checking In...' : 'Check In'}
              </button>
            )}
            {hasCheckedInToday && (
              <div className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-800 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                Checked In
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Link
              key={index}
              href={stat.link}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Tasks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Today&apos;s Tasks</h2>
              <Link
                href="/staff/tasks"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No pending tasks</p>
                <p className="text-sm text-gray-500 mt-1">All caught up! Great work!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {task.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Unit: {task.unit?.unit_number || 'N/A'}</span>
                      <span className={`px-2 py-1 rounded ${
                        task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Attendance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Attendance Summary</h2>
              <Link
                href="/staff/attendance"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>

            <div className="space-y-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-700 font-medium">This Month</span>
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-purple-900 mb-1">{thisMonthAttendance} days</p>
                <p className="text-sm text-purple-700">Present out of {new Date().getDate()} days</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-green-700 text-sm mb-1">On Time</p>
                  <p className="text-2xl font-bold text-green-900">
                    {attendance.filter(a => a.status === 'present').length}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-orange-700 text-sm mb-1">Late</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {attendance.filter(a => a.status === 'late').length}
                  </p>
                </div>
              </div>

              {attendance.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <h3 className="text-sm font-medium text-gray-700 sticky top-0 bg-white py-2">
                    Recent Check-ins
                  </h3>
                  {attendance.slice(0, 5).map((record, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-gray-100"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          Check-in: {record.check_in ? new Date(record.check_in).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : 'N/A'}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                        record.status === 'late' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link
            href="/staff/tasks"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <CheckSquare className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">View My Tasks</h3>
            <p className="text-sm text-gray-600">See all assigned maintenance tasks</p>
          </Link>

          <Link
            href="/staff/attendance"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <Calendar className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Attendance</h3>
            <p className="text-sm text-gray-600">View attendance history</p>
          </Link>

          <Link
            href="/staff/maintenance"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <Wrench className="w-8 h-8 text-red-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Maintenance</h3>
            <p className="text-sm text-gray-600">Update maintenance requests</p>
          </Link>
        </div>
      </div>
    </div>
  );
}