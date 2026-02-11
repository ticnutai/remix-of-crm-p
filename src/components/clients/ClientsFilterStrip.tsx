// Clients Filter Strip Component - tenarch CRM Pro
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Layers,
  Bell,
  CheckSquare,
  Users,
  X,
  ChevronDown,
  Filter,
  CalendarDays,
  FolderOpen,
  Tag,
  Plus,
  Heart,
  Building,
  Handshake,
  ArrowUpDown,
  SortAsc,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ClientFilterState {
  stages: string[];
  dateFilter: 'all' | 'today' | 'week' | 'month' | 'older';
  hasReminders: boolean | null;
  hasTasks: boolean | null;
  hasMeetings: boolean | null;
  categories: string[];
  tags: string[];
  sortBy: 'name_asc' | 'name_desc' | 'date_desc' | 'date_asc' | 'classification_asc';
}

interface ClientStageDefinition {
  stage_id: string;
  stage_name: string;
  stage_icon: string | null;
}

interface ClientCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface ClientsFilterStripProps {
  filters: ClientFilterState;
  onFiltersChange: (filters: ClientFilterState) => void;
  clientsWithReminders: Set<string>;
  clientsWithTasks: Set<string>;
  clientsWithMeetings: Set<string>;
  categories?: ClientCategory[];
  allTags?: string[];
}

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users className="h-4 w-4" />,
  Heart: <Heart className="h-4 w-4" />,
  Building: <Building className="h-4 w-4" />,
  Handshake: <Handshake className="h-4 w-4" />,
  FolderOpen: <FolderOpen className="h-4 w-4" />,
};

