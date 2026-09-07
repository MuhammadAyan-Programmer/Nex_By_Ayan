import React, { useState, useRef, useEffect, useMemo } from 'react';
import { WORLD_COUNTRIES } from '../../data/countries';
import { Search, ChevronDown, Check, X, Globe } from 'lucide-react';

export interface CountrySelectProps {
  value: string;
  onChange: (country: string) => void;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  id,
  name = 'country',
  required = false,
  disabled = false,
  placeholder = 'Select Country...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedItemRef = useRef<HTMLLIElement>(null);

  // Filter countries alphabetically
  const filteredCountries = useMemo(() => {
    if (!search.trim()) return WORLD_COUNTRIES;
    const term = search.trim().toLowerCase();
    return WORLD_COUNTRIES.filter((c) => c.toLowerCase().includes(term));
  }, [search]);

  // Check positioning (flip upward if close to bottom of screen)
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 240px below and at least 220px above, open upwards
      if (spaceBelow < 250 && rect.top > 230) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  // Close on outside click or touch
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
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

  // Focus search input when opened & scroll to current selection
  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow popover DOM mount
      setTimeout(() => {
        inputRef.current?.focus();
        if (selectedItemRef.current) {
          selectedItemRef.current.scrollIntoView({ block: 'nearest' });
        }
      }, 50);
      setHighlightedIndex(-1);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const handleSelect = (country: string) => {
    onChange(country);
    setIsOpen(false);
    setSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredCountries.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCountries.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredCountries.length) {
          handleSelect(filteredCountries[highlightedIndex]);
        } else if (filteredCountries.length > 0) {
          handleSelect(filteredCountries[0]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearch('');
        break;
      case 'Tab':
        setIsOpen(false);
        setSearch('');
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full text-left"
      onKeyDown={handleKeyDown}
    >
      <input type="hidden" name={name} value={value} required={required} />

      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full px-3 py-2 text-xs text-slate-900 border rounded-lg bg-white flex items-center justify-between gap-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-xs ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : 'border-slate-300 hover:border-slate-400 cursor-pointer'
        } ${className}`}
      >
        <span className="truncate flex items-center gap-1.5 font-medium">
          <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {value ? (
            <span className="text-slate-900">{value}</span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {/* Searchable Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100 ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
          style={{ minWidth: '220px' }}
        >
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder="Search country (A–Z)..."
                className="w-full pl-8 pr-7 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1.5">
              <span>Worldwide ({WORLD_COUNTRIES.length} countries)</span>
              {search && <span>{filteredCountries.length} matches</span>}
            </div>
          </div>

          {/* Scrollable Countries List */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-56 overflow-y-auto divide-y divide-slate-50 py-1 focus:outline-none text-xs"
          >
            {filteredCountries.length === 0 ? (
              <li className="px-3 py-6 text-center text-slate-400 text-xs">
                No country matching "{search}" found.
              </li>
            ) : (
              filteredCountries.map((c, idx) => {
                const isSelected = c === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={c}
                    ref={isSelected ? selectedItemRef : undefined}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(c)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-900 font-semibold'
                        : isHighlighted
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{c}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
