// components/ui/Button.tsx
'use client'
import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'outline';
};

export default function Button({ variant = 'primary', className = '', children, ...rest }: Props) {
  const base = 'inline-flex items-center justify-center rounded-lg font-semibold transition';
  const style =
    variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700 px-4 py-2'
      : variant === 'ghost'
      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 px-4 py-2'
      : 'border border-gray-200 text-gray-900 hover:bg-gray-50 px-4 py-2';
  return (
    <button className={`${base} ${style} ${className}`} {...rest}>
      {children}
    </button>
  );
}
