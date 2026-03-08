// Dialog for adding a custom tab to client profile (based on data types)
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useDataTypes } from '@/hooks/useDataTypes';
import { useClientCustomTabs, CreateTabInput } from '@/hooks/useClientCustomTabs';
import {
  Database,
  Users,
  UserCog,
  FolderKanban,
  FileText,
  Table,
  Grid3X3,
  LayoutGrid,
  Loader2,
  X,
} from 'lucide-react';

// Icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
  Database,
  Users,
  UserCog,
  FolderKanban,
  FileText,
  Table,
  Grid3X3,
};

interface AddCustomTabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  onSuccess?: () => void;
}

export function AddCustomTabDialog({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: AddCustomTabDialogProps) {
  const { dataTypes, isLoading: loadingDataTypes } = useDataTypes();
  const { createTab } = useClientCustomTabs(clientId);

  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [displayMode, setDisplayMode] = useState<'table' | 'cards' | 'both'>('both');
  const [isGlobal, setIsGlobal] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedDataTypes.length === 0) return;

    setIsSubmitting(true);
    try {
      // Get the first selected type for icon/name defaults
      const firstType = dataTypes.find(dt => dt.id === selectedDataTypes[0]);
      
      const input: CreateTabInput = {
        data_type_ids: selectedDataTypes,
        display_name: displayName || firstType?.display_name || 'טאב חדש',
        icon: firstType?.icon || 'Database',
        display_mode: displayMode,
        is_global: isGlobal,
        client_id: !isGlobal && clientId ? clientId : undefined,
      };

      const result = await createTab(input);
      if (result) {
        // Reset form
        setSelectedDataTypes([]);
        setDisplayName('');
        setDisplayMode('both');
        setIsGlobal(true);
        onOpenChange(false);
        onSuccess?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDataType = (dataTypeId: string) => {
    setSelectedDataTypes(prev => {
      if (prev.includes(dataTypeId)) {
        return prev.filter(id => id !== dataTypeId);
      } else {
        return [...prev, dataTypeId];
      }
    });
  };

  const removeDataType = (dataTypeId: string) => {
    setSelectedDataTypes(prev => prev.filter(id => id !== dataTypeId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת טאב מותאם</DialogTitle>
          <DialogDescription>
            בחר סוג נתונים ליצירת טאב חדש בפרופיל הלקוח
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selected Data Types */}
          {selectedDataTypes.length > 0 && (
            <div className="space-y-2">
              <Label>סוגי נתונים נבחרים ({selectedDataTypes.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedDataTypes.map((dtId) => {
                  const dt = dataTypes.find(d => d.id === dtId);
                  if (!dt) return null;
                  const IconComponent = ICON_MAP[dt.icon || 'Database'] || Database;
                  return (
                    <Badge
                      key={dtId}
                      variant="secondary"
                      className="gap-2 pr-2 pl-1"
                    >
                      <IconComponent 
                        className="h-3 w-3" 
                        style={{ color: dt.color || undefined }}
                      />
                      <span>{dt.display_name}</span>
                      <button
                        type="button"
                        onClick={() => removeDataType(dtId)}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Data Type Selection */}
          <div className="space-y-2">
            <Label>בחר סוגי נתונים</Label>
            <ScrollArea className="h-64 rounded-md border p-2">
              {loadingDataTypes ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {dataTypes.map((dt) => {
                    const IconComponent = ICON_MAP[dt.icon || 'Database'] || Database;
                    const isSelected = selectedDataTypes.includes(dt.id);
                    return (
                      <div
                        key={dt.id}
                        className="flex items-center space-x-2 space-x-reverse p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleDataType(dt.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleDataType(dt.id)}
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <IconComponent 
                            className="h-4 w-4" 
                            style={{ color: dt.color || undefined }}
                          />
                          <span className="flex-1">{dt.display_name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({dt.source_type === 'system' ? 'מערכת' : 'מותאם'})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">שם הטאב</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="הזן שם לתצוגה..."
            />
          </div>

          {/* Display Mode */}
          <div className="space-y-2">
            <Label>תצוגה</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={displayMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDisplayMode('table')}
                className="flex-1 gap-2"
              >
                <Table className="h-4 w-4" />
                טבלה
              </Button>
              <Button
                type="button"
                variant={displayMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDisplayMode('cards')}
                className="flex-1 gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                כרטיסים
              </Button>
              <Button
                type="button"
                variant={displayMode === 'both' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDisplayMode('both')}
                className="flex-1 gap-2"
              >
                <Grid3X3 className="h-4 w-4" />
                שניהם
              </Button>
            </div>
          </div>

          {/* Global Switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>הצג לכל הלקוחות</Label>
              <p className="text-xs text-muted-foreground">
                {isGlobal 
                  ? 'הטאב יופיע בכל דפי הלקוחות' 
                  : 'הטאב יופיע רק ללקוח הנוכחי'}
              </p>
            </div>
            <Switch
              checked={isGlobal}
              onCheckedChange={setIsGlobal}
            />
          </div>

          {/* Preview */}
          {selectedDataTypes.length > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-2">תצוגה מקדימה:</p>
              <div className="flex items-center gap-2 mb-2">
                {(() => {
                  const firstType = dataTypes.find(dt => dt.id === selectedDataTypes[0]);
                  if (!firstType) return null;
                  const IconComponent = ICON_MAP[firstType.icon || 'Database'] || Database;
                  return (
                    <IconComponent 
                      className="h-5 w-5" 
                      style={{ color: firstType.color || undefined }}
                    />
                  );
                })()}
                <span className="font-medium">{displayName || 'טאב חדש'}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                יציג {selectedDataTypes.length} סוגי נתונים: {selectedDataTypes.map(id => {
                  const dt = dataTypes.find(d => d.id === id);
                  return dt?.display_name;
                }).join(', ')}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={selectedDataTypes.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  יוצר...
                </>
              ) : (
                <>צור טאב ({selectedDataTypes.length})</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
