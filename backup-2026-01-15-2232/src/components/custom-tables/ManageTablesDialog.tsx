import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  FileSpreadsheet,
  Users,
  FolderKanban,
  Package,
  Briefcase,
  Building,
  Car,
  ShoppingCart,
  Wallet,
  FileText,
  Calendar,
  Clock,
  Star,
  Heart,
  Edit2,
  Trash2,
  Copy,
  FolderOpen,
  Loader2,
} from 'lucide-react';
import { CustomTable } from '@/hooks/useCustomTables';

const ICON_MAP: Record<string, React.ElementType> = {
  Table,
  FileSpreadsheet,
  Users,
  FolderKanban,
  Package,
  Briefcase,
  Building,
  Car,
  ShoppingCart,
  Wallet,
  FileText,
  Calendar,
  Clock,
  Star,
  Heart,
};

interface ManageTablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: CustomTable[];
  onUpdateTable: (tableId: string, updates: { display_name?: string; description?: string }) => Promise<boolean>;
  onDeleteTable: (tableId: string) => Promise<boolean>;
  onDuplicateTable: (tableId: string) => Promise<CustomTable | null>;
  onSelectTable: (tableId: string) => void;
}

export function ManageTablesDialog({
  open,
  onOpenChange,
  tables,
  onUpdateTable,
  onDeleteTable,
  onDuplicateTable,
  onSelectTable,
}: ManageTablesDialogProps) {
  const [editingTable, setEditingTable] = useState<CustomTable | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deletingTableId, setDeletingTableId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartEdit = (table: CustomTable) => {
    setEditingTable(table);
    setEditName(table.display_name);
    setEditDescription(table.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingTable) return;
    
    setIsProcessing(true);
    const success = await onUpdateTable(editingTable.id, {
      display_name: editName,
      description: editDescription || undefined,
    });
    setIsProcessing(false);
    
    if (success) {
      setEditingTable(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingTableId) return;
    
    setIsProcessing(true);
    await onDeleteTable(deletingTableId);
    setIsProcessing(false);
    setDeletingTableId(null);
  };

  const handleDuplicate = async (tableId: string) => {
    setIsProcessing(true);
    const newTable = await onDuplicateTable(tableId);
    setIsProcessing(false);
    
    if (newTable) {
      onSelectTable(`custom_${newTable.id}`);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              ניהול טבלאות מותאמות
            </DialogTitle>
            <DialogDescription>
              צפה, ערוך, שכפל או מחק טבלאות מותאמות
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh] pr-4">
            {tables.length === 0 ? (
              <div className="py-12 text-center">
                <Table className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">אין טבלאות מותאמות</p>
                <p className="text-sm text-muted-foreground">לחץ על כפתור "+" ליצירת טבלה חדשה</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tables.map((table) => {
                  const IconComponent = ICON_MAP[table.icon] || Table;
                  const isEditing = editingTable?.id === table.id;
                  
                  return (
                    <div
                      key={table.id}
                      className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                    >
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>שם הטבלה</Label>
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="שם הטבלה"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>תיאור (אופציונלי)</Label>
                            <Input
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              placeholder="תיאור קצר של הטבלה"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingTable(null)}
                              disabled={isProcessing}
                            >
                              ביטול
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              disabled={isProcessing || !editName.trim()}
                            >
                              {isProcessing && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                              שמור
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <IconComponent className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{table.display_name}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{table.columns.length} עמודות</span>
                                {table.description && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate max-w-[200px]">{table.description}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleStartEdit(table)}
                              title="עריכה"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDuplicate(table.id)}
                              disabled={isProcessing}
                              title="שכפול"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeletingTableId(table.id)}
                              title="מחיקה"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <Badge variant="secondary">
                {tables.length} טבלאות
              </Badge>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                סגור
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTableId} onOpenChange={() => setDeletingTableId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle>מחיקת טבלה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הטבלה?
              <br />
              פעולה זו תמחק את כל הנתונים בטבלה ולא ניתן לבטל אותה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel disabled={isProcessing}>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              מחק טבלה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
