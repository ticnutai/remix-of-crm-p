// Client Filter Panel - Smart filtering by consultant, classification, industry, etc.
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Filter, 
  X, 
  User, 
  Building, 
  Tag, 
  Crown,
  Briefcase,
  Search,
  RotateCcw,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ClientFilter,
  CLASSIFICATION_OPTIONS,
  INDUSTRY_OPTIONS,
  SOURCE_OPTIONS,
} from '@/hooks/useClientClassification';
import { Consultant } from '@/hooks/useConsultants';

interface ClientFilterPanelProps {
  consultants: Consultant[];
  activeFilters: ClientFilter;
  onFilterChange: (filter: ClientFilter) => void;
  onClear: () => void;
  totalClients: number;
  filteredCount: number;
}

export function ClientFilterPanel({
  consultants,
  activeFilters,
  onFilterChange,
  onClear,
  totalClients,
  filteredCount,
}: ClientFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<ClientFilter>(activeFilters);
  
  // Count active filters
  const activeFilterCount = Object.values(activeFilters).filter(v => v !== undefined && v !== '').length;
  
  useEffect(() => {
    setLocalFilters(activeFilters);
  }, [activeFilters]);
  
  const handleFilterChange = (key: keyof ClientFilter, value: string | undefined) => {
    const newFilters = { ...localFilters, [key]: value || undefined };
    setLocalFilters(newFilters);
  };
  
  const applyFilters = () => {
    onFilterChange(localFilters);
    setIsOpen(false);
  };
  
  const clearFilters = () => {
    setLocalFilters({});
    onClear();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Quick Consultant Filter Dropdown */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant={activeFilters.consultantId ? "default" : "outline"} 
            size="sm"
            className={cn(
              "gap-2",
              activeFilters.consultantId && "bg-blue-600 hover:bg-blue-700"
            )}
          >
            <User className="h-4 w-4" />
            <span>יועץ</span>
            {activeFilters.consultantId && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                1
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start" dir="rtl">
          <div className="p-3 border-b">
            <p className="font-medium text-sm">סנן לפי יועץ</p>
            <p className="text-xs text-muted-foreground">בחר יועץ לראות את כל הלקוחות שלו</p>
          </div>
          <ScrollArea className="h-64">
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start text-right mb-1",
                  !activeFilters.consultantId && "bg-muted"
                )}
                onClick={() => onFilterChange({ ...activeFilters, consultantId: undefined })}
              >
                <RotateCcw className="h-4 w-4 ml-2" />
                הצג הכל
              </Button>
              <Separator className="my-2" />
              {consultants.map(consultant => (
                <Button
                  key={consultant.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-right mb-1",
                    activeFilters.consultantId === consultant.id && "bg-blue-100 text-blue-700"
                  )}
                  onClick={() => onFilterChange({ ...activeFilters, consultantId: consultant.id })}
                >
                  {activeFilters.consultantId === consultant.id && (
                    <Check className="h-4 w-4 ml-2 text-blue-600" />
                  )}
                  <div className="flex flex-col items-start">
                    <span>{consultant.name}</span>
                    <span className="text-xs text-muted-foreground">{consultant.profession}</span>
                  </div>
                </Button>
              ))}
              {consultants.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  אין יועצים במערכת
                </p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Quick Classification Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant={activeFilters.classification ? "default" : "outline"} 
            size="sm"
            className={cn(
              "gap-2",
              activeFilters.classification && "bg-yellow-600 hover:bg-yellow-700"
            )}
          >
            <Crown className="h-4 w-4" />
            <span>סיווג</span>
            {activeFilters.classification && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                1
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start" dir="rtl">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start mb-1",
              !activeFilters.classification && "bg-muted"
            )}
            onClick={() => onFilterChange({ ...activeFilters, classification: undefined })}
          >
            <RotateCcw className="h-4 w-4 ml-2" />
            הצג הכל
          </Button>
          <Separator className="my-1" />
          {CLASSIFICATION_OPTIONS.map(option => (
            <Button
              key={option.value}
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start mb-1",
                activeFilters.classification === option.value && "bg-yellow-100 text-yellow-700"
              )}
              onClick={() => onFilterChange({ ...activeFilters, classification: option.value })}
            >
              <div className={cn("w-3 h-3 rounded-full ml-2", option.color)} />
              {option.label}
              {activeFilters.classification === option.value && (
                <Check className="h-4 w-4 mr-auto" />
              )}
            </Button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Advanced Filters Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            <span>סינון מתקדם</span>
            {activeFilterCount > 0 && (
              <Badge variant="default" className="h-5 px-1.5 text-xs bg-primary">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px]" dir="rtl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              סינון מתקדם
            </SheetTitle>
            <SheetDescription>
              סנן לקוחות לפי פרמטרים שונים
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-6 py-6">
            {/* Consultant Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                יועץ
              </Label>
              <Select
                value={localFilters.consultantId || ''}
                onValueChange={(v) => handleFilterChange('consultantId', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר יועץ..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">הכל</SelectItem>
                  {consultants.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.profession})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Classification Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                סיווג לקוח
              </Label>
              <Select
                value={localFilters.classification || ''}
                onValueChange={(v) => handleFilterChange('classification', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר סיווג..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">הכל</SelectItem>
                  {CLASSIFICATION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", opt.color)} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Industry Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                ענף/תעשייה
              </Label>
              <Select
                value={localFilters.industry || ''}
                onValueChange={(v) => handleFilterChange('industry', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר ענף..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">הכל</SelectItem>
                  {INDUSTRY_OPTIONS.map(ind => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                מקור הגעה
              </Label>
              <Select
                value={localFilters.source || ''}
                onValueChange={(v) => handleFilterChange('source', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר מקור..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">הכל</SelectItem>
                  {SOURCE_OPTIONS.map(src => (
                    <SelectItem key={src} value={src}>{src}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tag Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                תגית
              </Label>
              <Input
                placeholder="הזן תגית לחיפוש..."
                value={localFilters.tag || ''}
                onChange={(e) => handleFilterChange('tag', e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>סטטוס</Label>
              <Select
                value={localFilters.status || ''}
                onValueChange={(v) => handleFilterChange('status', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר סטטוס..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">הכל</SelectItem>
                  <SelectItem value="active">פעיל</SelectItem>
                  <SelectItem value="inactive">לא פעיל</SelectItem>
                  <SelectItem value="lead">ליד</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="flex gap-2">
            <Button variant="outline" onClick={clearFilters} className="flex-1">
              <RotateCcw className="h-4 w-4 ml-2" />
              נקה הכל
            </Button>
            <Button onClick={applyFilters} className="flex-1">
              <Search className="h-4 w-4 ml-2" />
              החל סינון
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Clear All Button */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 ml-1" />
          נקה ({activeFilterCount})
        </Button>
      )}

      {/* Results Count */}
      {activeFilterCount > 0 && (
        <Badge variant="outline" className="text-xs">
          {filteredCount} / {totalClients} לקוחות
        </Badge>
      )}
    </div>
  );
}
