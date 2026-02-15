// Consultant Dialog - Add or select a consultant for a task
import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  useConsultants,
  Consultant,
  CONSULTANT_KEYWORDS,
} from "@/hooks/useConsultants";
import { useClients } from "@/hooks/useClients";
import { cn } from "@/lib/utils";

interface ConsultantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyword: string;
  keywordContext: string;
  onSelectConsultant: (consultant: Consultant) => void;
}

const DEFAULT_PROFESSIONS = ["יועץ", "מהנדס", "אדריכל", "מודד", "יועץ ניקוז", "יועץ אקוסטיקה"];
const PROFESSIONS_KEY = "consultant-professions";

function loadProfessions(): { value: string; label: string }[] {
  try {
    const saved = localStorage.getItem(PROFESSIONS_KEY);
    if (saved) {
      const list: string[] = JSON.parse(saved);
      return list.map((v) => ({ value: v, label: v }));
    }
  } catch {}
  return DEFAULT_PROFESSIONS.map((v) => ({ value: v, label: v }));
}

function saveProfessions(profs: { value: string; label: string }[]) {
  localStorage.setItem(
    PROFESSIONS_KEY,
    JSON.stringify(profs.map((p) => p.value)),
  );
}

export function ConsultantDialog({
  open,
  onOpenChange,
  keyword,
  keywordContext,
  onSelectConsultant,
}: ConsultantDialogProps) {
  const { consultants, loading, addConsultant, updateConsultant, deleteConsultant } = useConsultants();
  const { clients: allClients } = useClients();
  const [searchTerm, setSearchTerm] = useState("");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<"select" | "add">("select");
  const [editingConsultant, setEditingConsultant] = useState<Consultant | null>(null);
  const [editForm, setEditForm] = useState<Partial<Consultant>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filter clients for autocomplete
  const filteredClients = useMemo(() => {
    if (!clientSearchTerm.trim()) return [];
    const term = clientSearchTerm.toLowerCase();
    return allClients.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.company?.toLowerCase().includes(term)
    ).slice(0, 8);
  }, [allClients, clientSearchTerm]);

  const handleSelectClient = (client: typeof allClients[0]) => {
    setNewConsultant(prev => ({
      ...prev,
      name: client.name || prev.name,
      phone: client.phone || prev.phone,
      email: client.email || prev.email,
      company: client.company || prev.company,
    }));
    setClientSearchTerm("");
    setShowClientDropdown(false);
  };
  const [professions, setProfessions] = useState(loadProfessions);
  const [addingProfession, setAddingProfession] = useState(false);
  const [newProfessionName, setNewProfessionName] = useState("");

  const handleAddProfession = () => {
    const name = newProfessionName.trim();
    if (!name || professions.some((p) => p.value === name)) return;
    const updated = [...professions, { value: name, label: name }];
    setProfessions(updated);
    saveProfessions(updated);
    setNewConsultant((prev) => ({ ...prev, profession: name }));
    setNewProfessionName("");
    setAddingProfession(false);
  };

  const handleRemoveProfession = (value: string) => {
    if (DEFAULT_PROFESSIONS.includes(value)) return;
    const updated = professions.filter((p) => p.value !== value);
    setProfessions(updated);
    saveProfessions(updated);
    if (newConsultant.profession === value) {
      setNewConsultant((prev) => ({
        ...prev,
        profession: updated[0]?.value || "יועץ",
      }));
    }
  };

  // Form state for adding new consultant
  const [newConsultant, setNewConsultant] = useState({
    name: "",
    profession: keyword || "יועץ",
    license_number: "",
    id_number: "",
    phone: "",
    email: "",
    company: "",
    specialty: "",
    notes: "",
  });

  // Filter consultants by search term
  const filteredConsultants = useMemo(() => {
    if (!searchTerm) return consultants;

    const term = searchTerm.toLowerCase();
    return consultants.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.profession.toLowerCase().includes(term) ||
        c.company?.toLowerCase().includes(term) ||
        c.specialty?.toLowerCase().includes(term),
    );
  }, [consultants, searchTerm]);

  // Group consultants by profession
  const groupedConsultants = useMemo(() => {
    const groups: Record<string, Consultant[]> = {};
    // Initialize groups from professions list
    professions.forEach((p) => {
      groups[p.value] = [];
    });

    filteredConsultants.forEach((c) => {
      if (!groups[c.profession]) {
        groups[c.profession] = [];
      }
      groups[c.profession].push(c);
    });

    return groups;
  }, [filteredConsultants, professions]);

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

  const handleStartEdit = (consultant: Consultant, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConsultant(consultant);
    setEditForm({
      name: consultant.name,
      profession: consultant.profession,
      license_number: consultant.license_number || "",
      id_number: consultant.id_number || "",
      phone: consultant.phone || "",
      email: consultant.email || "",
      company: consultant.company || "",
      specialty: consultant.specialty || "",
      notes: consultant.notes || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingConsultant || !editForm.name?.trim()) return;
    await updateConsultant(editingConsultant.id, editForm);
    setEditingConsultant(null);
    setEditForm({});
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    await deleteConsultant(deleteConfirm);
    setDeleteConfirm(null);
  };

  const resetForm = () => {
    setNewConsultant({
      name: "",
      profession: keyword || "יועץ",
      license_number: "",
      id_number: "",
      phone: "",
      email: "",
      company: "",
      specialty: "",
      notes: "",
    });
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[85vh] overflow-hidden"
        dir="rtl"
      >
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

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "select" | "add")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select">בחר מהרשימה</TabsTrigger>
            <TabsTrigger value="add" onClick={resetForm}>
              הוסף חדש
            </TabsTrigger>
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
                    onClick={() => setActiveTab("add")}
                  >
                    הוסף יועץ חדש
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {CONSULTANT_KEYWORDS.map((profession) => {
                    const group = groupedConsultants[profession] || [];
                    if (group.length === 0) return null;

                    return (
                      <div key={profession}>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <Badge variant="secondary">{profession}</Badge>
                          <span className="text-xs">({group.length})</span>
                        </h4>
                        <div className="grid gap-2">
                          {group.map((consultant) => (
                            <Card
                              key={consultant.id}
                              className={cn(
                                "cursor-pointer hover:border-primary transition-colors",
                                "hover:shadow-sm",
                              )}
                              onClick={() => handleSelectConsultant(consultant)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {consultant.name}
                                    </div>
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
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 hover:bg-blue-50"
                                      title="ערוך פרטים"
                                      onClick={(e) => handleStartEdit(consultant, e)}
                                    >
                                      <Pencil className="h-3.5 w-3.5 text-blue-600" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 hover:bg-red-50"
                                      title="מחק"
                                      onClick={(e) => handleDelete(consultant.id, e)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                    </Button>
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
                {/* Import from client */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    ייבא מלקוח קיים
                    <span className="text-xs text-muted-foreground">(אופציונלי)</span>
                  </Label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={clientSearchTerm}
                      onChange={(e) => {
                        setClientSearchTerm(e.target.value);
                        setShowClientDropdown(e.target.value.trim().length > 0);
                      }}
                      onFocus={() => clientSearchTerm.trim() && setShowClientDropdown(true)}
                      onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                      placeholder="חפש לקוח לפי שם, טלפון, אימייל..."
                      className="pr-10"
                    />
                    {showClientDropdown && filteredClients.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
                        {filteredClients.map(client => (
                          <button
                            key={client.id}
                            type="button"
                            className="w-full text-right px-3 py-2 hover:bg-accent transition-colors flex items-center justify-between gap-2 text-sm"
                            onMouseDown={(e) => { e.preventDefault(); handleSelectClient(client); }}
                          >
                            <div className="flex-1">
                              <div className="font-medium">{client.name}</div>
                              <div className="text-xs text-muted-foreground flex gap-2">
                                {client.phone && <span>{client.phone}</span>}
                                {client.company && <span>• {client.company}</span>}
                              </div>
                            </div>
                            <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-x-0 border-t border-dashed" />
                  <p className="text-center text-xs text-muted-foreground bg-background px-2 relative -top-2 w-fit mx-auto">או הזן ידנית</p>
                </div>

                {/* Name & Profession */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">שם *</Label>
                    <Input
                      id="name"
                      value={newConsultant.name}
                      onChange={(e) =>
                        setNewConsultant((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="שם היועץ"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profession">מקצוע *</Label>
                    <div className="flex gap-1">
                      <Select
                        value={newConsultant.profession}
                        onValueChange={(v) =>
                          setNewConsultant((prev) => ({
                            ...prev,
                            profession: v,
                          }))
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {professions.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              <span className="flex items-center justify-between w-full gap-2">
                                {p.label}
                                {!DEFAULT_PROFESSIONS.includes(p.value) && (
                                  <button
                                    className="h-4 w-4 text-destructive hover:text-red-700 inline-flex items-center justify-center"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleRemoveProfession(p.value);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-10 w-10 shrink-0"
                        onClick={() => setAddingProfession(true)}
                        title="הוסף מקצוע חדש"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {addingProfession && (
                      <div className="flex gap-1 mt-1">
                        <Input
                          value={newProfessionName}
                          onChange={(e) => setNewProfessionName(e.target.value)}
                          placeholder="שם המקצוע..."
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddProfession();
                            if (e.key === "Escape") {
                              setAddingProfession(false);
                              setNewProfessionName("");
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={handleAddProfession}
                          disabled={!newProfessionName.trim()}
                        >
                          הוסף
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setAddingProfession(false);
                            setNewProfessionName("");
                          }}
                        >
                          ביטול
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* License & ID */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="license_number">מספר רישיון</Label>
                    <Input
                      id="license_number"
                      value={newConsultant.license_number}
                      onChange={(e) =>
                        setNewConsultant((prev) => ({
                          ...prev,
                          license_number: e.target.value,
                        }))
                      }
                      placeholder="מספר רישיון"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id_number">מספר ת.ז</Label>
                    <Input
                      id="id_number"
                      value={newConsultant.id_number}
                      onChange={(e) =>
                        setNewConsultant((prev) => ({
                          ...prev,
                          id_number: e.target.value,
                        }))
                      }
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
                      onChange={(e) =>
                        setNewConsultant((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
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
                      onChange={(e) =>
                        setNewConsultant((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
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
                      onChange={(e) =>
                        setNewConsultant((prev) => ({
                          ...prev,
                          company: e.target.value,
                        }))
                      }
                      placeholder="שם החברה"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialty">התמחות</Label>
                    <Input
                      id="specialty"
                      value={newConsultant.specialty}
                      onChange={(e) =>
                        setNewConsultant((prev) => ({
                          ...prev,
                          specialty: e.target.value,
                        }))
                      }
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
                    onChange={(e) =>
                      setNewConsultant((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
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

    {/* Edit Dialog */}
    {editingConsultant && (
      <EditConsultantDialog
        consultant={editingConsultant}
        editForm={editForm}
        setEditForm={setEditForm}
        onSave={handleSaveEdit}
        onCancel={() => { setEditingConsultant(null); setEditForm({}); }}
        professions={professions}
      />
    )}

    {/* Delete Confirmation */}
    <DeleteConfirmDialog
      open={!!deleteConfirm}
      onConfirm={confirmDelete}
      onCancel={() => setDeleteConfirm(null)}
    />
  </>);
}

/* Edit Consultant Dialog */
function EditConsultantDialog({
  consultant,
  editForm,
  setEditForm,
  onSave,
  onCancel,
  professions,
}: {
  consultant: Consultant;
  editForm: Partial<Consultant>;
  setEditForm: (f: Partial<Consultant>) => void;
  onSave: () => void;
  onCancel: () => void;
  professions: { value: string; label: string }[];
}) {
  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-blue-600" />
            עריכת {consultant.profession} - {consultant.name}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="grid gap-4 p-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>שם *</Label>
                <Input
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="שם"
                />
              </div>
              <div className="space-y-2">
                <Label>מקצוע</Label>
                <Select
                  value={editForm.profession || ""}
                  onValueChange={(v) => setEditForm({ ...editForm, profession: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {professions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>מספר רישיון</Label>
                <Input
                  value={editForm.license_number || ""}
                  onChange={(e) => setEditForm({ ...editForm, license_number: e.target.value })}
                  placeholder="מספר רישיון"
                />
              </div>
              <div className="space-y-2">
                <Label>מספר ת.ז</Label>
                <Input
                  value={editForm.id_number || ""}
                  onChange={(e) => setEditForm({ ...editForm, id_number: e.target.value })}
                  placeholder="מספר ת.ז"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>טלפון</Label>
                <Input
                  value={editForm.phone || ""}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="טלפון"
                  dir="ltr"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label>אימייל</Label>
                <Input
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="אימייל"
                  dir="ltr"
                  className="text-right"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>חברה</Label>
                <Input
                  value={editForm.company || ""}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  placeholder="שם החברה"
                />
              </div>
              <div className="space-y-2">
                <Label>התמחות</Label>
                <Input
                  value={editForm.specialty || ""}
                  onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                  placeholder="תחום התמחות"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>הערות</Label>
              <Input
                value={editForm.notes || ""}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="הערות"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onCancel}>ביטול</Button>
              <Button onClick={onSave} disabled={!editForm.name?.trim()}>
                <Pencil className="h-4 w-4 ml-2" />
                שמור שינויים
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/* Delete Confirmation Dialog */
function DeleteConfirmDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            מחיקת בעל מקצוע
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground text-right">
          האם אתה בטוח שברצונך למחוק בעל מקצוע זה? פעולה זו אינה ניתנת לביטול.
        </p>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={onCancel}>ביטול</Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="h-4 w-4 ml-2" />
            מחק
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConsultantDialog;
