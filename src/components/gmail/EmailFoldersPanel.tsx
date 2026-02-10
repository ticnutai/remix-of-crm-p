// Email Folders Panel - Manage folders and auto-classification rules
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FolderPlus,
  Folder,
  FolderOpen,
  User,
  Mail,
  Settings,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  Zap,
  Filter,
  Building2,
  Tag,
  Star,
  AlertCircle,
  Check,
  X,
  Sparkles,
  Users,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmailFolders, EmailFolder, EmailAutoRule } from '@/hooks/useEmailFolders';
import { GmailMessage } from '@/hooks/useGmailIntegration';

// Color options for folders
const FOLDER_COLORS = [
  { value: '#3B82F6', label: 'כחול' },
  { value: '#10B981', label: 'ירוק' },
  { value: '#F59E0B', label: 'כתום' },
  { value: '#EF4444', label: 'אדום' },
  { value: '#8B5CF6', label: 'סגול' },
  { value: '#EC4899', label: 'ורוד' },
  { value: '#6B7280', label: 'אפור' },
  { value: '#1e3a5f', label: 'כהה' },
];

// Icon options for folders
const FOLDER_ICONS = [
  { value: 'folder', label: 'תיקייה', icon: Folder },
  { value: 'user', label: 'לקוח', icon: User },
  { value: 'building', label: 'חברה', icon: Building2 },
  { value: 'mail', label: 'מייל', icon: Mail },
  { value: 'tag', label: 'תגית', icon: Tag },
  { value: 'star', label: 'כוכב', icon: Star },
  { value: 'alert', label: 'חשוב', icon: AlertCircle },
];

interface EmailFoldersPanelProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onAddEmailToFolder?: (email: GmailMessage, folderId: string) => void;
  currentEmail?: GmailMessage | null;
  className?: string;
}

