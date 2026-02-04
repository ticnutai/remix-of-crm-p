import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Building2,
  User,
  Briefcase,
  Edit2,
  Phone,
  Mail,
  MapPin,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { DocumentParty } from './types';

interface PartiesEditorProps {
  parties: DocumentParty[];
  onAddParty: (party: Omit<DocumentParty, 'id'>) => void;
  onUpdateParty: (id: string, updates: Partial<DocumentParty>) => void;
  onRemoveParty: (id: string) => void;
}

const PARTY_TYPES = [
  { value: 'company', label: 'חברה', icon: Building2, color: 'bg-blue-100 text-blue-700' },
  { value: 'client', label: 'לקוח', icon: User, color: 'bg-green-100 text-green-700' },
  { value: 'contractor', label: 'קבלן', icon: Briefcase, color: 'bg-orange-100 text-orange-700' },
] as const;

const defaultNewParty: Omit<DocumentParty, 'id'> = {
  type: 'client',
  name: '',
  company: '',
  idNumber: '',
  email: '',
  phone: '',
  address: '',
  role: '',
};

export function PartiesEditor({
  parties,
  onAddParty,
  onUpdateParty,
  onRemoveParty,
}: PartiesEditorProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newParty, setNewParty] = useState<Omit<DocumentParty, 'id'>>(defaultNewParty);
  const [editingParty, setEditingParty] = useState<DocumentParty | null>(null);

  const handleAddParty = () => {
    if (!newParty.name.trim()) return;
    onAddParty(newParty);
    setNewParty(defaultNewParty);
    setIsAddDialogOpen(false);
  };

  const handleSaveEdit = () => {
    if (!editingParty) return;
    onUpdateParty(editingParty.id, editingParty);
    setEditingParty(null);
  };

  const getPartyTypeInfo = (type: DocumentParty['type']) => {
    return PARTY_TYPES.find((t) => t.value === type) || PARTY_TYPES[1];
  };

  const PartyDialog = ({
    party,
    setParty,
    onSave,
    title,
  }: {
    party: Omit<DocumentParty, 'id'>;
    setParty: (party: Omit<DocumentParty, 'id'>) => void;
    onSave: () => void;
    title: string;
  }) => (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="type">סוג צד</Label>
          <Select
            value={party.type}
            onValueChange={(value) =>
              setParty({ ...party, type: value as DocumentParty['type'] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PARTY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name">שם מלא *</Label>
          <Input
            id="name"
            value={party.name}
            onChange={(e) => setParty({ ...party, name: e.target.value })}
            placeholder="שם פרטי ומשפחה / שם העסק"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="company">חברה</Label>
          <Input
            id="company"
            value={party.company || ''}
            onChange={(e) => setParty({ ...party, company: e.target.value })}
            placeholder="שם החברה (אופציונלי)"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="idNumber">ת.ז / ח.פ</Label>
            <Input
              id="idNumber"
              value={party.idNumber || ''}
              onChange={(e) => setParty({ ...party, idNumber: e.target.value })}
              placeholder="מספר זיהוי"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">תפקיד בהסכם</Label>
            <Input
              id="role"
              value={party.role || ''}
              onChange={(e) => setParty({ ...party, role: e.target.value })}
              placeholder='לדוגמה: "מזמין", "ספק"'
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="phone">טלפון</Label>
            <Input
              id="phone"
              type="tel"
              dir="ltr"
              value={party.phone || ''}
              onChange={(e) => setParty({ ...party, phone: e.target.value })}
              placeholder="050-1234567"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              value={party.email || ''}
              onChange={(e) => setParty({ ...party, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="address">כתובת</Label>
          <Input
            id="address"
            value={party.address || ''}
            onChange={(e) => setParty({ ...party, address: e.target.value })}
            placeholder="רחוב, עיר"
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onSave} disabled={!party.name.trim()}>
          שמור
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">צדדים להסכם</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                הוסף צד
              </Button>
            </DialogTrigger>
            <DialogContent>
              <PartyDialog
                party={newParty}
                setParty={setNewParty}
                onSave={handleAddParty}
                title="הוספת צד חדש"
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {parties.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <p>אין צדדים</p>
            <p className="text-sm mt-1">הוסף את הצדדים המעורבים בהסכם</p>
          </div>
        ) : (
          <div className="space-y-3">
            {parties.map((party) => {
              const typeInfo = getPartyTypeInfo(party.type);
              const TypeIcon = typeInfo.icon;

              return (
                <div
                  key={party.id}
                  className="border rounded-lg p-3 bg-background hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={cn(
                          'p-2 rounded-lg shrink-0',
                          typeInfo.color
                        )}
                      >
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold truncate">{party.name}</span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {typeInfo.label}
                          </Badge>
                          {party.role && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {party.role}
                            </Badge>
                          )}
                        </div>
                        {party.company && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5" />
                            {party.company}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          {party.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span dir="ltr">{party.phone}</span>
                            </div>
                          )}
                          {party.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span dir="ltr">{party.email}</span>
                            </div>
                          )}
                          {party.address && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {party.address}
                            </div>
                          )}
                          {party.idNumber && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {party.idNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Dialog
                        open={editingParty?.id === party.id}
                        onOpenChange={(open) => setEditingParty(open ? party : null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          {editingParty && (
                            <PartyDialog
                              party={editingParty}
                              setParty={(p) =>
                                setEditingParty({
                                  ...editingParty,
                                  ...p,
                                } as DocumentParty)
                              }
                              onSave={handleSaveEdit}
                              title="עריכת צד"
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>מחיקת צד</AlertDialogTitle>
                            <AlertDialogDescription>
                              האם אתה בטוח שברצונך למחוק את "{party.name}" מההסכם?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onRemoveParty(party.id)}>
                              מחק
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
