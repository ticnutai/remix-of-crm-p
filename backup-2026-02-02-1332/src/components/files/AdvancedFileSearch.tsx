/**
 * Advanced File Search - חיפוש וסינון מתקדם
 */

import React, { useState } from 'react';
import { Search, Filter, X, Calendar, File, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SearchFilters {
  query: string;
  fileType?: string;
  tags: string[];
  dateFrom?: Date;
  dateTo?: Date;
  minSize?: number;
  maxSize?: number;
  sortBy: 'name' | 'date' | 'size' | 'downloads';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFileSearchProps {
  onSearch: (filters: SearchFilters) => void;
  availableTags: string[];
  isLoading?: boolean;
}

export function AdvancedFileSearch({
  onSearch,
  availableTags,
  isLoading,
}: AdvancedFileSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    tags: [],
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = () => {
    onSearch(filters);
  };

  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      updateFilter('tags', [...filters.tags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    updateFilter('tags', filters.tags.filter(t => t !== tag));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      tags: [],
      sortBy: 'date',
      sortOrder: 'desc',
    });
    setShowAdvanced(false);
  };

  const hasActiveFilters = 
    filters.query || 
    filters.tags.length > 0 || 
    filters.fileType || 
    filters.dateFrom || 
    filters.dateTo || 
    filters.minSize || 
    filters.maxSize;

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Main Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="חפש קבצים..."
              value={filters.query}
              onChange={(e) => updateFilter('query', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pr-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={showAdvanced ? 'bg-primary/10' : ''}
          >
            <Filter className="h-4 w-4 ml-2" />
            סינון
          </Button>
          <Button onClick={handleSearch} disabled={isLoading}>
            חפש
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Active Filters */}
        {(filters.tags.length > 0 || filters.fileType) && (
          <div className="flex flex-wrap gap-2">
            {filters.fileType && (
              <Badge variant="secondary" className="gap-1">
                <File className="h-3 w-3" />
                {filters.fileType}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => updateFilter('fileType', undefined)}
                />
              </Badge>
            )}
            {filters.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1">
                <Tag className="h-3 w-3" />
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
          </div>
        )}

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            {/* File Type */}
            <div className="space-y-2">
              <Label>סוג קובץ</Label>
              <Select
                value={filters.fileType}
                onValueChange={(value) => updateFilter('fileType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="כל הסוגים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסוגים</SelectItem>
                  <SelectItem value="image">תמונות</SelectItem>
                  <SelectItem value="document">מסמכים</SelectItem>
                  <SelectItem value="video">וידאו</SelectItem>
                  <SelectItem value="audio">אודיו</SelectItem>
                  <SelectItem value="archive">ארכיונים</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>תגיות</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Tag className="h-4 w-4 ml-2" />
                    {filters.tags.length > 0
                      ? `${filters.tags.length} תגיות`
                      : 'בחר תגיות'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64">
                  <div className="space-y-2">
                    <p className="font-medium text-sm">תגיות זמינות</p>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                      {availableTags.map(tag => (
                        <Badge
                          key={tag}
                          variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => 
                            filters.tags.includes(tag) 
                              ? removeTag(tag) 
                              : addTag(tag)
                          }
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label>מיון לפי</Label>
              <div className="flex gap-2">
                <Select
                  value={filters.sortBy}
                  onValueChange={(value: any) => updateFilter('sortBy', value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">שם</SelectItem>
                    <SelectItem value="date">תאריך</SelectItem>
                    <SelectItem value="size">גודל</SelectItem>
                    <SelectItem value="downloads">הורדות</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.sortOrder}
                  onValueChange={(value: any) => updateFilter('sortOrder', value)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">עולה</SelectItem>
                    <SelectItem value="desc">יורד</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Size Range */}
            <div className="space-y-2">
              <Label>גודל (MB)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="מינימום"
                  value={filters.minSize || ''}
                  onChange={(e) => 
                    updateFilter('minSize', e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                />
                <Input
                  type="number"
                  placeholder="מקסימום"
                  value={filters.maxSize || ''}
                  onChange={(e) => 
                    updateFilter('maxSize', e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>תאריך העלאה</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.dateFrom?.toISOString().split('T')[0] || ''}
                  onChange={(e) => 
                    updateFilter('dateFrom', e.target.value ? new Date(e.target.value) : undefined)
                  }
                />
                <Input
                  type="date"
                  value={filters.dateTo?.toISOString().split('T')[0] || ''}
                  onChange={(e) => 
                    updateFilter('dateTo', e.target.value ? new Date(e.target.value) : undefined)
                  }
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="space-y-2">
              <Label>מסננים מהירים</Label>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-white"
                  onClick={() => {
                    const today = new Date();
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    updateFilter('dateFrom', weekAgo);
                    updateFilter('dateTo', today);
                  }}
                >
                  השבוע
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-white"
                  onClick={() => {
                    const today = new Date();
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    updateFilter('dateFrom', monthAgo);
                    updateFilter('dateTo', today);
                  }}
                >
                  החודש
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-white"
                  onClick={() => {
                    updateFilter('minSize', 10);
                  }}
                >
                  גדולים ({'>'} 10MB)
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Search Tips */}
        {!hasActiveFilters && !showAdvanced && (
          <div className="text-sm text-gray-500 space-y-1">
            <p>💡 טיפים לחיפוש:</p>
            <ul className="list-disc list-inside mr-4 space-y-1">
              <li>השתמש במסנן המתקדם לחיפוש לפי סוג קובץ, תאריך וגודל</li>
              <li>הוסף תגיות למצוא קבצים מסוימים במהירות</li>
              <li>חפש בשם הקובץ, תיאור או תוכן</li>
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
