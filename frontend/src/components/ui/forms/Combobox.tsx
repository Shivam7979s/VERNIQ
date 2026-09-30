import React, { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Search, ChevronDown, Check, Plus, X } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  subtitle?: string;
}

export interface ComboboxProps {
  id?: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string, selectedOption?: ComboboxOption) => void;
  placeholder?: string;
  disabled?: boolean;
  allowCustom?: boolean;
  customPrompt?: (query: string) => string;
  leftIcon?: React.ReactNode;
  className?: string;
  error?: boolean;
}

export const Combobox: React.FC<ComboboxProps> = ({
  id,
  options,
  value,
  onChange,
  placeholder = 'Select or search...',
  disabled = false,
  allowCustom = true,
  customPrompt = (q) => `Use custom: "${q}"`,
  leftIcon,
  className,
  error = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find currently selected option
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Filter options based on user search
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const lower = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(lower) ||
        (opt.subtitle && opt.subtitle.toLowerCase().includes(lower))
    );
  }, [options, search]);

  const hasExactMatch = useMemo(() => {
    return options.some(
      (opt) => opt.label.toLowerCase() === search.trim().toLowerCase()
    );
  }, [options, search]);

  const showCustomOption = allowCustom && search.trim().length > 1 && !hasExactMatch;

  // Handle outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectOption = (opt: ComboboxOption) => {
    onChange(opt.value, opt);
    setSearch('');
    setIsOpen(false);
  };

  const handleSelectCustom = () => {
    const customVal = search.trim();
    if (!customVal) return;
    const customOpt: ComboboxOption = {
      value: customVal.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      label: customVal,
      subtitle: 'Custom Institution',
    };
    onChange(customOpt.value, customOpt);
    setSearch('');
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const totalCount = filteredOptions.length + (showCustomOption ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % Math.max(totalCount, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + totalCount) % Math.max(totalCount, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex < filteredOptions.length) {
        handleSelectOption(filteredOptions[highlightedIndex]);
      } else if (showCustomOption) {
        handleSelectCustom();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full text-left', className)}>
      {/* Combobox Trigger Box */}
      <div
        id={id}
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) {
            setIsOpen((p) => !p);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex items-center justify-between w-full h-9 px-3 rounded border bg-surface text-[13px] transition-colors cursor-pointer select-none',
          'border-border hover:border-border-strong focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus',
          error && 'border-error focus:border-error focus:ring-error',
          disabled && 'opacity-60 bg-surface-subtle cursor-not-allowed pointer-events-none'
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {leftIcon && <span className="text-text-muted shrink-0">{leftIcon}</span>}
          <span
            className={cn(
              'truncate',
              selectedOption ? 'text-text-primary font-medium' : 'text-text-muted'
            )}
          >
            {selectedOption ? selectedOption.label : value ? value : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-text-muted hover:text-text-primary rounded"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-text-muted transition-transform duration-fast',
              isOpen && 'rotate-180 text-primary'
            )}
          />
        </div>
      </div>

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute z-dropdown left-0 right-0 mt-1 rounded border border-border bg-surface-elevated shadow-elevation-3 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-fast">
          {/* Internal Search Input */}
          <div className="p-2 border-b border-border bg-surface flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-transparent text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none"
              placeholder="Search or enter institution..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1 divide-y divide-border/20">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = highlightedIndex === index;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelectOption(opt)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded text-[13px] cursor-pointer transition-colors',
                      isHighlighted ? 'bg-primary/10 text-primary' : 'text-text-primary hover:bg-surface-subtle',
                      isSelected && 'font-semibold text-primary'
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate">{opt.label}</div>
                      {opt.subtitle && (
                        <div className="text-[11px] text-text-muted font-mono truncate">
                          {opt.subtitle}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                );
              })
            ) : !showCustomOption ? (
              <div className="p-4 text-center text-xs text-text-muted font-mono">
                No matching colleges found.
              </div>
            ) : null}

            {/* Custom Option Prompt */}
            {showCustomOption && (
              <div
                onClick={handleSelectCustom}
                onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded text-[13px] cursor-pointer transition-colors border-t border-border/50 text-primary hover:bg-primary/10',
                  highlightedIndex === filteredOptions.length && 'bg-primary/10'
                )}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{customPrompt(search.trim())}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
