// Bulk Consultant Assignment Dialog - tenarch CRM Pro
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { Users, Plus, Check, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Consultant {
  id: string;
  name: string;
  profession: string | null;
  company: string | null;
}

interface BulkConsultantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClientIds: string[];
  onUpdate: () => void;
}

export function BulkConsultantDialog({
  isOpen,
  onClose,
  selectedClientIds,
  onUpdate,
}: BulkConsultantDialogProps) {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedConsultantId, setSelectedConsultantId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingConsultants, setIsLoadingConsultants] = useState(true);

  // Fetch consultants
  useEffect(() => {
    if (isOpen) {
      fetchConsultants();
    }
  }, [isOpen]);

  const fetchConsultants = async () => {
    setIsLoadingConsultants(true);
    try {
      const { data, error } = await supabase
        .from('consultants')
        .select('id, name, profession, company')
        .order('name');

      if (error) throw error;

      setConsultants(data || []);
    } catch (error) {
      console.error('Error fetching consultants:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את רשימת היועצים',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingConsultants(false);
    }
  };

  const filteredConsultants = consultants.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.profession && c.profession.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedConsultant = consultants.find((c) => c.id === selectedConsultantId);

  const handleApply = async () => {
    if (!selectedConsultantId) {
      toast({
        title: 'בחר יועץ',
        description: 'יש לבחור יועץ להחלה',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    try {
      const clientIds = selectedClientIds;

      // Assign consultant to each client
      for (const clientId of clientIds) {
        const { error } = await supabase
          .from('client_consultants')
          .upsert({
            client_id: clientId,
            consultant_id: selectedConsultantId,
            status: 'active',
          }, {
            onConflict: 'client_id,consultant_id'
          });

        if (error) throw error;
      }

      toast({
        title: 'היועץ הוגדר בהצלחה',
        description: `${selectedConsultant?.name} הוגדר ל-${clientIds.length} לקוחות`,
      });

      onUpdate();
      handleClose();
    } catch (error) {
      console.error('Error assigning consultant:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להגדיר את היועץ ללקוחות',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setSelectedConsultantId('');
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            הגדרת יועץ ל-{selectedClientIds.length} לקוחות
          </DialogTitle>
          <DialogDescription>
            בחר יועץ להגדרה עבור הלקוחות שנבחרו
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Bar */}
          <div className="space-y-2">
            <Input
              placeholder="חפש יועץ לפי שם, תפקיד או חברה..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Consultants List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              יועצים ({filteredConsultants.length})
            </h3>
            {isLoadingConsultants ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredConsultants.length > 0 ? (
              <ScrollArea className="h-96 border rounded-lg p-2">
                <div className="space-y-2">
                  {filteredConsultants.map((consultant) => (
                    <button
                      key={consultant.id}
                      onClick={() => setSelectedConsultantId(consultant.id)}
                      className={cn(
                        "w-full p-3 border-2 rounded-lg text-right transition-all",
                        selectedConsultantId === consultant.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                          : "border-border hover:border-blue-300 hover:bg-accent"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium text-sm truncate">
                              {consultant.name}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {consultant.profession && (
                              <Badge variant="outline" className="text-xs">
                                {consultant.profession}
                              </Badge>
                            )}
                            {consultant.company && (
                              <Badge variant="secondary" className="text-xs">
                                {consultant.company}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {selectedConsultantId === consultant.id && (
                          <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            ) : searchQuery ? (
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">לא נמצאו יועצים התואמים לחיפוש</p>
                <p className="text-xs mt-1">נסה לשנות את מילות החיפוש</p>
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">אין יועצים במערכת</p>
                <p className="text-xs mt-1">הוסף יועץ דרך דף היועצים</p>
              </div>
            )}
          </div>

          {/* Selected Consultant Preview */}
          {selectedConsultant && (
            <div className="border-t pt-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-muted-foreground mb-1">יועץ נבחר:</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    <User className="h-3 w-3 mr-1" />
                    {selectedConsultant.name}
                  </Badge>
                  {selectedConsultant.profession && (
                    <Badge variant="outline" className="text-xs">
                      {selectedConsultant.profession}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            ביטול
          </Button>
          <Button
            onClick={handleApply}
            disabled={!selectedConsultantId || isUpdating}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                מגדיר...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                הגדר יועץ ל-{selectedClientIds.length} לקוחות
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