export function EmailFoldersPanel({
  selectedFolderId,
  onSelectFolder,
  onAddEmailToFolder,
  currentEmail,
  className,
}: EmailFoldersPanelProps) {
  const {
    folders,
    autoRules,
    clients,
    loading,
    createFolder,
    updateFolder,
    deleteFolder,
    createAutoRule,
    toggleAutoRule,
    deleteAutoRule,
    addEmailToFolder,
    batchAutoClassify,
    createClientAutoRule,
    loadFolders,
  } = useEmailFolders();

  // Dialog states
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<EmailFolder | null>(null);

  // Form states
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3B82F6');
  const [newFolderIcon, setNewFolderIcon] = useState('folder');
  const [newFolderClientId, setNewFolderClientId] = useState<string>('');

  // Rule form states
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleFolderId, setNewRuleFolderId] = useState('');
  const [newRuleType, setNewRuleType] = useState<'sender_email' | 'sender_name' | 'subject_contains'>('sender_email');
  const [newRuleValue, setNewRuleValue] = useState('');
  const [newRuleClientId, setNewRuleClientId] = useState<string>('');

  // Collapsible states
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);
  const [isClientsExpanded, setIsClientsExpanded] = useState(true);

  // Get icon component
  const getIconComponent = (iconName: string) => {
    const found = FOLDER_ICONS.find(i => i.value === iconName);
    return found ? found.icon : Folder;
  };

  // Handle create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    await createFolder(newFolderName.trim(), {
      color: newFolderColor,
      icon: newFolderIcon,
      clientId: newFolderClientId || undefined,
    });

    setNewFolderName('');
    setNewFolderColor('#3B82F6');
    setNewFolderIcon('folder');
    setNewFolderClientId('');
    setIsCreateFolderOpen(false);
  };

  // Handle create rule
  const handleCreateRule = async () => {
    if (!newRuleName.trim() || !newRuleFolderId || !newRuleValue.trim()) return;

    await createAutoRule(
      newRuleName.trim(),
      newRuleFolderId,
      newRuleType,
      newRuleValue.trim(),
      newRuleClientId || undefined
    );

    setNewRuleName('');
    setNewRuleFolderId('');
    setNewRuleType('sender_email');
    setNewRuleValue('');
    setNewRuleClientId('');
    setIsCreateRuleOpen(false);
  };

  // Handle add current email to folder
  const handleAddCurrentEmailToFolder = async (folderId: string) => {
    if (!currentEmail) return;
    await addEmailToFolder(folderId, currentEmail);
    onAddEmailToFolder?.(currentEmail, folderId);
  };

  // Client folders (system folders created for clients)
  const clientFolders = folders.filter(f => f.client_id);
  const customFolders = folders.filter(f => !f.client_id);

  return (
    <div className={cn("space-y-3", className)} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-[#d4a843]" />
          תיקיות מייל
        </h3>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => loadFolders()} className="h-7 w-7 p-0">
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>רענן</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <FolderPlus className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>יצירת תיקייה חדשה</DialogTitle>
                <DialogDescription>צור תיקייה לסיווג מיילים</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>שם התיקייה</Label>
                  <Input
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    placeholder="לדוגמה: חשבוניות"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>צבע</Label>
                    <Select value={newFolderColor} onValueChange={setNewFolderColor}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FOLDER_COLORS.map(color => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: color.value }}
                              />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>אייקון</Label>
                    <Select value={newFolderIcon} onValueChange={setNewFolderIcon}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FOLDER_ICONS.map(icon => {
                          const IconComp = icon.icon;
                          return (
                            <SelectItem key={icon.value} value={icon.value}>
                              <div className="flex items-center gap-2">
                                <IconComp className="h-3 w-3" />
                                {icon.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>קישור ללקוח (אופציונלי)</Label>
                  <Select value={newFolderClientId} onValueChange={setNewFolderClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר לקוח..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">ללא קישור</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                  ביטול
                </Button>
                <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                  צור תיקייה
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>הגדרות סיווג אוטומטי</DialogTitle>
                <DialogDescription>
                  נהל כללים לסיווג אוטומטי של מיילים
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-auto">
                {/* Create new rule */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      צור כלל חדש
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="שם הכלל"
                        value={newRuleName}
                        onChange={e => setNewRuleName(e.target.value)}
                      />
                      <Select value={newRuleFolderId} onValueChange={setNewRuleFolderId}>
                        <SelectTrigger>
                          <SelectValue placeholder="תיקייה יעד" />
                        </SelectTrigger>
                        <SelectContent>
                          {folders.map(folder => (
                            <SelectItem key={folder.id} value={folder.id}>
                              {folder.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={newRuleType} onValueChange={(v: any) => setNewRuleType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sender_email">לפי כתובת מייל</SelectItem>
                          <SelectItem value="sender_name">לפי שם שולח</SelectItem>
                          <SelectItem value="subject_contains">לפי נושא</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder={
                          newRuleType === 'sender_email' ? 'example@domain.com' :
                          newRuleType === 'sender_name' ? 'שם השולח' :
                          'מילת מפתח בנושא'
                        }
                        value={newRuleValue}
                        onChange={e => setNewRuleValue(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleCreateRule}
                      disabled={!newRuleName || !newRuleFolderId || !newRuleValue}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      הוסף כלל
                    </Button>
                  </CardContent>
                </Card>

                {/* Existing rules */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">כללים פעילים ({autoRules.length})</h4>
                  {autoRules.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      אין כללים אוטומטיים
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {autoRules.map(rule => (
                        <div
                          key={rule.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={rule.is_active}
                              onCheckedChange={(checked) => toggleAutoRule(rule.id, checked)}
                            />
                            <div>
                              <p className="font-medium text-sm">{rule.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {rule.rule_type === 'sender_email' && `מייל: ${rule.rule_value}`}
                                {rule.rule_type === 'sender_name' && `שם: ${rule.rule_value}`}
                                {rule.rule_type === 'subject_contains' && `נושא מכיל: ${rule.rule_value}`}
                                {' → '}
                                {rule.folder_name}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAutoRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* All Emails button */}
      <Button
        variant={selectedFolderId === null ? 'default' : 'ghost'}
        className={cn(
          "w-full justify-start gap-2 h-8",
          selectedFolderId === null && "bg-[#1e3a5f]"
        )}
        onClick={() => onSelectFolder(null)}
      >
        <Mail className="h-4 w-4" />
        כל המיילים
      </Button>

      <Separator />

      {/* Custom Folders */}
      <Collapsible open={isFoldersExpanded} onOpenChange={setIsFoldersExpanded}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-sm font-medium">
          <span className="flex items-center gap-2">
            <Folder className="h-3.5 w-3.5" />
            תיקיות ({customFolders.length})
          </span>
          {isFoldersExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 mt-2">
          {customFolders.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              אין תיקיות מותאמות
            </p>
          ) : (
            customFolders.map(folder => {
              const IconComp = getIconComponent(folder.icon);
              return (
                <div
                  key={folder.id}
                  className={cn(
                    "flex items-center justify-between group rounded-md px-2 py-1.5 cursor-pointer transition-colors",
                    selectedFolderId === folder.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                  onClick={() => onSelectFolder(folder.id)}
                >
                  <div className="flex items-center gap-2">
                    <IconComp
                      className="h-4 w-4"
                      style={{ color: folder.color }}
                    />
                    <span className="text-sm truncate">{folder.name}</span>
                    {folder.email_count > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                        {folder.email_count}
                      </Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {currentEmail && (
                        <>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddCurrentEmailToFolder(folder.id);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            הוסף מייל נוכחי
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setEditingFolder(folder);
                      }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        ערוך
                      </DropdownMenuItem>
                      {!folder.is_system && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFolder(folder.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          מחק
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Client Folders */}
      <Collapsible open={isClientsExpanded} onOpenChange={setIsClientsExpanded}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-sm font-medium">
          <span className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            לקוחות ({clientFolders.length})
          </span>
          {isClientsExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 mt-2">
          {clientFolders.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              אין תיקיות לקוח
            </p>
          ) : (
            clientFolders.map(folder => (
              <div
                key={folder.id}
                className={cn(
                  "flex items-center justify-between group rounded-md px-2 py-1.5 cursor-pointer transition-colors",
                  selectedFolderId === folder.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                )}
                onClick={() => onSelectFolder(folder.id)}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  <span className="text-sm truncate">{folder.name}</span>
                  {folder.email_count > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                      {folder.email_count}
                    </Badge>
                  )}
                </div>
                {currentEmail && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddCurrentEmailToFolder(folder.id);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Auto Rules Section */}
      <Collapsible open={isRulesExpanded} onOpenChange={setIsRulesExpanded}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-sm font-medium">
          <span className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-yellow-500" />
            כללים אוטומטיים ({autoRules.filter(r => r.is_active).length})
          </span>
          {isRulesExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="space-y-1">
            {autoRules.slice(0, 5).map(rule => (
              <div
                key={rule.id}
                className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    rule.is_active ? "bg-green-500" : "bg-gray-300"
                  )} />
                  <span className="truncate">{rule.name}</span>
                </div>
                <Switch
                  checked={rule.is_active}
                  onCheckedChange={(checked) => toggleAutoRule(rule.id, checked)}
                  className="scale-75"
                />
              </div>
            ))}
            {autoRules.length > 5 && (
              <Button
                variant="link"
                size="sm"
                className="w-full text-xs"
                onClick={() => setIsSettingsOpen(true)}
              >
                הצג עוד {autoRules.length - 5} כללים
              </Button>
            )}
            {autoRules.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                צור כלל אוטומטי
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// Quick classify button for email list
export function QuickClassifyButton({
  email,
  folders,
  onClassify,
}: {
  email: GmailMessage;
  folders: EmailFolder[];
  onClassify: (folderId: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <FolderPlus className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          סווג לתיקייה
        </div>
        {folders.map(folder => (
          <DropdownMenuItem
            key={folder.id}
            onClick={() => onClassify(folder.id)}
          >
            <Folder className="h-4 w-4 mr-2" style={{ color: folder.color }} />
            {folder.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
