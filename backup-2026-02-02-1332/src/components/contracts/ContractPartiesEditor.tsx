// קומפוננטה לניהול צדדים לחוזה (מזמינים מרובים)
// מאפשרת הוספה, עריכה ומחיקה של מזמינים

import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, User, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ContractParty, PartyType, PARTY_TYPE_LABELS } from '@/hooks/useContractParties';

interface ContractPartiesEditorProps {
  parties: Omit<ContractParty, 'id' | 'contract_id' | 'created_at' | 'updated_at'>[];
  onChange: (parties: Omit<ContractParty, 'id' | 'contract_id' | 'created_at' | 'updated_at'>[]) => void;
  showRealEstateFields?: boolean;
}

const emptyParty = (): Omit<ContractParty, 'id' | 'contract_id' | 'created_at' | 'updated_at'> => ({
  party_type: 'orderer',
  name: '',
  id_number: '',
  phone: '',
  email: '',
  address: '',
  gush: '',
  helka: '',
  migrash: '',
  display_order: 1,
  is_primary: false,
  linked_client_id: undefined,
});

export function ContractPartiesEditor({ 
  parties, 
  onChange, 
  showRealEstateFields = true 
}: ContractPartiesEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newParty, setNewParty] = useState(emptyParty());

  // הוספת צד חדש
  const handleAddParty = () => {
    const nextOrder = parties.length + 1;
    onChange([
      ...parties,
      { ...newParty, display_order: nextOrder, is_primary: parties.length === 0 },
    ]);
    setNewParty(emptyParty());
    setAddDialogOpen(false);
  };

  // עדכון צד
  const handleUpdateParty = (index: number, updates: Partial<typeof newParty>) => {
    const updated = [...parties];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  // מחיקת צד
  const handleDeleteParty = (index: number) => {
    const updated = parties.filter((_, i) => i !== index);
    // עדכון סדר
    updated.forEach((p, i) => {
      p.display_order = i + 1;
      if (i === 0 && !updated.some(x => x.is_primary)) {
        p.is_primary = true;
      }
    });
    onChange(updated);
  };

  // סינון לפי סוג
  const orderers = parties.filter(p => p.party_type === 'orderer');
  const others = parties.filter(p => p.party_type !== 'orderer');

  return (
    <div className="space-y-4">
      {/* כותרת */}
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">מזמינים ({orderers.length})</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => {
            setNewParty(emptyParty());
            setAddDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 ml-1" />
          הוסף מזמין
        </Button>
      </div>

      {/* רשימת מזמינים */}
      {parties.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
          <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>לא הוגדרו מזמינים</p>
          <Button 
            type="button" 
            variant="link" 
            onClick={() => setAddDialogOpen(true)}
          >
            הוסף מזמין ראשון
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {parties.map((party, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-3">
                {editingIndex === index ? (
                  // מצב עריכה
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">שם *</Label>
                        <Input
                          value={party.name}
                          onChange={(e) => handleUpdateParty(index, { name: e.target.value })}
                          placeholder="שם מלא"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">ת.ז.</Label>
                        <Input
                          value={party.id_number || ''}
                          onChange={(e) => handleUpdateParty(index, { id_number: e.target.value })}
                          placeholder="תעודת זהות"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">טלפון</Label>
                        <Input
                          value={party.phone || ''}
                          onChange={(e) => handleUpdateParty(index, { phone: e.target.value })}
                          placeholder="טלפון"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">אימייל</Label>
                        <Input
                          value={party.email || ''}
                          onChange={(e) => handleUpdateParty(index, { email: e.target.value })}
                          placeholder="אימייל"
                          type="email"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">כתובת</Label>
                      <Input
                        value={party.address || ''}
                        onChange={(e) => handleUpdateParty(index, { address: e.target.value })}
                        placeholder="כתובת"
                      />
                    </div>
                    {showRealEstateFields && (
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">גוש</Label>
                          <Input
                            value={party.gush || ''}
                            onChange={(e) => handleUpdateParty(index, { gush: e.target.value })}
                            placeholder="גוש"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">חלקה</Label>
                          <Input
                            value={party.helka || ''}
                            onChange={(e) => handleUpdateParty(index, { helka: e.target.value })}
                            placeholder="חלקה"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">מגרש</Label>
                          <Input
                            value={party.migrash || ''}
                            onChange={(e) => handleUpdateParty(index, { migrash: e.target.value })}
                            placeholder="מגרש"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingIndex(null)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  // מצב תצוגה
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{party.name || 'ללא שם'}</span>
                        {party.is_primary && (
                          <Badge variant="secondary" className="text-xs">ראשי</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {PARTY_TYPE_LABELS[party.party_type]}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {[
                          party.id_number && `ת.ז.: ${party.id_number}`,
                          party.phone,
                          party.gush && `גוש ${party.gush}`,
                        ].filter(Boolean).join(' | ')}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingIndex(index)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteParty(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* דיאלוג הוספת מזמין */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>הוספת מזמין</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>סוג</Label>
              <Select 
                value={newParty.party_type}
                onValueChange={(v) => setNewParty({ ...newParty, party_type: v as PartyType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PARTY_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>שם *</Label>
                <Input
                  value={newParty.name}
                  onChange={(e) => setNewParty({ ...newParty, name: e.target.value })}
                  placeholder="שם מלא"
                />
              </div>
              <div>
                <Label>ת.ז.</Label>
                <Input
                  value={newParty.id_number || ''}
                  onChange={(e) => setNewParty({ ...newParty, id_number: e.target.value })}
                  placeholder="תעודת זהות"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>טלפון</Label>
                <Input
                  value={newParty.phone || ''}
                  onChange={(e) => setNewParty({ ...newParty, phone: e.target.value })}
                  placeholder="טלפון"
                />
              </div>
              <div>
                <Label>אימייל</Label>
                <Input
                  value={newParty.email || ''}
                  onChange={(e) => setNewParty({ ...newParty, email: e.target.value })}
                  placeholder="אימייל"
                  type="email"
                />
              </div>
            </div>

            <div>
              <Label>כתובת</Label>
              <Input
                value={newParty.address || ''}
                onChange={(e) => setNewParty({ ...newParty, address: e.target.value })}
                placeholder="כתובת"
              />
            </div>

            {showRealEstateFields && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>גוש</Label>
                  <Input
                    value={newParty.gush || ''}
                    onChange={(e) => setNewParty({ ...newParty, gush: e.target.value })}
                    placeholder="גוש"
                  />
                </div>
                <div>
                  <Label>חלקה</Label>
                  <Input
                    value={newParty.helka || ''}
                    onChange={(e) => setNewParty({ ...newParty, helka: e.target.value })}
                    placeholder="חלקה"
                  />
                </div>
                <div>
                  <Label>מגרש</Label>
                  <Input
                    value={newParty.migrash || ''}
                    onChange={(e) => setNewParty({ ...newParty, migrash: e.target.value })}
                    placeholder="מגרש"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              ביטול
            </Button>
            <Button 
              onClick={handleAddParty}
              disabled={!newParty.name.trim()}
            >
              הוסף
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ContractPartiesEditor;
