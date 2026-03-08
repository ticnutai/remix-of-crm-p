// Dialog for managing (edit/delete) custom tabs with folder support
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Edit2,
  Trash2,
  Save,
  X,
  FolderOpen,
  FolderPlus,
  ChevronDown,
  ChevronLeft,
  Database,
  TableProperties,
  GripVertical,
  Check,
} from 'lucide-react';
import { ClientCustomTab } from '@/hooks/useClientCustomTabs';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface ManageTabsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tabs: ClientCustomTab[];
  onUpdateTab: (tabId: string, updates: Partial<ClientCustomTab>) => Promise<boolean>;
  onDeleteTab: (tabId: string) => Promise<boolean>;
  onRefresh: () => void;
}

// Icon mapping
const TAB_ICON_OPTIONS = [
  { value: 'Database', label: 'מסד נתונים' },
  { value: 'Table', label: 'טבלה' },
  { value: 'FileText', label: 'מסמך' },
  { value: 'Calendar', label: 'לוח שנה' },
  { value: 'List', label: 'רשימה' },
  { value: 'Users', label: 'אנשים' },
  { value: 'FolderKanban', label: 'פרויקט' },
  { value: 'DollarSign', label: 'כסף' },
];

export function ManageTabsDialog({
  open,
  onOpenChange,
  tabs,
  onUpdateTab,
  onDeleteTab,
  onRefresh,
}: ManageTabsDialogProps) {
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('Database');
  const [editFolder, setEditFolder] = useState<string | null>(null);
  const [deleteTabId, setDeleteTabId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['__unfiled__']));

  // Get unique folder names
  const folders = useMemo(() => {
    const folderSet = new Set<string>();
    tabs.forEach(tab => {
      if ((tab as any).folder_name) {
        folderSet.add((tab as any).folder_name);
      }
    });
    return Array.from(folderSet).sort();
  }, [tabs]);

  // Group tabs by folder
  const tabsByFolder = useMemo(() => {
    const grouped: Record<string, ClientCustomTab[]> = {
      '__unfiled__': [],
    };
    
    folders.forEach(f => {
      grouped[f] = [];
    });
    
    tabs.forEach(tab => {
      const folderName = (tab as any).folder_name;
      if (folderName && grouped[folderName]) {
        grouped[folderName].push(tab);
      } else {
        grouped['__unfiled__'].push(tab);
      }
    });
    
    return grouped;
  }, [tabs, folders]);

  // Toggle folder expansion
  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folder)) {
        next.delete(folder);
      } else {
        next.add(folder);
      }
      return next;
    });
  };

  // Start editing a tab
  const startEdit = (tab: ClientCustomTab) => {
    setEditingTab(tab.id);
    setEditName(tab.display_name);
    setEditIcon(tab.icon || 'Database');
    setEditFolder((tab as any).folder_name || null);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingTab(null);
    setEditName('');
    setEditIcon('Database');
    setEditFolder(null);
  };

  // Save edit
  const saveEdit = async () => {
    if (!editingTab || !editName.trim()) return;
    
    setIsSaving(true);
    try {
      const updates: any = {
        display_name: editName.trim(),
        icon: editIcon,
        folder_name: editFolder || null,
      };
      
      const success = await onUpdateTab(editingTab, updates);
      if (success) {
        cancelEdit();
        onRefresh();
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Delete tab
  const confirmDelete = async () => {
    if (!deleteTabId) return;
    
    const success = await onDeleteTab(deleteTabId);
    if (success) {
      setDeleteTabId(null);
      onRefresh();
    }
  };

  // Add new folder and assign to current editing tab
  const addNewFolder = async () => {
    if (!newFolderName.trim()) return;
    if (folders.includes(newFolderName.trim())) {
      toast({
        title: 'שגיאה',
        description: 'תיקיה בשם זה כבר קיימת',
        variant: 'destructive',
      });
      return;
    }
    
    const folderName = newFolderName.trim();
    
    // If we have an editing tab, update it directly with the new folder
    if (editingTab) {
      const success = await onUpdateTab(editingTab, { folder_name: folderName } as any);
      if (success) {
        toast({
          title: 'הצלחה',
          description: `הטאב שויך לתיקיה "${folderName}"`,
        });
        cancelEdit();
        onRefresh();
      }
    } else {
      // Just set it as the edit folder for later
      setEditFolder(folderName);
      toast({
        title: 'תיקיה חדשה',
        description: `התיקיה "${folderName}" תיווצר עם שמירת הטאב`,
      });
    }
    
    setNewFolderName('');
    setShowNewFolder(false);
  };

  // Render tab item
  const renderTabItem = (tab: ClientCustomTab) => {
    const isEditing = editingTab === tab.id;
    const isTableTab = (tab as any).tab_type === 'custom_table';
    const currentFolder = (tab as any).folder_name || null;
    
    return (
      <div
        key={tab.id}
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border transition-colors',
          isEditing 
            ? 'bg-primary/5 border-primary' 
            : 'bg-muted/30 border-border hover:border-border/80'
        )}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move flex-shrink-0" />
        
        {isEditing ? (
          <div className="flex-1 flex flex-wrap items-center gap-2">
            <Input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-40 flex-shrink-0"
              autoFocus
            />
            
            <Select value={editIcon} onValueChange={setEditIcon}>
              <SelectTrigger className="w-28 flex-shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAB_ICON_OPTIONS.map(icon => (
                  <SelectItem key={icon.value} value={icon.value}>
                    {icon.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={editFolder || '__none__'} 
              onValueChange={v => setEditFolder(v === '__none__' ? null : v)}
            >
              <SelectTrigger className="w-36 flex-shrink-0">
                <SelectValue placeholder="ללא תיקיה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">ללא תיקיה</SelectItem>
                {folders.map(folder => (
                  <SelectItem key={folder} value={folder}>{folder}</SelectItem>
                ))}
                <Separator className="my-1" />
                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-1"
                    onClick={e => {
                      e.stopPropagation();
                      setShowNewFolder(true);
                    }}
                  >
                    <FolderPlus className="h-3 w-3" />
                    תיקיה חדשה
                  </Button>
                </div>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-1 mr-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={saveEdit}
                disabled={isSaving}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEdit}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isTableTab && (
                <TableProperties className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <Database 
                className="h-4 w-4 flex-shrink-0" 
                style={{ color: tab.data_type?.color || undefined }}
              />
              <span className="font-medium truncate">{tab.display_name}</span>
              {tab.is_global && (
                <Badge variant="secondary" className="text-xs flex-shrink-0">גלובלי</Badge>
              )}
            </div>
            
            {/* Folder selector - always visible */}
            <Select 
              value={currentFolder || '__none__'} 
              onValueChange={async v => {
                if (v === '__new__') {
                  setEditingTab(tab.id);
                  setEditName(tab.display_name);
                  setEditIcon(tab.icon || 'Database');
                  setEditFolder(null);
                  setShowNewFolder(true);
                  return;
                }
                const newFolder = v === '__none__' ? null : v;
                const success = await onUpdateTab(tab.id, { folder_name: newFolder } as any);
                if (success) {
                  onRefresh();
                }
              }}
            >
              <SelectTrigger className="w-32 flex-shrink-0">
                <FolderOpen className="h-3 w-3 ml-1 text-amber-500" />
                <SelectValue placeholder="בחר תיקיה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">ללא תיקיה</SelectItem>
                {folders.map(folder => (
                  <SelectItem key={folder} value={folder}>{folder}</SelectItem>
                ))}
                <Separator className="my-1" />
                <SelectItem value="__new__" className="text-primary">
                  <span className="flex items-center gap-1">
                    <FolderPlus className="h-3 w-3" />
                    תיקיה חדשה...
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startEdit(tab)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTabId(tab.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    );
  };

  // Render folder section
  const renderFolderSection = (folderName: string, tabsInFolder: ClientCustomTab[]) => {
    const isExpanded = expandedFolders.has(folderName);
    const displayName = folderName === '__unfiled__' ? 'ללא תיקיה' : folderName;
    
    if (tabsInFolder.length === 0 && folderName === '__unfiled__') {
      return null;
    }
    
    return (
      <Collapsible
        key={folderName}
        open={isExpanded}
        onOpenChange={() => toggleFolder(folderName)}
        className="space-y-2"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-2 h-auto hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
              <FolderOpen className="h-4 w-4 text-amber-500" />
              <span className="font-medium">{displayName}</span>
              <Badge variant="secondary" className="text-xs">
                {tabsInFolder.length}
              </Badge>
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pr-6">
          {tabsInFolder.map(renderTabItem)}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col" dir="rtl">
          <DialogHeader className="text-right flex-shrink-0">
            <DialogTitle className="text-right">ניהול טאבים</DialogTitle>
            <DialogDescription className="text-right">
              ערוך, מחק או ארגן את הטאבים לתיקיות
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-auto" dir="rtl">
            <div className="space-y-4 py-4 px-1 min-w-[600px]">
              {/* New Folder Input */}
              {showNewFolder && (
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-amber-50 border-amber-200">
                  <FolderPlus className="h-4 w-4 text-amber-600" />
                  <Input
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    placeholder="שם התיקיה החדשה"
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={addNewFolder}
                    disabled={!newFolderName.trim()}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowNewFolder(false);
                      setNewFolderName('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Toolbar */}
              <div className="flex items-center justify-between flex-row-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewFolder(true)}
                  className="gap-1"
                >
                  <FolderPlus className="h-4 w-4" />
                  תיקיה חדשה
                </Button>
                <span className="text-sm text-muted-foreground">
                  {tabs.length} טאבים | {folders.length} תיקיות
                </span>
              </div>
              
              <Separator />
              
              {/* Folders and Tabs */}
              <div className="space-y-4">
                {/* Render folders with tabs */}
                {folders.map(folder => 
                  renderFolderSection(folder, tabsByFolder[folder] || [])
                )}
                
                {/* Unfiled tabs */}
                {renderFolderSection('__unfiled__', tabsByFolder['__unfiled__'] || [])}
                
                {/* Empty state */}
                {tabs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>אין טאבים מותאמים</p>
                    <p className="text-sm">הוסף טאבים חדשים מפרופיל הלקוח</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTabId} onOpenChange={open => !open && setDeleteTabId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת טאב</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הטאב הזה?
              <br />
              פעולה זו תמחק גם את כל הנתונים הקשורים ולא ניתן לשחזר אותם.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}