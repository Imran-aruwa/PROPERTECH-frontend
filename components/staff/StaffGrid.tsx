import { User, Phone, Mail, CheckCircle, XCircle, Clock } from 'lucide-react';

interface StaffMember {
  id: number | string;
  name: string;
  role: string;
  status: 'on_duty' | 'off_duty' | 'on_leave' | 'sick';
  assignment?: string;
  checkInTime?: string;
  phone?: string;
  email?: string;
  performanceRating?: number;
}

interface StaffGridProps {
  staff: StaffMember[];
  onContact?: (staffId: number | string, method: 'phone' | 'email') => void;
  className?: string;
}

export function StaffGrid({ staff, onContact, className = '' }: StaffGridProps) {
  const statusConfig = {
    on_duty: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'On Duty',
    },
    off_duty: {
      icon: XCircle,
      color: 'text-tx-secondary',
      bgColor: 'bg-bg-secondary',
      borderColor: 'border-bd',
      label: 'Off Duty',
    },
    on_leave: {
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      label: 'On Leave',
    },
    sick: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      label: 'Sick Leave',
    },
  };

  const renderStars = (rating: number = 0) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-tx-muted'
            }`}
            viewBox="0 0 20 20"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {staff.map((member) => {
        const config = statusConfig[member.status];
        const Icon = config.icon;

        return (
          <div
            key={member.id}
            className={`bg-bg-card rounded-lg border-2 ${config.borderColor} p-4 hover:shadow-md transition-shadow`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${config.bgColor} rounded-full`}>
                  <User className={`w-5 h-5 ${config.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-tx-primary">{member.name}</h3>
                  <p className="text-sm text-tx-secondary">{member.role}</p>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.color}`}
              >
                {config.label}
              </span>
            </div>

            {/* Assignment */}
            {member.assignment && (
              <div className="mb-3 p-2 bg-blue-50 rounded text-sm">
                <span className="font-medium text-blue-900">Assignment:</span>
                <p className="text-blue-700">{member.assignment}</p>
              </div>
            )}

            {/* Check-in Time */}
            {member.checkInTime && (
              <div className="mb-3 text-sm">
                <span className="text-tx-secondary">Check-in:</span>
                <span className="ml-2 font-medium text-tx-primary">
                  {member.checkInTime}
                </span>
              </div>
            )}

            {/* Performance Rating */}
            {member.performanceRating && (
              <div className="mb-3">
                <p className="text-xs text-tx-secondary mb-1">Performance</p>
                {renderStars(member.performanceRating)}
              </div>
            )}

            {/* Contact Buttons */}
            <div className="flex gap-2 border-t border-bd pt-3">
              {member.phone && (
                <button
                  onClick={() => onContact?.(member.id, 'phone')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">Call</span>
                </button>
              )}
              {member.email && (
                <button
                  onClick={() => onContact?.(member.id, 'email')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-bg-secondary text-tx-secondary rounded-lg hover:bg-bg-hover transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">Email</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}