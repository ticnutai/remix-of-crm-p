// חיפוש גלובלי - Command Palette Style
// חיפוש חכם בכל המערכת

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  User,
  FileText,
  Briefcase,
  Building,
  Clock,
  Search,
  Calendar,
  DollarSign,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface SearchResult {
  id: string;
  type: 'client' | 'project' | 'contract' | 'time_entry';
  title: string;
  subtitle?: string;
  badge?: string;
  url: string;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // חיפוש
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['global-search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const searchResults: SearchResult[] = [];
      const searchQuery = `%${query}%`;
      
      // חיפוש לקוחות
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, company, email, phone')
        .or(`name.ilike.${searchQuery},company.ilike.${searchQuery},email.ilike.${searchQuery}`)
        .limit(5);
      
      clients?.forEach(client => {
        searchResults.push({
          id: client.id,
          type: 'client',
          title: client.name || client.company || 'לקוח',
          subtitle: client.company && client.name !== client.company ? client.company : client.email,
          url: `/clients/${client.id}`,
        });
      });
      
      // חיפוש פרויקטים
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, status, clients(name)')
        .ilike('name', searchQuery)
        .limit(5);
      
      projects?.forEach(project => {
        searchResults.push({
          id: project.id,
          type: 'project',
          title: project.name,
          subtitle: (project.clients as any)?.contact_name,
          badge: project.status || undefined,
          url: `/projects/${project.id}`,
        });
      });
      
      // חיפוש חוזים
      const { data: contracts } = await (supabase as any)
        .from('contracts')
        .select('id, title, total_amount, clients(contact_name)')
        .ilike('title', searchQuery)
        .limit(5);
      
      contracts?.forEach((contract: any) => {
        searchResults.push({
          id: contract.id,
          type: 'contract',
          title: contract.title,
          subtitle: contract.clients?.contact_name,
          badge: contract.total_amount ? `₪${contract.total_amount.toLocaleString()}` : undefined,
          url: `/contracts/${contract.id}`,
        });
      });
      
      // חיפוש רשומות זמן
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('id, description, start_time, projects(name)')
        .ilike('description', searchQuery)
        .limit(3);
      
      timeEntries?.forEach(entry => {
        searchResults.push({
          id: entry.id,
          type: 'time_entry',
          title: entry.description || 'רשומת זמן',
          subtitle: (entry.projects as any)?.name,
          badge: format(new Date(entry.start_time), 'dd/MM/yyyy'),
          url: `/time-tracking`,
        });
      });
      
      return searchResults;
    },
    enabled: query.length >= 2,
  });

  // קיצור מקלדת
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  // פוקוס אוטומטי
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [open]);

  // בחירת תוצאה
  const handleSelect = useCallback((result: SearchResult) => {
    navigate(result.url);
    onOpenChange(false);
    setQuery('');
  }, [navigate, onOpenChange]);

  // אייקון לפי סוג
  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'client':
        return <User className="h-4 w-4" />;
      case 'project':
        return <Briefcase className="h-4 w-4" />;
      case 'contract':
        return <FileText className="h-4 w-4" />;
      case 'time_entry':
        return <Clock className="h-4 w-4" />;
    }
  };

  // תווית לפי סוג
  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'client':
        return 'לקוח';
      case 'project':
        return 'פרויקט';
      case 'contract':
        return 'חוזה';
      case 'time_entry':
        return 'זמן';
    }
  };

  // קיבוץ לפי סוג
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-xl" dir="rtl">
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 opacity-50 ml-2" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש לקוחות, פרויקטים, חוזים..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
          <CommandList className="max-h-[400px] overflow-y-auto">
            {query.length < 2 ? (
              <div className="py-12 text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  הקלד לפחות 2 תווים לחיפוש
                </p>
              </div>
            ) : isLoading ? (
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">מחפש...</p>
              </div>
            ) : results.length === 0 ? (
              <CommandEmpty>
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    לא נמצאו תוצאות עבור "{query}"
                  </p>
                </div>
              </CommandEmpty>
            ) : (
              <>
                {/* לקוחות */}
                {groupedResults.client && (
                  <CommandGroup heading="לקוחות">
                    {groupedResults.client.map((result) => (
                      <CommandItem
                        key={result.id}
                        value={result.id}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center gap-3 p-3 cursor-pointer"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          {getIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* פרויקטים */}
                {groupedResults.project && (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="פרויקטים">
                      {groupedResults.project.map((result) => (
                        <CommandItem
                          key={result.id}
                          value={result.id}
                          onSelect={() => handleSelect(result)}
                          className="flex items-center gap-3 p-3 cursor-pointer"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                            {getIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{result.title}</p>
                            {result.subtitle && (
                              <p className="text-xs text-muted-foreground truncate">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                          {result.badge && (
                            <Badge variant="outline">{result.badge}</Badge>
                          )}
                          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}

                {/* חוזים */}
                {groupedResults.contract && (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="חוזים">
                      {groupedResults.contract.map((result) => (
                        <CommandItem
                          key={result.id}
                          value={result.id}
                          onSelect={() => handleSelect(result)}
                          className="flex items-center gap-3 p-3 cursor-pointer"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                            {getIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{result.title}</p>
                            {result.subtitle && (
                              <p className="text-xs text-muted-foreground truncate">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                          {result.badge && (
                            <Badge variant="outline">{result.badge}</Badge>
                          )}
                          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}

                {/* רשומות זמן */}
                {groupedResults.time_entry && (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="רשומות זמן">
                      {groupedResults.time_entry.map((result) => (
                        <CommandItem
                          key={result.id}
                          value={result.id}
                          onSelect={() => handleSelect(result)}
                          className="flex items-center gap-3 p-3 cursor-pointer"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                            {getIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{result.title}</p>
                            {result.subtitle && (
                              <p className="text-xs text-muted-foreground truncate">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                          {result.badge && (
                            <Badge variant="outline">{result.badge}</Badge>
                          )}
                          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

// כפתור חיפוש קטן ל-navbar
export function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <Search className="h-4 w-4" />
      <span className="hidden md:inline">חיפוש...</span>
      <kbd className="hidden md:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}

export default GlobalSearch;
