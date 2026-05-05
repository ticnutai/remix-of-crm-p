import React, { useState, useEffect, useMemo } from "react";
import { useSyncedSetting } from "@/hooks/useSyncedSetting";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Plus,
  Search,
  Building2,
  Layers,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Trash2,
  Pencil,
  Filter,
  MapPinned,
  Ruler,
  TreePine,
  Landmark,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Types
interface PlanningProject {
  id: string;
  project_name: string;
  project_number: string | null;
  client_id: string | null;
  client_name: string | null;
  address: string | null;
  city: string | null;
  block: string | null;
  parcel: string | null;
  plan_type: string | null;
  status: string;
  municipality: string | null;
  description: string | null;
  area_sqm: number | null;
  floors: number | null;
  units: number | null;
  submission_date: string | null;
  approval_date: string | null;
  gis_link: string | null;
  mavat_link: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const PLAN_TYPES = [
  "תב\"ע",
  "היתר בנייה",
  "תכנית מפורטת",
  "תכנית מתאר",
  "שינוי ייעוד",
  "תכנית נקודתית",
  "הקלה",
  "שימוש חורג",
  "תכנית איחוד וחלוקה",
  "אחר",
];

const STATUS_OPTIONS = [
  { value: "draft", label: "טיוטה", color: "bg-gray-500" },
  { value: "submitted", label: "הוגש", color: "bg-blue-500" },
  { value: "in_review", label: "בבדיקה", color: "bg-yellow-500" },
  { value: "approved", label: "אושר", color: "bg-green-500" },
  { value: "rejected", label: "נדחה", color: "bg-red-500" },
  { value: "appealed", label: "ערר", color: "bg-orange-500" },
  { value: "active", label: "פעיל", color: "bg-emerald-500" },
  { value: "completed", label: "הושלם", color: "bg-purple-500" },
];

const getStatusInfo = (status: string) => {
  return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
};

function PlanningGIS() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<PlanningProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useSyncedSetting<string>({ key: "planning-gis-status-filter", defaultValue: "all" });
  const [typeFilter, setTypeFilter] = useSyncedSetting<string>({ key: "planning-gis-type-filter", defaultValue: "all" });
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<PlanningProject | null>(null);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useSyncedSetting<string>({ key: "planning-gis-active-tab", defaultValue: "projects" });

  // Form state
  const [formData, setFormData] = useState({
    project_name: "",
    project_number: "",
    client_id: "",
    address: "",
    city: "",
    block: "",
    parcel: "",
    plan_type: "",
    status: "draft",
    municipality: "",
    description: "",
    area_sqm: "",
    floors: "",
    units: "",
    submission_date: "",
    approval_date: "",
    gis_link: "",
    mavat_link: "",
    notes: "",
  });

