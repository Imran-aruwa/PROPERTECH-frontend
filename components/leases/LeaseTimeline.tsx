'use client';

import { LeaseStatus } from '@/app/lib/types';
import { Check } from 'lucide-react';

const STEPS: { key: LeaseStatus; label: string }[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'signed', label: 'Signed' },
  { key: 'active', label: 'Active' },
  { key: 'expired', label: 'Expired' },
];

const STATUS_ORDER: Record<LeaseStatus, number> = {
  draft: 0,
  sent: 1,
  signed: 2,
  active: 3,
  expired: 4,
};

interface LeaseTimelineProps {
  status: LeaseStatus;
  dates?: Record<string, string>;
}

export function LeaseTimeline({ status, dates }: LeaseTimelineProps) {
  const currentIndex = STATUS_ORDER[status];

  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span
                className={`mt-1 text-xs ${
                  isCurrent ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
              {dates?.[step.key] && (
                <span className="text-[10px] text-gray-400">{dates[step.key]}</span>
              )}
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 ${
                  index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
