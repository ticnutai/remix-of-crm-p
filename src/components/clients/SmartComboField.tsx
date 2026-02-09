import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface SmartComboFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fieldColumn: string; // column name in clients table to fetch existing values
  dir?: 'rtl' | 'ltr';
  type?: string;
  className?: string;
}

/**
 * A combo-box input field that shows previously used values from the DB
 * with manual entry support and a "+" button for quick selection.
 */
const SmartComboField: React.FC<SmartComboFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  fieldColumn,
  dir = 'rtl',
  type = 'text',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [existingValues, setExistingValues] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch distinct existing values for this column
  useEffect(() => {
    const fetchValues = async () => {
      try {
        // Use raw query via RPC or just fetch all clients and extract unique values
        const { data, error } = await supabase
          .from('clients')
          .select(fieldColumn)
          .not(fieldColumn, 'is', null)
          .not(fieldColumn, 'eq', '')
          .limit(500);

        if (!error && data) {
          const uniqueVals = [...new Set(
            data
              .map((row: any) => row[fieldColumn] as string)
              .filter(Boolean)
          )].sort((a, b) => a.localeCompare(b));
          setExistingValues(uniqueVals);
        }
      } catch (err) {
        console.error(`Error fetching values for ${fieldColumn}:`, err);
      }
    };

    fetchValues();
  }, [fieldColumn]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter values based on search/current input
  const filteredValues = useMemo(() => {
    const term = (searchTerm || value || '').toLowerCase().trim();
    if (!term) return existingValues;
    return existingValues.filter(v => v.toLowerCase().includes(term));
  }, [existingValues, searchTerm, value]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    onChange(newVal);
    setSearchTerm(newVal);
    if (!isOpen && newVal) {
      setIsOpen(true);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setSearchTerm('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className={cn('space-y-1', className)} ref={containerRef}>
      <Label className="text-right text-xs">{label}</Label>
      <div className="relative">
        <div className="flex gap-1">
          <Input
            ref={inputRef}
            type={type}
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder || label}
            className={cn(
              'text-right flex-1 pr-2',
              dir === 'ltr' && 'text-left'
            )}
            dir={dir}
            onFocus={() => {
              if (existingValues.length > 0) {
                setIsOpen(true);
              }
            }}
          />
          {existingValues.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 border-primary/30 hover:bg-primary/10"
              onClick={toggleDropdown}
              title="בחר מרשימה קיימת"
            >
              {isOpen ? (
                <X className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5 text-primary" />
              )}
            </Button>
          )}
        </div>

        {/* Dropdown list */}
        {isOpen && filteredValues.length > 0 && (
          <div className="absolute z-[500] top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
            {filteredValues.map((val, idx) => (
              <button
                key={val}
                type="button"
                className={cn(
                  'w-full text-right px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between',
                  val === value && 'bg-accent/50 font-medium'
                )}
                onClick={() => handleSelect(val)}
              >
                <span className="truncate">{val}</span>
                {val === value && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartComboField;
