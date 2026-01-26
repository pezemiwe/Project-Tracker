/**
 * MultiSelect Component
 *
 * A dropdown with checkboxes for multiple selection.
 *
 * Last Updated: 2026-01-22
 */

import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxDisplay?: number;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select options...',
  className,
  disabled = false,
  maxDisplay = 3,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    const lowerSearch = search.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(lowerSearch));
  }, [options, search]);

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectedLabels = selected
    .map((v) => options.find((o) => o.value === v)?.label || v)
    .slice(0, maxDisplay);
  const remainingCount = selected.length - maxDisplay;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            'flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {selectedLabels.map((label, idx) => (
                  <span
                    key={selected[idx]}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium"
                  >
                    {label}
                    <button
                      type="button"
                      onClick={(e) => handleRemove(selected[idx], e)}
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {remainingCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs">
                    +{remainingCount} more
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
            {selected.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-muted rounded-md"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className={cn(
            'z-50 w-[var(--radix-popover-trigger-width)] max-h-[300px] overflow-hidden rounded-md border border-border bg-popover shadow-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
          )}
          sideOffset={4}
          align="start"
        >
          {/* Search Input */}
          <div className="p-2 border-b border-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-2 py-1.5 text-sm bg-transparent border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Options List */}
          <div className="max-h-[220px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <div
                    key={option.value}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer',
                      'hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-accent/50'
                    )}
                    onClick={() => handleToggle(option.value)}
                  >
                    <Checkbox.Root
                      checked={isSelected}
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded border border-input',
                        isSelected && 'bg-primary border-primary'
                      )}
                    >
                      <Checkbox.Indicator>
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <span className="text-sm">{option.label}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Selection Count */}
          {selected.length > 0 && (
            <div className="p-2 border-t border-border text-xs text-muted-foreground">
              {selected.length} selected
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
