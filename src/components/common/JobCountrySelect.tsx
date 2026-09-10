import React, { useState, useRef, useEffect, useMemo } from 'react';
import { JOB_COUNTRY_OPTIONS, getCountryFlag, getCountryEligibility } from '../../utils/countryUtils';
import { Search, ChevronDown, Check, Globe, Info } from 'lucide-react';

export interface JobCountrySelectProps {
  value: string;
  onChange: (country: string) => void;
  id?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
}

export const JobCountrySelect: React.FC<JobCountrySelectProps> = ({
  value,
  onChange,
  id = 'job-country-select',
  name = 'country',
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize current selection
  const currentInfo = useMemo(() => getCountryEligibility(value), [value]);

  // Filtered options
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return JOB_COUNTRY_OPTIONS;
    const term = search.trim().toLowerCase();
    return JOB_COUNTRY_OPTIONS.filter((c) => c.toLowerCase().includes(term));
  }, [search]);

  // Handle outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Focus search input when open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const handleSelect = (countryName: string) => {
    onChange(countryName);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden input for forms */}
      <input type="hidden" name={name} value={value} />

      {/* Button Trigger */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left bg-white border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs ${
          isOpen ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-300 hover:border-slate-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}`}
      >
        <span className="flex items-center gap-2 truncate font-medium text-slate-900">
          <span className="text-base shrink-0 leading-none">{currentInfo.flag}</span>
          <span className="truncate">{currentInfo.label}</span>
          {currentInfo.isWorldwide && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
              Open Worldwide
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[280px]">
          {/* Informational Guidance Banner */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-600">
            <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> Country selection is an informational label. All jobs remain visible and open for application to all users worldwide.
            </span>
          </div>

          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country (e.g. Pakistan, Egypt, Germany)..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto py-1 divide-y divide-slate-50">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                No matching country found
              </div>
            ) : (
              filteredOptions.map((countryOption) => {
                const isSelected =
                  value?.trim().toLowerCase() === countryOption.trim().toLowerCase() ||
                  (countryOption === 'Worldwide' &&
                    (!value || ['worldwide', 'global', 'all'].includes(value.trim().toLowerCase())));
                const flag = getCountryFlag(countryOption);
                const isWorldwide = countryOption === 'Worldwide';

                return (
                  <button
                    key={countryOption}
                    type="button"
                    onClick={() => handleSelect(countryOption)}
                    className={`w-full px-3 py-2 text-xs flex items-center justify-between text-left transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/80 text-indigo-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base shrink-0 leading-none">{flag}</span>
                      <span className="truncate">{countryOption}</span>
                      {isWorldwide && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          Recommended
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