export function ClientsFilterStrip({
  filters,
  onFiltersChange,
  clientsWithReminders,
  clientsWithTasks,
  clientsWithMeetings,
  categories = [],
  allTags = [],
}: ClientsFilterStripProps) {
  const [stageDefinitions, setStageDefinitions] = useState<ClientStageDefinition[]>([]);
  const [stagesDialogOpen, setStagesDialogOpen] = useState(false);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [sortDialogOpen, setSortDialogOpen] = useState(false);

  // Fetch unique stages from all clients
  useEffect(() => {
    fetchStageDefinitions();
  }, []);

  const fetchStageDefinitions = async () => {
    try {
      const { data, error } = await supabase
        .from('client_stages')
        .select('stage_id, stage_name, stage_icon')
        .order('sort_order');

      if (error) throw error;

      // Deduplicate by stage_name to show each unique stage definition only once
      const uniqueStages = data?.reduce((acc, stage) => {
        if (!acc.some(s => s.stage_name === stage.stage_name)) {
          acc.push(stage);
        }
        return acc;
      }, [] as ClientStageDefinition[]) || [];

      setStageDefinitions(uniqueStages);
    } catch (error) {
      console.error('Error fetching stage definitions:', error);
    }
  };

  const toggleStage = (stageName: string) => {
    const newStages = filters.stages.includes(stageName)
      ? filters.stages.filter(s => s !== stageName)
      : [...filters.stages, stageName];
    onFiltersChange({ ...filters, stages: newStages });
  };

  const clearStages = () => {
    onFiltersChange({ ...filters, stages: [] });
  };

  const selectAllStages = () => {
    onFiltersChange({ ...filters, stages: stageDefinitions.map(s => s.stage_name) });
  };

  const setDateFilter = (value: ClientFilterState['dateFilter']) => {
    onFiltersChange({ ...filters, dateFilter: value });
    setDateDialogOpen(false);
  };

  const toggleHasReminders = () => {
    const newValue = filters.hasReminders === true ? null : true;
    onFiltersChange({ ...filters, hasReminders: newValue });
  };

  const toggleHasTasks = () => {
    const newValue = filters.hasTasks === true ? null : true;
    onFiltersChange({ ...filters, hasTasks: newValue });
  };

  const toggleHasMeetings = () => {
    const newValue = filters.hasMeetings === true ? null : true;
    onFiltersChange({ ...filters, hasMeetings: newValue });
  };

  const toggleCategory = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(c => c !== categoryId)
      : [...filters.categories, categoryId];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  const clearCategories = () => {
    onFiltersChange({ ...filters, categories: [] });
  };

  const clearTags = () => {
    onFiltersChange({ ...filters, tags: [] });
  };

  const hasActiveFilters = 
    filters.stages.length > 0 || 
    filters.dateFilter !== 'all' || 
    filters.hasReminders !== null || 
    filters.hasTasks !== null || 
    filters.hasMeetings !== null ||
    filters.categories.length > 0 ||
    filters.tags.length > 0;

  const clearAllFilters = () => {
    onFiltersChange({
      stages: [],
      dateFilter: 'all',
      hasReminders: null,
      hasTasks: null,
      hasMeetings: null,
      categories: [],
      tags: [],
      sortBy: filters.sortBy, // Keep sort order when clearing
    });
  };

  const dateFilterLabels = {
    all: 'כל התאריכים',
    today: 'היום',
    week: 'השבוע',
    month: 'החודש',
    older: 'ישן יותר',
  };

  const sortByLabels: Record<ClientFilterState['sortBy'], string> = {
    date_desc: 'חדשים ראשון',
    date_asc: 'ישנים ראשון',
    name_asc: 'שם א-ת',
    name_desc: 'שם ת-א',
    classification_asc: 'סיווג א-ת',
  };

  const filteredTags = allTags.filter(tag => 
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  return (
    <div 
      dir="rtl"
      className="bg-white rounded-xl border-2 border-[#d4a843] p-3 mb-4"
    >
      <div className="flex flex-wrap gap-2 items-center">
        {/* Filter Icon */}
        <div className="flex items-center gap-2 ml-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">סינון:</span>
        </div>

        {/* Sort By Filter */}
        <Popover open={sortDialogOpen} onOpenChange={setSortDialogOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-9 bg-white text-[#1e293b] border-2 border-[#d4a843] hover:bg-[#fef9ee] hover:text-[#1e293b]"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortByLabels[filters.sortBy]}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[220px] p-0" 
            dir="rtl" 
            align="end"
          >
            <div className="p-3 border-b">
              <div className="flex flex-row-reverse items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">מיין לפי</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 ml-auto"
                  onClick={() => setSortDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-2 space-y-1">
              {(Object.entries(sortByLabels) as [ClientFilterState['sortBy'], string][]).map(([value, label]) => (
                <Button
                  key={value}
                  variant={filters.sortBy === value ? "default" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    onFiltersChange({ ...filters, sortBy: value });
                    setSortDialogOpen(false);
                  }}
                >
                  {value.includes('date') ? (
                    <CalendarDays className="h-4 w-4" />
                  ) : (
                    <SortAsc className="h-4 w-4" />
                  )}
                  {label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Categories Filter */}
        <Popover open={categoriesDialogOpen} onOpenChange={setCategoriesDialogOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-2 h-9 bg-white text-[#1e293b] border-2 border-[#d4a843] hover:bg-[#fef9ee] hover:text-[#1e293b]",
                filters.categories.length > 0 && "bg-[#d4a843] text-[#1e293b] border-[#d4a843] hover:bg-[#c49a3a]"
              )}
            >
              <FolderOpen className="h-4 w-4" />
              קטגוריות
              {filters.categories.length > 0 && (
                <Badge variant="secondary" className="mr-1 bg-accent text-accent-foreground">
                  {filters.categories.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[300px] p-0" 
            dir="rtl" 
            align="end"
          >
            <div className="p-4 border-b">
              <div className="flex flex-row-reverse items-center gap-2 mb-3">
                <FolderOpen className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">סינון לפי קטגוריה</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 mr-auto bg-primary/10 hover:bg-primary/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Open add category dialog
                    console.log('Add category');
                  }}
                  title="הוסף קטגוריה"
                >
                  <Plus className="h-4 w-4 text-primary" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => setCategoriesDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {filters.categories.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearCategories}>
                  נקה הכל
                </Button>
              )}
            </div>
            <ScrollArea className="h-[250px] p-4">
              <div className="space-y-2">
                {categories.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    אין קטגוריות מוגדרות
                  </p>
                ) : (
                  categories.map((category) => (
                    <div
                      key={category.id}
                      className={cn(
                        "group flex flex-row-reverse items-center gap-2 p-2 pr-3 rounded-lg border transition-all",
                        filters.categories.includes(category.id)
                          ? "bg-primary/10 border-primary"
                          : "bg-background border-border hover:border-primary/50"
                      )}
                    >
                      <Checkbox
                        checked={filters.categories.includes(category.id)}
                        onCheckedChange={() => toggleCategory(category.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      >
                        {iconMap[category.icon] || <FolderOpen className="h-3 w-3" />}
                      </div>
                      <button 
                        className="font-medium flex-1 text-right cursor-pointer bg-transparent border-0 p-0"
                        onClick={() => toggleCategory(category.id)}
                        type="button"
                      >
                        {category.name}
                      </button>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-blue-100 hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Edit category
                            console.log('Edit category:', category.id);
                          }}
                          title="ערוך קטגוריה"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-red-100 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Delete category
                            console.log('Delete category:', category.id);
                          }}
                          title="מחק קטגוריה"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Tags Filter */}
        <Popover open={tagsDialogOpen} onOpenChange={setTagsDialogOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-2 h-9 bg-white text-[#1e293b] border-2 border-[#d4a843] hover:bg-[#fef9ee] hover:text-[#1e293b]",
                filters.tags.length > 0 && "bg-[#d4a843] text-[#1e293b] border-[#d4a843] hover:bg-[#c49a3a]"
              )}
            >
              <Tag className="h-4 w-4" />
              תגיות
              {filters.tags.length > 0 && (
                <Badge variant="secondary" className="mr-1 bg-accent text-accent-foreground">
                  {filters.tags.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[300px] p-0" 
            dir="rtl" 
            align="end"
          >
            <div className="p-4 border-b">
              <div className="flex flex-row-reverse items-center gap-2 mb-3">
                <Tag className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">סינון לפי תגיות</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 ml-auto"
                  onClick={() => setTagsDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Input
                placeholder="חפש תגית..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="mb-2"
              />
              {filters.tags.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearTags}>
                  נקה הכל
                </Button>
              )}
            </div>
            <ScrollArea className="h-[250px] p-4">
              <div className="flex flex-wrap gap-2">
                {filteredTags.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 w-full">
                    {allTags.length === 0 ? 'אין תגיות' : 'לא נמצאו תגיות'}
                  </p>
                ) : (
                  filteredTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={filters.tags.includes(tag) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all",
                        filters.tags.includes(tag) 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-primary/10"
                      )}
                      onClick={() => toggleTag(tag)}
                    >
                      <Tag className="h-3 w-3 ml-1" />
                      {tag}
                    </Badge>
                  ))
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Stages Filter */}
        <Popover open={stagesDialogOpen} onOpenChange={setStagesDialogOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-2 h-9 bg-white text-[#1e293b] border-2 border-[#d4a843] hover:bg-[#fef9ee] hover:text-[#1e293b]",
                filters.stages.length > 0 && "bg-[#d4a843] text-[#1e293b] border-[#d4a843] hover:bg-[#c49a3a]"
              )}
            >
              <Layers className="h-4 w-4" />
              שלבים
              {filters.stages.length > 0 && (
                <Badge variant="secondary" className="mr-1 bg-accent text-accent-foreground">
                  {filters.stages.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[350px] p-0" 
            dir="rtl" 
            align="end"
          >
            <div className="p-4 border-b">
              <div className="flex flex-row-reverse items-center gap-2 mb-3">
                <Layers className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">סינון לפי שלבים</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 ml-auto"
                  onClick={() => setStagesDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-row-reverse gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={selectAllStages}>
                  בחר הכל
                </Button>
                <Button variant="outline" size="sm" onClick={clearStages}>
                  נקה הכל
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[300px] p-4">
              <div className="space-y-3">
                {stageDefinitions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    אין שלבים מוגדרים
                  </p>
                ) : (
                  stageDefinitions.map((stage) => (
                    <div
                      key={stage.stage_name}
                      className={cn(
                        "flex flex-row-reverse items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        filters.stages.includes(stage.stage_name)
                          ? "bg-primary/10 border-primary"
                          : "bg-background border-border hover:border-primary/50"
                      )}
                      onClick={() => toggleStage(stage.stage_name)}
                    >
                      <Checkbox
                        checked={filters.stages.includes(stage.stage_name)}
                        onCheckedChange={() => toggleStage(stage.stage_name)}
                      />
                      <span className="font-medium text-foreground flex-1">
                        {stage.stage_name}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Date Filter */}
        <Popover open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-2 h-9 bg-white text-[#1e293b] border-2 border-[#d4a843] hover:bg-[#fef9ee] hover:text-[#1e293b]",
                filters.dateFilter !== 'all' && "bg-[#d4a843] text-[#1e293b] border-[#d4a843] hover:bg-[#c49a3a]"
              )}
            >
              <CalendarDays className="h-4 w-4" />
              {dateFilterLabels[filters.dateFilter]}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[280px] p-0" 
            dir="rtl" 
            align="end"
          >
            <div className="p-3 border-b">
              <div className="flex flex-row-reverse items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">סינון לפי תאריך יצירה</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 ml-auto"
                  onClick={() => setDateDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {Object.entries(dateFilterLabels).map(([value, label]) => (
                <Button
                  key={value}
                  variant={filters.dateFilter === value ? "default" : "outline"}
                  className="w-full"
                  onClick={() => {
                    setDateFilter(value as ClientFilterState['dateFilter']);
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Has Reminders Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleHasReminders}
          className={cn(
            "gap-2 h-9 bg-white text-[#1e293b] border-2 border-[#d4a843] hover:bg-[#fef9ee] hover:text-[#1e293b]",
            filters.hasReminders === true && "bg-[#d4a843] text-[#1e293b] border-[#d4a843] hover:bg-[#c49a3a]"
          )}
        >
          <Bell className="h-4 w-4" />
          תזכורות
          <Badge variant="secondary" className="mr-1">
            {clientsWithReminders.size}
          </Badge>
        </Button>

        {/* Has Tasks Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleHasTasks}
          className={cn(
            "gap-2 h-9 bg-white text-[#1e293b] border-2 border-[#d4a843] hover:bg-[#fef9ee] hover:text-[#1e293b]",
            filters.hasTasks === true && "bg-[#d4a843] text-[#1e293b] border-[#d4a843] hover:bg-[#c49a3a]"
          )}
        >
          <CheckSquare className="h-4 w-4" />
          משימות
          <Badge variant="secondary" className="mr-1">
            {clientsWithTasks.size}
          </Badge>
        </Button>

        {/* Has Meetings Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleHasMeetings}
          className={cn(
            "gap-2 h-9 bg-white text-[#1e293b] border-2 border-[#d4a843] hover:bg-[#fef9ee] hover:text-[#1e293b]",
            filters.hasMeetings === true && "bg-[#d4a843] text-[#1e293b] border-[#d4a843] hover:bg-[#c49a3a]"
          )}
        >
          <Users className="h-4 w-4" />
          פגישות
          <Badge variant="secondary" className="mr-1">
            {clientsWithMeetings.size}
          </Badge>
        </Button>

        {/* Clear All Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="gap-1 h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="h-4 w-4" />
            נקה פילטרים
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {filters.categories.length > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {filters.categories.length} קטגוריות
            </Badge>
          )}
          {filters.tags.length > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {filters.tags.length} תגיות
            </Badge>
          )}
          {filters.stages.length > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {filters.stages.length} שלבים נבחרו
            </Badge>
          )}
          {filters.dateFilter !== 'all' && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              {dateFilterLabels[filters.dateFilter]}
            </Badge>
          )}
          {filters.hasReminders === true && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              עם תזכורות
            </Badge>
          )}
          {filters.hasTasks === true && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              עם משימות
            </Badge>
          )}
          {filters.hasMeetings === true && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              עם פגישות
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}