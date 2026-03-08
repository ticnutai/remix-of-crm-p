// DataTypeColumn - Component for rendering data type linked columns
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataTypeOptions } from '@/hooks/useDataTypes';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, UserCog, FolderKanban, Database, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataTypeValueDialog } from './DataTypeValueDialog';

// Map icon names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  UserCog,
  FolderKanban,
  Database,
};

interface DataTypeColumnProps {
  dataTypeName: string;
  value: string | null;
  onChange?: (value: string | null) => void;
  readonly?: boolean;
  displayValue?: string;
  color?: string;
  icon?: string;
}

export function DataTypeColumn({
  dataTypeName,
  value,
  onChange,
  readonly = false,
  displayValue,
  color,
  icon,
}: DataTypeColumnProps) {
  const navigate = useNavigate();
  const { options, isLoading, dataType } = useDataTypeOptions(dataTypeName);
  const [isEditing, setIsEditing] = useState(false);

  const IconComponent = icon ? iconMap[icon] || Database : Database;
  const selectedOption = options.find(opt => opt.value === value);
  const label = displayValue || selectedOption?.label || 'לא נבחר';

  const handleClick = () => {
    if (!value || isEditing) return;
    
    switch (dataTypeName) {
      case 'client':
        navigate(`/client-profile/${value}`);
        break;
      case 'employee':
        navigate(`/employees?user=${value}`);
        break;
      case 'project':
        navigate(`/projects?project=${value}`);
        break;
    }
  };

  if (readonly || !onChange) {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 text-sm hover:underline transition-all",
          value && "cursor-pointer hover:text-primary"
        )}
        disabled={!value}
      >
        <IconComponent 
          className="h-4 w-4" 
          style={{ color: color || selectedOption?.color }} 
        />
        <span>{label}</span>
      </button>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>טוען...</span>
      </div>
    );
  }

  return (
    <Select
      value={value || 'none'}
      onValueChange={(val) => onChange(val === 'none' ? null : val)}
      onOpenChange={setIsEditing}
    >
      <SelectTrigger className="w-full min-w-[150px] h-9 border-primary/20 hover:border-primary/40 transition-colors bg-white">
        <SelectValue placeholder="בחר...">
          {value && selectedOption && (
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full shadow-sm" 
                style={{ backgroundColor: selectedOption.color || color || '#1e3a5f' }}
              />
              <span className="font-medium">{label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">לא נבחר</span>
        </SelectItem>
        {options.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            className="py-2.5 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div 
                className="w-4 h-4 rounded-full shadow-sm border border-white/50" 
                style={{ backgroundColor: option.color || '#1e3a5f' }}
              />
              <span className="font-medium">{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Badge display for data type values (used in cells)
interface DataTypeBadgeProps {
  dataTypeName: string;
  value: string | null;
  displayValue?: string;
  color?: string;
  icon?: string;
  onClick?: () => void;
}

export function DataTypeBadge({
  dataTypeName,
  value,
  displayValue,
  color,
  icon,
  onClick,
}: DataTypeBadgeProps) {
  const { options, dataType } = useDataTypeOptions(dataTypeName);
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);
  const label = displayValue || selectedOption?.label || 'לא נבחר';
  const optionColor = color || selectedOption?.color;
  const IconComponent = icon ? iconMap[icon] || Database : Database;
  
  // Check if this is an options-type data type
  const isOptionsType = dataType?.type_mode === 'options';

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    
    if (!value) return;
    
    // For options type - open linked data dialog
    if (isOptionsType) {
      setIsDialogOpen(true);
      return;
    }
    
    // For linked type - navigate to entity
    switch (dataTypeName) {
      case 'client':
        navigate(`/client-profile/${value}`);
        break;
      case 'employee':
        navigate(`/employees?user=${value}`);
        break;
      case 'project':
        navigate(`/projects?project=${value}`);
        break;
    }
  };

  if (!value) {
    return null;
  }

  return (
    <>
      <Badge
        variant="outline"
        className={cn(
          "cursor-pointer transition-all duration-150",
          "flex items-center gap-2 w-fit px-3 py-1.5",
          "hover:scale-105 hover:shadow-md",
          "border-2"
        )}
        style={{ 
          borderColor: optionColor,
          backgroundColor: `${optionColor}15`,
        }}
        onClick={handleClick}
      >
        <div 
          className="w-3 h-3 rounded-full shadow-sm" 
          style={{ backgroundColor: optionColor }}
        />
        <span className="font-medium" style={{ color: optionColor }}>{label}</span>
      </Badge>
      
      {isOptionsType && (
        <DataTypeValueDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          dataTypeName={dataTypeName}
          optionValue={value}
          optionLabel={label}
          optionColor={optionColor}
        />
      )}
    </>
  );
}
