// ============================================
// FILE: components/incidents/IncidentForm.tsx  
// ============================================
'use client';

import { useState } from 'react';
import { AlertTriangle, MapPin, Clock, User } from 'lucide-react';

interface IncidentFormProps {
  onSubmit: (data: IncidentData) => Promise<void>;
  onCancel: () => void;
}

export interface IncidentData {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  reportedBy: string;
}

export function IncidentForm({ onSubmit, onCancel }: IncidentFormProps) {
  const [formData, setFormData] = useState<IncidentData>({
    type: '',
    severity: 'medium',
    location: '',
    description: '',
    reportedBy: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        type: '',
        severity: 'medium',
        location: '',
        description: '',
        reportedBy: '',
      });
    } catch (error) {
      console.error('Failed to submit incident', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-tx-secondary mb-2">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          Incident Type
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-4 py-2 border border-bd-strong rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Select type...</option>
          <option value="security">Security Breach</option>
          <option value="theft">Theft/Vandalism</option>
          <option value="disturbance">Noise Disturbance</option>
          <option value="unauthorized">Unauthorized Access</option>
          <option value="suspicious">Suspicious Activity</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-tx-secondary mb-2">
          Severity
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setFormData({ ...formData, severity: level })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                formData.severity === level
                  ? level === 'critical'
                    ? 'bg-red-600 text-white'
                    : level === 'high'
                    ? 'bg-orange-600 text-white'
                    : level === 'medium'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-green-600 text-white'
                  : 'bg-bg-secondary text-tx-secondary hover:bg-bd'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-tx-secondary mb-2">
          <MapPin className="w-4 h-4 inline mr-2" />
          Location
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="e.g., Main Gate, Building A - Floor 3"
          className="w-full px-4 py-2 border border-bd-strong rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-tx-secondary mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          placeholder="Provide detailed description of the incident..."
          className="w-full px-4 py-2 border border-bd-strong rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-tx-secondary mb-2">
          <User className="w-4 h-4 inline mr-2" />
          Reported By
        </label>
        <input
          type="text"
          value={formData.reportedBy}
          onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
          placeholder="Your name"
          className="w-full px-4 py-2 border border-bd-strong rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-bd text-tx-secondary px-6 py-3 rounded-lg hover:bg-bg-hover font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}