  // Load projects
  useEffect(() => {
    loadProjects();
    loadClients();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase.from("planning_projects" as any) as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        // Table might not exist yet - show empty state
        console.log("Planning projects table not ready:", error.message);
        setProjects([]);
      } else {
        setProjects(data || []);
      }
    } catch (err) {
      console.error("Error loading projects:", err);
      setProjects([]);
    }
    setLoading(false);
  };

  const loadClients = async () => {
    try {
      const { data } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      setClients(data || []);
    } catch {
      setClients([]);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        !searchQuery ||
        p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.project_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.block?.includes(searchQuery) ||
        p.parcel?.includes(searchQuery) ||
        p.client_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === "all" || p.status === statusFilter;
      const matchType =
        typeFilter === "all" || p.plan_type === typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [projects, searchQuery, statusFilter, typeFilter]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: projects.length,
      active: projects.filter(
        (p) => !["completed", "rejected"].includes(p.status)
      ).length,
      approved: projects.filter((p) => p.status === "approved").length,
      submitted: projects.filter((p) => p.status === "submitted").length,
    };
  }, [projects]);

  const resetForm = () => {
    setFormData({
      project_name: "",
      project_number: "",
      client_id: "",
      address: "",
      city: "",
      block: "",
      parcel: "",
      plan_type: "",
      status: "draft",
      municipality: "",
      description: "",
      area_sqm: "",
      floors: "",
      units: "",
      submission_date: "",
      approval_date: "",
      gis_link: "",
      mavat_link: "",
      notes: "",
    });
  };

  const handleAdd = () => {
    resetForm();
    setAddDialog(true);
  };

  const handleEdit = (project: PlanningProject) => {
    setFormData({
      project_name: project.project_name,
      project_number: project.project_number || "",
      client_id: project.client_id || "",
      address: project.address || "",
      city: project.city || "",
      block: project.block || "",
      parcel: project.parcel || "",
      plan_type: project.plan_type || "",
      status: project.status,
      municipality: project.municipality || "",
      description: project.description || "",
      area_sqm: project.area_sqm?.toString() || "",
      floors: project.floors?.toString() || "",
      units: project.units?.toString() || "",
      submission_date: project.submission_date || "",
      approval_date: project.approval_date || "",
      gis_link: project.gis_link || "",
      mavat_link: project.mavat_link || "",
      notes: project.notes || "",
    });
    setEditDialog(project);
  };

  const handleSave = async () => {
    if (!formData.project_name.trim()) {
      toast({ title: "יש להזין שם פרויקט", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const clientName = clients.find(
        (c) => c.id === formData.client_id
      )?.name;

      const record = {
        project_name: formData.project_name.trim(),
        project_number: formData.project_number || null,
        client_id: formData.client_id || null,
        client_name: clientName || null,
        address: formData.address || null,
        city: formData.city || null,
        block: formData.block || null,
        parcel: formData.parcel || null,
        plan_type: formData.plan_type || null,
        status: formData.status,
        municipality: formData.municipality || null,
        description: formData.description || null,
        area_sqm: formData.area_sqm ? parseFloat(formData.area_sqm) : null,
        floors: formData.floors ? parseInt(formData.floors) : null,
        units: formData.units ? parseInt(formData.units) : null,
        submission_date: formData.submission_date || null,
        approval_date: formData.approval_date || null,
        gis_link: formData.gis_link || null,
        mavat_link: formData.mavat_link || null,
        notes: formData.notes || null,
      };

      if (editDialog) {
        const { error } = await (supabase.from("planning_projects" as any) as any)
          .update(record)
          .eq("id", editDialog.id);
        if (error) throw error;
        toast({ title: "הפרויקט עודכן בהצלחה" });
      } else {
        const { error } = await (supabase.from("planning_projects" as any) as any)
          .insert(record);
        if (error) throw error;
        toast({ title: "פרויקט חדש נוסף בהצלחה" });
      }

      setAddDialog(false);
      setEditDialog(null);
      loadProjects();
    } catch (error: any) {
      console.error("Error saving project:", error);
      toast({
        title: "שגיאה בשמירה",
        description: error.message,
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("האם למחוק את הפרויקט?")) return;

    try {
      const { error } = await (supabase.from("planning_projects" as any) as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({ title: "הפרויקט נמחק" });
      loadProjects();
    } catch (error: any) {
      toast({
        title: "שגיאה במחיקה",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const ProjectDialog = ({ isEdit }: { isEdit: boolean }) => (
    <Dialog
      open={isEdit ? !!editDialog : addDialog}
      onOpenChange={(open) => {
        if (!open) {
          if (isEdit) setEditDialog(null);
          else setAddDialog(false);
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {isEdit ? "עריכת פרויקט" : "פרויקט תכנון חדש"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Row 1 */}
          <div className="space-y-1">
            <Label>שם פרויקט *</Label>
            <Input
              value={formData.project_name}
              onChange={(e) =>
                setFormData({ ...formData, project_name: e.target.value })
              }
              placeholder="שם הפרויקט"
            />
          </div>
          <div className="space-y-1">
            <Label>מספר פרויקט</Label>
            <Input
              value={formData.project_number}
              onChange={(e) =>
                setFormData({ ...formData, project_number: e.target.value })
              }
              placeholder="מספר/קוד"
            />
          </div>

          {/* Row 2 */}
          <div className="space-y-1">
            <Label>לקוח</Label>
            <Select
              value={formData.client_id}
              onValueChange={(val) =>
                setFormData({ ...formData, client_id: val })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר לקוח" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>סוג תכנית</Label>
            <Select
              value={formData.plan_type}
              onValueChange={(val) =>
                setFormData({ ...formData, plan_type: val })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר סוג" />
              </SelectTrigger>
              <SelectContent>
                {PLAN_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row 3 - Address */}
          <div className="space-y-1">
            <Label>כתובת</Label>
            <Input
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="כתובת"
            />
          </div>
          <div className="space-y-1">
            <Label>עיר / יישוב</Label>
            <Input
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              placeholder="עיר"
            />
          </div>

          {/* Row 4 - Block & Parcel */}
          <div className="space-y-1">
            <Label>גוש</Label>
            <Input
              value={formData.block}
              onChange={(e) =>
                setFormData({ ...formData, block: e.target.value })
              }
              placeholder="מספר גוש"
            />
          </div>
          <div className="space-y-1">
            <Label>חלקה</Label>
            <Input
              value={formData.parcel}
              onChange={(e) =>
                setFormData({ ...formData, parcel: e.target.value })
              }
              placeholder="מספר חלקה"
            />
          </div>

          {/* Row 5 - Status & Municipality */}
          <div className="space-y-1">
            <Label>סטטוס</Label>
            <Select
              value={formData.status}
              onValueChange={(val) =>
                setFormData({ ...formData, status: val })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn("h-2 w-2 rounded-full", s.color)}
                      />
                      {s.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>רשות מקומית / ועדה</Label>
            <Input
              value={formData.municipality}
              onChange={(e) =>
                setFormData({ ...formData, municipality: e.target.value })
              }
              placeholder="שם הרשות"
            />
          </div>

          {/* Row 6 - Measurements */}
          <div className="space-y-1">
            <Label>שטח (מ"ר)</Label>
            <Input
              type="number"
              value={formData.area_sqm}
              onChange={(e) =>
                setFormData({ ...formData, area_sqm: e.target.value })
              }
              placeholder="שטח"
            />
          </div>
          <div className="space-y-1">
            <Label>קומות</Label>
            <Input
              type="number"
              value={formData.floors}
              onChange={(e) =>
                setFormData({ ...formData, floors: e.target.value })
              }
              placeholder="מספר קומות"
            />
          </div>

          {/* Row 7 */}
          <div className="space-y-1">
            <Label>יחידות דיור</Label>
            <Input
              type="number"
              value={formData.units}
              onChange={(e) =>
                setFormData({ ...formData, units: e.target.value })
              }
              placeholder="יחד"
            />
          </div>
          <div className="space-y-1">
            <Label>תאריך הגשה</Label>
            <Input
              type="date"
              value={formData.submission_date}
              onChange={(e) =>
                setFormData({ ...formData, submission_date: e.target.value })
              }
            />
          </div>

          {/* Row 8 */}
          <div className="col-span-2 space-y-1">
            <Label>תאריך אישור</Label>
            <Input
              type="date"
              value={formData.approval_date}
              onChange={(e) =>
                setFormData({ ...formData, approval_date: e.target.value })
              }
            />
          </div>

          {/* Links */}
          <div className="space-y-1">
            <Label>קישור GIS</Label>
            <Input
              value={formData.gis_link}
              onChange={(e) =>
                setFormData({ ...formData, gis_link: e.target.value })
              }
              placeholder="https://..."
              dir="ltr"
            />
          </div>
          <div className="space-y-1">
            <Label>קישור מבא"ת</Label>
            <Input
              value={formData.mavat_link}
              onChange={(e) =>
                setFormData({ ...formData, mavat_link: e.target.value })
              }
              placeholder="https://..."
              dir="ltr"
            />
          </div>

          {/* Description & Notes */}
          <div className="col-span-2 space-y-1">
            <Label>תיאור</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="תיאור הפרויקט..."
              rows={2}
            />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>הערות</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="הערות נוספות..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (isEdit) setEditDialog(null);
              else setAddDialog(false);
            }}
          >
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? "עדכן" : "הוסף"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <AppLayout title="תכנון & GIS">
      <div className="w-full max-w-[1400px] mx-auto p-4 space-y-4" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MapPinned className="h-7 w-7 text-primary" />
              תכנון & GIS
            </h1>
            <p className="text-muted-foreground text-sm">
              ניהול פרויקטי תכנון, תב"עות והיתרים
            </p>
          </div>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            פרויקט חדש
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Layers className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">סה"כ פרויקטים</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Clock className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.active}</div>
                <div className="text-xs text-muted-foreground">פעילים</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.approved}</div>
                <div className="text-xs text-muted-foreground">אושרו</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <FileText className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.submitted}</div>
                <div className="text-xs text-muted-foreground">הוגשו</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="projects" className="gap-2">
              <Layers className="h-4 w-4" />
              פרויקטים
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-2">
              <MapPin className="h-4 w-4" />
              מפה
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חפש פרויקט, כתובת, גוש, חלקה..."
                  className="pr-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <span className="flex items-center gap-2">
                        <span
                          className={cn("h-2 w-2 rounded-full", s.color)}
                        />
                        {s.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="סוג תכנית" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסוגים</SelectItem>
                  {PLAN_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Projects List */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <Card>
                <CardContent className="text-center py-16">
                  <MapPinned className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {projects.length === 0
                      ? "אין פרויקטי תכנון עדיין"
                      : "לא נמצאו תוצאות"}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {projects.length === 0
                      ? "הוסף פרויקט תכנון ראשון כדי להתחיל"
                      : "נסה לשנות את הפילטרים"}
                  </p>
                  {projects.length === 0 && (
                    <Button onClick={handleAdd} variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      הוסף פרויקט ראשון
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {filteredProjects.map((project) => {
                  const statusInfo = getStatusInfo(project.status);
                  return (
                    <Card
                      key={project.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleEdit(project)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">
                                {project.project_name}
                              </h3>
                              <Badge
                                className={cn(
                                  "text-white text-xs",
                                  statusInfo.color
                                )}
                              >
                                {statusInfo.label}
                              </Badge>
                              {project.plan_type && (
                                <Badge variant="outline" className="text-xs">
                                  {project.plan_type}
                                </Badge>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                              {project.project_number && (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3.5 w-3.5" />
                                  {project.project_number}
                                </span>
                              )}
                              {project.client_name && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3.5 w-3.5" />
                                  {project.client_name}
                                </span>
                              )}
                              {(project.address || project.city) && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {[project.address, project.city]
                                    .filter(Boolean)
                                    .join(", ")}
                                </span>
                              )}
                              {(project.block || project.parcel) && (
                                <span className="flex items-center gap-1">
                                  <Landmark className="h-3.5 w-3.5" />
                                  גוש {project.block} חלקה {project.parcel}
                                </span>
                              )}
                              {project.area_sqm && (
                                <span className="flex items-center gap-1">
                                  <Ruler className="h-3.5 w-3.5" />
                                  {project.area_sqm.toLocaleString()} מ"ר
                                </span>
                              )}
                              {project.municipality && (
                                <span className="flex items-center gap-1">
                                  <TreePine className="h-3.5 w-3.5" />
                                  {project.municipality}
                                </span>
                              )}
                            </div>

                            {project.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {project.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {project.gis_link && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(project.gis_link!, "_blank");
                                }}
                                title="פתח GIS"
                              >
                                <MapPinned className="h-4 w-4 text-blue-500" />
                              </Button>
                            )}
                            {project.mavat_link && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(project.mavat_link!, "_blank");
                                }}
                                title="פתח מבא״ת"
                              >
                                <ExternalLink className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(project.id);
                              }}
                              title="מחק"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="map">
            <Card>
              <CardContent className="text-center py-16">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">תצוגת מפה</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  ניתן לפתוח קישורי GIS ומבא"ת ישירות מכרטיס הפרויקט
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() =>
                      window.open(
                        "https://gis.gov.il",
                        "_blank"
                      )
                    }
                  >
                    <MapPinned className="h-4 w-4" />
                    GIS ממשלתי
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() =>
                      window.open(
                        "https://mavat.iplan.gov.il",
                        "_blank"
                      )
                    }
                  >
                    <ExternalLink className="h-4 w-4" />
                    מבא"ת
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <ProjectDialog isEdit={false} />
      {editDialog && <ProjectDialog isEdit />}
    </AppLayout>
  );
}

export default PlanningGIS;
