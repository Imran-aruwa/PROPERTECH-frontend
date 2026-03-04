import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface PaymentCardProps {
  title: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'not_due';
  dueDate?: string;
  paidDate?: string;
  daysOverdue?: number;
  onPayNow?: () => void;
  className?: string;
}

export function PaymentCard({
  title,
  amount,
  status,
  dueDate,
  paidDate,
  daysOverdue,
  onPayNow,
  className = '',
}: PaymentCardProps) {
  const statusConfig = {
    paid: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Paid',
    },
    pending: {
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      label: 'Pending',
    },
    overdue: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      label: 'Overdue',
    },
    not_due: {
      icon: AlertCircle,
      color: 'text-tx-secondary',
      bgColor: 'bg-bg-secondary',
      borderColor: 'border-bd',
      label: 'Not Due',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const formatCurrency = (value: number) => {
    return `KES ${value.toLocaleString()}`;
  };

  return (
    <div
      className={`bg-bg-card rounded-lg border-2 ${config.borderColor} p-6 ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-tx-primary">{title}</h3>
          <p className="text-2xl font-bold text-tx-primary mt-2">
            {formatCurrency(amount)}
          </p>
        </div>
        <div className={`p-3 ${config.bgColor} rounded-lg`}>
          <Icon className={`w-6 h-6 ${config.color}`} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-tx-secondary">Status:</span>
          <span className={`text-sm font-semibold ${config.color}`}>
            {config.label}
          </span>
        </div>

        {dueDate && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-tx-secondary">Due Date:</span>
            <span className="text-sm font-medium text-tx-primary">{dueDate}</span>
          </div>
        )}

        {paidDate && status === 'paid' && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-tx-secondary">Paid Date:</span>
            <span className="text-sm font-medium text-tx-primary">{paidDate}</span>
          </div>
        )}

        {daysOverdue && daysOverdue > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-tx-secondary">Days Overdue:</span>
            <span className="text-sm font-semibold text-red-600">
              {daysOverdue} days
            </span>
          </div>
        )}
      </div>

      {onPayNow && (status === 'pending' || status === 'overdue') && (
        <button
          onClick={onPayNow}
          className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Pay Now
        </button>
      )}
    </div>
  );
}