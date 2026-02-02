// FolderSystem - Navigation system for accessing different tables from Clients page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useCustomTables } from '@/hooks/useCustomTables';
import {
  FolderOpen,
  FolderKanban,
  Clock,
  CheckSquare,
  Calendar,
  Receipt,
  FileText,
  MessageSquare,
  Bell,
  Table,
  ChevronLeft,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FolderItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  url?: string;
  count?: number;
  description?: string;
  color?: string;
}

interface FolderSystemProps {
  onSelectFolder?: (folderId: string) => void;
  currentFolder?: string;
}

export function FolderSystem({ onSelectFolder, currentFolder }: FolderSystemProps) {
  const navigate = useNavigate();
  const { tables } = useCustomTables();
  const [isOpen, setIsOpen] = useState(false);

  // Built-in folders
  const builtInFolders: FolderItem[] = [
    {
      id: 'clients',
      name: 'לקוחות',
      icon: Users,
      description: 'טבלת לקוחות ראשית',
      color: 'hsl(220, 60%, 25%)',
    },
    {
      id: 'projects',
      name: 'פרויקטים',
      icon: FolderKanban,
      description: 'כל הפרויקטים במערכת',
      color: 'hsl(45, 80%, 45%)',
    },
    {
      id: 'time-logs',
      name: 'לוגי זמן',
      icon: Clock,
      description: 'רישומי זמן ומעקב שעות',
      color: 'hsl(220, 60%, 25%)',
    },
    {
      id: 'tasks',
      name: 'משימות',
      icon: CheckSquare,
      description: 'משימות ומטלות',
      color: 'hsl(45, 80%, 45%)',
    },
    {
      id: 'meetings',
      name: 'פגישות',
      icon: Calendar,
      description: 'פגישות ומפגשים',
      color: 'hsl(220, 60%, 25%)',
    },
    {
      id: 'invoices',
      name: 'חשבוניות',
      icon: Receipt,
      description: 'חשבוניות ותשלומים',
      color: 'hsl(45, 80%, 45%)',
    },
    {
      id: 'reminders',
      name: 'תזכורות',
      icon: Bell,
      description: 'תזכורות והתראות',
      color: 'hsl(220, 60%, 25%)',
    },
  ];

  // Custom tables as folders
  const customFolders: FolderItem[] = tables.map(table => ({
    id: `custom-${table.id}`,
    name: table.display_name,
    icon: Table,
    url: `/custom-table/${table.id}`,
    description: table.description || 'טבלה מותאמת אישית',
    color: 'hsl(45, 80%, 45%)',
  }));

  const handleFolderClick = (folder: FolderItem) => {
    if (onSelectFolder) {
      onSelectFolder(folder.id);
    }
    
    // Navigation based on folder type
    if (folder.url) {
      navigate(folder.url);
    } else {
      // Handle built-in folders navigation
      switch (folder.id) {
        case 'clients':
          onSelectFolder?.('clients');
          break;
        case 'projects':
          onSelectFolder?.('projects');
          break;
        case 'time-logs':
          onSelectFolder?.('time-logs');
          break;
        case 'tasks':
          navigate('/tasks-meetings');
          break;
        case 'meetings':
          navigate('/tasks-meetings');
          break;
        case 'invoices':
          navigate('/finance');
          break;
        case 'reminders':
          navigate('/reminders');
          break;
      }
    }
    
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FolderOpen className="h-4 w-4" />
          תיקיות
          {tables.length > 0 && (
            <Badge variant="secondary" className="mr-1">
              {builtInFolders.length + tables.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]" dir="rtl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            מערכת תיקיות
          </SheetTitle>
          <SheetDescription>
            בחר טבלה לצפייה ועריכה
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] mt-6">
          <div className="space-y-6">
            {/* Built-in Tables */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                טבלאות מערכת
              </h3>
              <div className="grid gap-2">
                {builtInFolders.map((folder) => {
                  const FolderIcon = folder.icon;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => handleFolderClick(folder)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all",
                        "hover:bg-accent hover:border-primary/30",
                        currentFolder === folder.id && "bg-primary/10 border-primary"
                      )}
                    >
                      <div className="p-2 rounded-md bg-primary/10">
                        <FolderIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 text-right">
                        <p className="font-medium">{folder.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {folder.description}
                        </p>
                      </div>
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Tables */}
            {customFolders.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  טבלאות מותאמות
                  <Badge variant="secondary">{customFolders.length}</Badge>
                </h3>
                <div className="grid gap-2">
                  {customFolders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleFolderClick(folder)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all",
                        "hover:bg-accent hover:border-primary/30",
                        currentFolder === folder.id && "bg-primary/10 border-primary"
                      )}
                    >
                      <div className="p-2 rounded-md bg-primary/10">
                        <Table className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 text-right">
                        <p className="font-medium">{folder.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {folder.description}
                        </p>
                      </div>
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
