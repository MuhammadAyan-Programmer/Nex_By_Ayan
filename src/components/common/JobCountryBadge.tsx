import React from 'react';
import { getCountryEligibility } from '../../utils/countryUtils';
import { Globe } from 'lucide-react';

interface JobCountryBadgeProps {
  country?: string;
  size?: 'xs' | 'sm' | 'md';
  showDetails?: boolean;
  className?: string;
}

export const JobCountryBadge: React.FC<JobCountryBadgeProps> = ({
  country,
  size = 'sm',
  showDetails = false,
  className = '',
}) => {
  const info = getCountryEligibility(country);

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-[11px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  }[size];

  const colorClasses = info.isWorldwide
    ? 'bg-blue-50 text-blue-800 border-blue-200/80 hover:bg-blue-100/70'
    : 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/70';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md border transition-colors shadow-2xs ${sizeClasses} ${colorClasses} ${className}`}
      title={info.description}
    >
      <span className="text-sm leading-none shrink-0">{info.flag}</span>
      <span className="truncate">{info.label}</span>
      {showDetails && (
        <span className="text-[10px] font-normal text-slate-500 border-l border-slate-300/60 pl-1.5 ml-0.5">
          Open Worldwide
        </span>
      )}
    </span>
  );
};
