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
      ? 'bg-bg-secondary text-tx-primary hover:bg-bd px-4 py-2'
      : 'border border-bd text-tx-primary hover:bg-bg-hover px-4 py-2';
  return (
    <button className={`${base} ${style} ${className}`} {...rest}>
      {children}
    </button>
  );
}
