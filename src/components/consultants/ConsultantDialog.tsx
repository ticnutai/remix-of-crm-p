// Consultant Dialog - Add or select a consultant for a task
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  UserPlus, 
  Search, 
  Phone, 
  Mail, 
  Building, 
  FileText,
  User,
  Hash,
  CheckCircle,
} from 'lucide-react';
import { useConsultants, Consultant, CONSULTANT_KEYWORDS } from '@/hooks/useConsultants';
import { cn } from '@/lib/utils';

interface ConsultantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyword: string;
  keywordContext: string;
  onSelectConsultant: (consultant: Consultant) => void;
}

const PROFESSIONS = [
  { value: 'יועץ', label: 'יועץ' },
  { value: 'מהנדס', label: 'מהנדס' },
  { value: 'אדריכל', label: 'אדריכל' },
];

export function ConsultantDialog({
  open,
  onOpenChange,
  keyword,
  keywordContext,
  onSelectConsultant,
}: ConsultantDialogProps) {
  const { consultants, loading, addConsultant } = useConsultants();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'select' | 'add'>('select');
  
  // Form state for adding new consultant
  const [newConsultant, setNewConsultant] = useState({
    name: '',
    profession: keyword || 'יועץ',
    license_number: '',
    id_number: '',
    phone: '',
    email: '',
    company: '',
    specialty: '',
    notes: '',
  });

  // Filter consultants by search term
  const filteredConsultants = useMemo(() => {
    if (!searchTerm) return consultants;
    
    const term = searchTerm.toLowerCase();
    return consultants.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.profession.toLowerCase().includes(term) ||
      c.company?.toLowerCase().includes(term) ||
      c.specialty?.toLowerCase().includes(term)
    );
  }, [consultants, searchTerm]);

  // Group consultants by profession
  const groupedConsultants = useMemo(() => {
    const groups: Record<string, Consultant[]> = {
      'יועץ': [],
      'מהנדס': [],
      'אדריכל': [],
    };
    
    filteredConsultants.forEach(c => {
      if (groups[c.profession]) {
        groups[c.profession].push(c);
      }
    });
    
    return groups;
  }, [filteredConsultants]);

  const handleAddConsultant = async () => {
    if (!newConsultant.name.trim()) return;
    
    const result = await addConsultant({
      ...newConsultant,
      user_id: null, // Will be set by RLS or trigger
    });
    
    if (result) {
      onSelectConsultant(result);
      onOpenChange(false);
    }
  };

  const handleSelectConsultant = (consultant: Consultant) => {
    onSelectConsultant(consultant);
    onOpenChange(false);
  };

  const resetForm = () => {
    setNewConsultant({
      name: '',
      profession: keyword || 'יועץ',
      license_number: '',
      id_number: '',
      phone: '',
      email: '',
      company: '',
      specialty: '',
      notes: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-primary" />
            קישור {keyword} למשימה
            {keywordContext && (
              <Badge variant="outline" className="font-normal">
                {keywordContext}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'select' | 'add')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select">בחר מהרשימה</TabsTrigger>
            <TabsTrigger value="add" onClick={resetForm}>הוסף חדש</TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="mt-4">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חפש לפי שם, מקצוע, חברה..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  טוען...
                </div>
              ) : filteredConsultants.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                  <User className="h-8 w-8" />
                  <p>לא נמצאו יועצים</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('add')}
                  >
                    הוסף יועץ חדש
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {CONSULTANT_KEYWORDS.map(profession => {
                    const group = groupedConsultants[profession] || [];
                    if (group.length === 0) return null;
                    
                    return (
                      <div key={profession}>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <Badge variant="secondary">{profession}</Badge>
                          <span className="text-xs">({group.length})</span>
                        </h4>
                        <div className="grid gap-2">
                          {group.map(consultant => (
                            <Card
                              key={consultant.id}
                              className={cn(
                                "cursor-pointer hover:border-primary transition-colors",
                                "hover:shadow-sm"
                              )}
                              onClick={() => handleSelectConsultant(consultant)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium">{consultant.name}</div>
                                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                      {consultant.company && (
                                        <span className="flex items-center gap-1">
                                          <Building className="h-3 w-3" />
                                          {consultant.company}
                                        </span>
                                      )}
                                      {consultant.phone && (
                                        <span className="flex items-center gap-1">
                                          <Phone className="h-3 w-3" />
                                          {consultant.phone}
                                        </span>
                                      )}
                                      {consultant.license_number && (
                                        <span className="flex items-center gap-1">
                                          <Hash className="h-3 w-3" />
                                          {consultant.license_number}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectConsultant(consultant);
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4 ml-1" />
                                    בחר
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="add" className="mt-4">
            <ScrollArea className="h-[400px] pl-4">
              <div className="grid gap-4">
                {/* Name & Profession */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">שם *</Label>
                    <Input
                      id="name"
                      value={newConsultant.name}
                      onChange={(e) => setNewConsultant(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="שם היועץ"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profession">מקצוע *</Label>
                    <Select
                      value={newConsultant.profession}
                      onValueChange={(v) => setNewConsultant(prev => ({ ...prev, profession: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROFESSIONS.map(p => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* License & ID */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="license_number">מספר רישיון</Label>
                    <Input
                      id="license_number"
                      value={newConsultant.license_number}
                      onChange={(e) => setNewConsultant(prev => ({ ...prev, license_number: e.target.value }))}
                      placeholder="מספר רישיון"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id_number">מספר ת.ז</Label>
                    <Input
                      id="id_number"
                      value={newConsultant.id_number}
                      onChange={(e) => setNewConsultant(prev => ({ ...prev, id_number: e.target.value }))}
                      placeholder="מספר ת.ז"
                    />
                  </div>
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">טלפון</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={newConsultant.phone}
                      onChange={(e) => setNewConsultant(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="טלפון"
                      dir="ltr"
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">אימייל</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newConsultant.email}
                      onChange={(e) => setNewConsultant(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="אימייל"
                      dir="ltr"
                      className="text-right"
                    />
                  </div>
                </div>

                {/* Company & Specialty */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">חברה</Label>
                    <Input
                      id="company"
                      value={newConsultant.company}
                      onChange={(e) => setNewConsultant(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="שם החברה"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialty">התמחות</Label>
                    <Input
                      id="specialty"
                      value={newConsultant.specialty}
                      onChange={(e) => setNewConsultant(prev => ({ ...prev, specialty: e.target.value }))}
                      placeholder="תחום התמחות"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">הערות</Label>
                  <Input
                    id="notes"
                    value={newConsultant.notes}
                    onChange={(e) => setNewConsultant(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="הערות נוספות"
                  />
                </div>

                {/* Submit */}
                <Button
                  onClick={handleAddConsultant}
                  disabled={!newConsultant.name.trim()}
                  className="w-full"
                >
                  <UserPlus className="h-4 w-4 ml-2" />
                  הוסף וקשר למשימה
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default ConsultantDialog;
