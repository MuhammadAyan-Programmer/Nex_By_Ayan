import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'green' | 'amber' | 'purple' | 'red' | 'gray' | 'indigo';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200/60',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/60',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/60',
    red: 'bg-rose-50 text-rose-700 border-rose-200/60',
    gray: 'bg-slate-100 text-slate-700 border-slate-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium rounded-md',
    md: 'text-xs px-2.5 py-1 font-semibold rounded-md',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 border whitespace-nowrap ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
