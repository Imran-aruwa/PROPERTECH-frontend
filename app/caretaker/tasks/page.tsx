'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ClipboardList, Plus, Loader2, CheckCircle } from 'lucide-react';
import { apiClient } from '@/app/lib/api-services';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string;
}

export default function CaretakerTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.get('/caretaker/tasks/');

        if (response.success && response.data) {
          const items = response.data.tasks || response.data || [];
          setTasks(Array.isArray(items) ? items.map((t: any) => ({
            id: t.id?.toString() || '',
            title: t.title || t.description || '',
            description: t.description || '',
            priority: t.priority || 'medium',
            status: t.status || 'pending',
            due_date: t.due_date || t.dueDate || '',
          })) : []);
        } else {
          setTasks([]);
        }
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        setError('Failed to load tasks');
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleToggleComplete = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await apiClient.put(`/caretaker/tasks/${taskId}/`, { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-bg-secondary';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="caretaker">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-tx-secondary">Loading tasks...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="caretaker">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-tx-primary">My Tasks</h1>
            <p className="text-tx-secondary mt-1">Manage your daily tasks and responsibilities</p>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}. Showing empty state.</p>
          </div>
        )}

        <div className="bg-bg-card rounded-lg shadow-sm border p-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'in_progress', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-bg-secondary text-tx-secondary hover:bg-bd'
                }`}
              >
                {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-bg-card rounded-lg border">
            <ClipboardList className="w-12 h-12 text-tx-muted mx-auto mb-4" />
            <p className="text-tx-muted">No tasks found</p>
            <p className="text-tx-muted text-sm mt-1">Tasks assigned to you will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`bg-bg-card rounded-lg border-l-4 shadow-sm p-4 ${getPriorityColor(task.priority)}`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleToggleComplete(task.id, task.status)}
                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                      task.status === 'completed'
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-bd-strong hover:border-green-500'
                    }`}
                  >
                    {task.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                  </button>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-tx-primary ${task.status === 'completed' ? 'line-through text-tx-muted' : ''}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-tx-secondary text-sm mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority.toUpperCase()}
                      </span>
                      {task.due_date && (
                        <span className="text-sm text-tx-muted">Due: {task.due_date}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
