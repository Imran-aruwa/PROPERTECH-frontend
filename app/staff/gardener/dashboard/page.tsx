'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Leaf, CheckSquare, Package, Clock, Loader2 } from 'lucide-react';
import { gardenerApi } from '@/app/lib/api-services';

interface DashboardStats {
  tasksToday: number;
  completed: number;
  equipmentAvailable: number;
  hoursLogged: number;
}

interface Task {
  id: string;
  task: string;
  time: string;
  done: boolean;
}

interface Equipment {
  id: string;
  name: string;
  status: string;
}

export default function GardenerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await gardenerApi.getDashboard();

        if (response.success && response.data) {
          const data = response.data;
          setStats({
            tasksToday: data.tasks_today || data.tasksToday || 0,
            completed: data.completed || data.completedTasks || 0,
            equipmentAvailable: data.equipment_available || data.equipmentAvailable || 0,
            hoursLogged: data.hours_logged || data.hoursLogged || 0,
          });
          setTodaysTasks(data.todays_tasks || data.todaysTasks || data.schedule || []);
          setEquipment(data.equipment || data.equipment_status || []);
        } else {
          setStats({
            tasksToday: 0,
            completed: 0,
            equipmentAvailable: 0,
            hoursLogged: 0,
          });
          setTodaysTasks([]);
          setEquipment([]);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
        setError('Failed to load dashboard data');
        setStats({
          tasksToday: 0,
          completed: 0,
          equipmentAvailable: 0,
          hoursLogged: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const getEquipmentStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'available') return 'text-green-600';
    if (normalizedStatus === 'in use') return 'text-blue-600';
    if (normalizedStatus === 'maintenance') return 'text-yellow-600';
    return 'text-gray-600';
  };

  const statsCards = stats ? [
    { title: 'Tasks Today', label: 'Tasks Today', value: stats.tasksToday.toString(), change: 'Scheduled', icon: CheckSquare, trend: "up" as const },
    { title: 'Completed', label: 'Completed', value: stats.completed.toString(), change: `${stats.tasksToday > 0 ? Math.round((stats.completed / stats.tasksToday) * 100) : 0}%`, icon: Leaf, trend: "up" as const },
    { title: 'Equipment', label: 'Equipment', value: stats.equipmentAvailable.toString(), change: 'Available', icon: Package, trend: "up" as const },
    { title: 'Hours Logged', label: 'Hours Logged', value: stats.hoursLogged.toString(), change: 'Today', icon: Clock, trend: "up" as const },
  ] : [];

  if (isLoading) {
    return (
      <DashboardLayout role="gardener">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="gardener">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gardener Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage landscaping tasks and equipment</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}. Showing empty state.</p>
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <StatCard key={index} title={stat.title} label={stat.label} value={stat.value} change={stat.change} icon={stat.icon} trend={stat.trend} />
          ))}
        </div>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-green-600" />
              Today's Schedule
            </h2>
            {todaysTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No tasks scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysTasks.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={item.done}
                      className="h-5 w-5 rounded text-green-600"
                      readOnly
                    />
                    <div className="flex-1">
                      <p className={item.done ? 'line-through text-gray-500' : 'text-gray-900'}>
                        {item.task}
                      </p>
                      <p className="text-sm text-gray-600">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Equipment Status
            </h2>
            {equipment.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No equipment registered</p>
              </div>
            ) : (
              <div className="space-y-3">
                {equipment.map((eq) => (
                  <div key={eq.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">{eq.name}</span>
                    <span className={`text-xs font-medium ${getEquipmentStatusColor(eq.status)}`}>
                      {eq.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
