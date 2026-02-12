// מנהל תבניות הצעות מחיר מתקדם - עם תיקיות
import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  FileText,
  Eye,
  Search,
  Layers,
  Upload,
  FileCode,
  ExternalLink,
  FolderPlus,
  FolderOpen,
  Folder,
  ChevronDown,
  ChevronLeft,
  MoreVertical,
  ArrowRight,
  Palette,
  GripVertical,
  FolderInput,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  QuoteTemplate,
  QuoteTemplateFolder,
  CATEGORIES,
  FOLDER_COLORS,
  createEmptyTemplate,
  DEFAULT_DESIGN_SETTINGS,
} from "./types";
import { AdvancedTemplateDialog } from "./AdvancedTemplateDialog";
import { TemplatePreviewDialog } from "./TemplatePreviewDialog";
import { HtmlTemplateEditor } from "./HtmlTemplateEditor";
import { importHtmlFile } from "./htmlTemplateParser";
import {
  importDocumentToTemplate,
  convertWordToHtml,
  getSupportedDocumentTypes,
} from "./documentImporter";

export function QuoteTemplatesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wordToHtmlInputRef = useRef<HTMLInputElement>(null);

  const [editingTemplate, setEditingTemplate] =
    useState<Partial<QuoteTemplate> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<QuoteTemplate | null>(
    null,
  );
  const [isImporting, setIsImporting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [htmlEditorTemplate, setHtmlEditorTemplate] =
    useState<QuoteTemplate | null>(null);

  // Folder state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] =
    useState<Partial<QuoteTemplateFolder> | null>(null);
  const [renamingTemplateId, setRenamingTemplateId] = useState<string | null>(
    null,
  );
  const [renamingTemplateName, setRenamingTemplateName] = useState("");
  const [moveToFolderTemplateId, setMoveToFolderTemplateId] = useState<
    string | null
  >(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(
    new Set(),
  );

  // שליפת תיקיות
  const { data: folders = [] } = useQuery({
    queryKey: ["quote-template-folders"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("quote_template_folders")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as QuoteTemplateFolder[];
    },
  });

  // שליפת תבניות
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["quote-templates-advanced"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("quote_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((t: any) => ({
        ...t,
        items: t.items || [],
        stages: t.stages || [],
        payment_schedule: t.payment_schedule || [],
        timeline: t.timeline || [],
        important_notes: t.important_notes || [],
        design_settings: t.design_settings || DEFAULT_DESIGN_SETTINGS,
        validity_days: t.validity_days || 30,
        show_vat: t.show_vat ?? true,
        vat_rate: t.vat_rate || 17,
        html_content: t.html_content || null,
        text_boxes: t.text_boxes || [],
        upgrades: t.upgrades || [],
        project_details: t.project_details || {},
        pricing_tiers: t.pricing_tiers || [],
        base_price: t.base_price || 0,
        folder_id: t.folder_id || null,
      })) as QuoteTemplate[];
    },
  });

  // === Folder mutations ===

  const saveFolderMutation = useMutation({
    mutationFn: async (folder: Partial<QuoteTemplateFolder>) => {
      if (folder.id) {
        const { error } = await (supabase as any)
          .from("quote_template_folders")
          .update({ name: folder.name, color: folder.color, icon: folder.icon })
          .eq("id", folder.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("quote_template_folders")
          .insert([
            {
              name: folder.name,
              color: folder.color || "#d8ac27",
              sort_order: folders.length,
            },
          ]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-template-folders"] });
      setFolderDialogOpen(false);
      setEditingFolder(null);
      toast({ title: "התיקייה נשמרה בהצלחה" });
    },
    onError: (err: any) => {
      toast({
        title: "שגיאה",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      // Move templates out of folder first
      await (supabase as any)
        .from("quote_templates")
        .update({ folder_id: null })
        .eq("folder_id", folderId);
      const { error } = await (supabase as any)
        .from("quote_template_folders")
        .delete()
        .eq("id", folderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-template-folders"] });
      queryClient.invalidateQueries({ queryKey: ["quote-templates-advanced"] });
      if (selectedFolderId) setSelectedFolderId(null);
      toast({ title: "התיקייה נמחקה" });
    },
  });

  // Move template to folder
  const moveToFolderMutation = useMutation({
    mutationFn: async ({
      templateId,
      folderId,
    }: {
      templateId: string;
      folderId: string | null;
    }) => {
      const { error } = await (supabase as any)
        .from("quote_templates")
        .update({ folder_id: folderId })
        .eq("id", templateId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-templates-advanced"] });
      setMoveToFolderTemplateId(null);
      toast({ title: "ההצעה הועברה" });
    },
  });

  // Rename template
  const renameTemplateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await (supabase as any)
        .from("quote_templates")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-templates-advanced"] });
      setRenamingTemplateId(null);
      toast({ title: "השם עודכן" });
    },
  });

  // שמירת תבנית
  const saveMutation = useMutation({
    mutationFn: async (template: Partial<QuoteTemplate>) => {
      const payload = {
        name: template.name,
        description: template.description,
        category: template.category,
        items: template.items || [],
        stages: template.stages || [],
        payment_schedule: template.payment_schedule || [],
        timeline: template.timeline || [],
        terms: template.terms,
        notes: template.notes,
        important_notes: template.important_notes || [],
        validity_days: template.validity_days || 30,
        design_settings: template.design_settings || DEFAULT_DESIGN_SETTINGS,
        show_vat: template.show_vat ?? true,
        vat_rate: template.vat_rate || 17,
        is_active: template.is_active ?? true,
        html_content: template.html_content || null,
        text_boxes: template.text_boxes || [],
        upgrades: template.upgrades || [],
        project_details: template.project_details || {},
        base_price: template.base_price || 0,
        pricing_tiers: template.pricing_tiers || [],
        folder_id: template.folder_id || null,
        updated_at: new Date().toISOString(),
      };

      if (template.id) {
        const { error } = await (supabase as any)
          .from("quote_templates")
          .update(payload)
          .eq("id", template.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("quote_templates")
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-templates-advanced"] });
      setIsDialogOpen(false);
      setEditingTemplate(null);
      toast({
        title: "נשמר בהצלחה",
        description: "התבנית נשמרה",
      });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // מחיקת תבנית
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("quote_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-templates-advanced"] });
      toast({
        title: "נמחק",
        description: "התבנית נמחקה",
      });
    },
  });

  // ייבוא קובץ HTML, Word או PDF
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const file of Array.from(files)) {
      const fileName = file.name.toLowerCase();

      try {
        let template: Partial<QuoteTemplate> | null = null;

        if (fileName.endsWith(".html") || fileName.endsWith(".htm")) {
          template = await importHtmlFile(file);
        } else if (
          fileName.endsWith(".docx") ||
          fileName.endsWith(".doc") ||
          fileName.endsWith(".pdf")
        ) {
          template = await importDocumentToTemplate(file);
        } else {
          failCount++;
          continue;
        }

        if (template) {
          // If currently in a folder, assign to it
          if (selectedFolderId) {
            template.folder_id = selectedFolderId;
          }
          await saveMutation.mutateAsync(template);
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error("Error importing file:", file.name, err);
        failCount++;
      }
    }

    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (successCount > 0) {
      toast({
        title: "יובאו בהצלחה",
        description: `${successCount} תבניות יובאו${failCount > 0 ? `, ${failCount} נכשלו` : ""}`,
      });
    } else if (failCount > 0) {
      toast({
        title: "שגיאה בייבוא",
        description: "לא ניתן היה לייבא את הקבצים.",
        variant: "destructive",
      });
    }
  };

  const handleWordToHtml = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsConverting(true);
    try {
      const html = await convertWordToHtml(file);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.(docx?|doc)$/i, "") + ".html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "הומר בהצלחה", description: "הקובץ הומר ל-HTML והורד" });
    } catch (err) {
      toast({ title: "שגיאה בהמרה", variant: "destructive" });
    } finally {
      setIsConverting(false);
      if (wordToHtmlInputRef.current) wordToHtmlInputRef.current.value = "";
    }
  };

  // פעולות
  const handleNew = () => {
    const newTemplate = createEmptyTemplate();
    if (selectedFolderId) newTemplate.folder_id = selectedFolderId;
    setEditingTemplate(newTemplate);
    setIsDialogOpen(true);
  };

  const handleEdit = (template: QuoteTemplate) => {
    setEditingTemplate(template);
    setIsDialogOpen(true);
  };

  const handleDuplicate = (template: QuoteTemplate) => {
    setEditingTemplate({
      ...template,
      id: undefined,
      name: `${template.name} (העתק)`,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("למחוק את התבנית?")) {
      deleteMutation.mutate(id);
    }
  };

  const toggleFolderCollapse = (folderId: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  // סינון
  const filteredTemplates = templates.filter((t) => {
    const matchCategory =
      selectedCategory === "all" || t.category === selectedCategory;
    const matchSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Group templates by folder
  const unfolderedTemplates = filteredTemplates.filter((t) => !t.folder_id);
  const templatesByFolder = folders.reduce<Record<string, QuoteTemplate[]>>(
    (acc, f) => {
      acc[f.id] = filteredTemplates.filter((t) => t.folder_id === f.id);
      return acc;
    },
    {},
  );

  const calculateTotal = (template: QuoteTemplate) => {
    return (template.items || []).reduce(
      (sum, item) => sum + (item.total || 0),
      0,
    );
  };

  // --- Render template card ---
  const renderTemplateCard = (template: QuoteTemplate) => {
    const primaryColor = template.design_settings?.primary_color || "#d8ac27";
    const stagesCount = (template.stages || []).length;
    const itemsCount =
      (template.stages || []).reduce(
        (sum, stage) => sum + (stage.items || []).length,
        0,
      ) + (template.items || []).length;

    const isRenaming = renamingTemplateId === template.id;

    return (
      <Card
        key={template.id}
        className="overflow-hidden hover:shadow-lg transition-shadow group"
      >
        <div className="h-2" style={{ backgroundColor: primaryColor }} />

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isRenaming ? (
                <div className="flex gap-2 items-center">
                  <Input
                    value={renamingTemplateName}
                    onChange={(e) => setRenamingTemplateName(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        renameTemplateMutation.mutate({
                          id: template.id,
                          name: renamingTemplateName,
                        });
                      }
                      if (e.key === "Escape") setRenamingTemplateId(null);
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      renameTemplateMutation.mutate({
                        id: template.id,
                        name: renamingTemplateName,
                      })
                    }
                  >
                    ✓
                  </Button>
                </div>
              ) : (
                <CardTitle className="text-lg line-clamp-1">
                  {template.name}
                </CardTitle>
              )}
              <CardDescription className="mt-1 line-clamp-2">
                {template.description || "ללא תיאור"}
              </CardDescription>
            </div>

            {/* Template actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" dir="rtl">
                <DropdownMenuItem
                  onClick={() => {
                    setRenamingTemplateId(template.id);
                    setRenamingTemplateName(template.name);
                  }}
                >
                  <Pencil className="h-4 w-4 ml-2" />
                  שנה שם
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setMoveToFolderTemplateId(template.id)}
                >
                  <FolderInput className="h-4 w-4 ml-2" />
                  העבר לתיקייה
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                  <Copy className="h-4 w-4 ml-2" />
                  שכפל
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(template.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  מחק
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Badge
            variant="outline"
            className="w-fit"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            {CATEGORIES.find((c) => c.value === template.category)?.label ||
              template.category}
          </Badge>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{stagesCount} שלבים</span>
              <span>•</span>
              <span>{itemsCount} פריטים</span>
              <span>•</span>
              <span>{template.validity_days} יום</span>
            </div>

            <div className="flex items-center justify-between py-2 border-t">
              <span className="font-medium">סה״כ:</span>
              <span
                className="font-bold text-lg"
                style={{ color: primaryColor }}
              >
                ₪{calculateTotal(template).toLocaleString()}
              </span>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                className="flex-1 bg-[#d8ac27] hover:bg-[#c49b22] text-white"
                onClick={() => setHtmlEditorTemplate(template)}
              >
                <ExternalLink className="h-4 w-4 ml-1" />
                פתח בעורך
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(template)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewTemplate(template)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.htm,.docx,.doc,.pdf"
        multiple
        onChange={handleFileImport}
        className="hidden"
      />
      <input
        ref={wordToHtmlInputRef}
        type="file"
        accept=".docx,.doc"
        onChange={handleWordToHtml}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-[#d8ac27]" />
            תבניות הצעות מחיר
          </h2>
          <p className="text-muted-foreground">
            נהל תבניות מוכנות עם תיקיות, שלבים, לוח תשלומים ועיצוב מותאם
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => {
              setEditingFolder({ name: "", color: "#d8ac27" });
              setFolderDialogOpen(true);
            }}
            variant="outline"
            className="border-primary/50 text-primary hover:bg-primary/10"
          >
            <FolderPlus className="h-4 w-4 ml-2" />
            תיקייה חדשה
          </Button>
          <Button
            onClick={() => wordToHtmlInputRef.current?.click()}
            variant="outline"
            disabled={isConverting}
            className="border-primary text-primary hover:bg-primary/10"
          >
            {isConverting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent ml-2" />
            ) : (
              <FileCode className="h-4 w-4 ml-2" />
            )}
            Word → HTML
          </Button>
          <Button
            onClick={handleImportClick}
            variant="outline"
            disabled={isImporting}
            className="border-[#d8ac27] text-[#d8ac27] hover:bg-[#d8ac27]/10"
          >
            {isImporting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#d8ac27] border-t-transparent ml-2" />
            ) : (
              <Upload className="h-4 w-4 ml-2" />
            )}
            יבוא קובץ
          </Button>
          <Button
            onClick={handleNew}
            className="bg-[#d8ac27] hover:bg-[#c49b22] text-white"
          >
            <Plus className="h-4 w-4 ml-2" />
            תבנית חדשה
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש תבניות..."
            className="pr-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="כל הקטגוריות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הקטגוריות</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#d8ac27] mx-auto" />
        </div>
      ) : filteredTemplates.length === 0 && folders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">אין תבניות עדיין</h3>
            <p className="text-muted-foreground mb-6">
              צור תיקייה ותבנית ראשונה
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => {
                  setEditingFolder({ name: "", color: "#d8ac27" });
                  setFolderDialogOpen(true);
                }}
                variant="outline"
              >
                <FolderPlus className="h-4 w-4 ml-2" />
                תיקייה חדשה
              </Button>
              <Button
                onClick={handleNew}
                variant="outline"
                className="border-[#d8ac27] text-[#d8ac27]"
              >
                <Plus className="h-4 w-4 ml-2" />
                צור תבנית ראשונה
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Folders */}
          {folders.map((folder) => {
            const folderTemplates = templatesByFolder[folder.id] || [];
            const isCollapsed = collapsedFolders.has(folder.id);

            return (
              <div
                key={folder.id}
                className="border rounded-lg overflow-hidden bg-card"
              >
                {/* Folder header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  style={{ borderRight: `4px solid ${folder.color}` }}
                  onClick={() => toggleFolderCollapse(folder.id)}
                >
                  {isCollapsed ? (
                    <ChevronLeft className="h-5 w-5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}

                  {isCollapsed ? (
                    <Folder
                      className="h-5 w-5 shrink-0"
                      style={{ color: folder.color }}
                    />
                  ) : (
                    <FolderOpen
                      className="h-5 w-5 shrink-0"
                      style={{ color: folder.color }}
                    />
                  )}

                  <span className="font-semibold flex-1">{folder.name}</span>

                  <Badge variant="secondary" className="text-xs">
                    {folderTemplates.length} תבניות
                  </Badge>

                  {/* Folder actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFolder(folder);
                          setFolderDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 ml-2" />
                        ערוך תיקייה
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          const newTemplate = createEmptyTemplate();
                          newTemplate.folder_id = folder.id;
                          setEditingTemplate(newTemplate);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 ml-2" />
                        תבנית חדשה בתיקייה
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              `למחוק את התיקייה "${folder.name}"? התבניות בתוכה יעברו לרשימה הראשית.`,
                            )
                          ) {
                            deleteFolderMutation.mutate(folder.id);
                          }
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 ml-2" />
                        מחק תיקייה
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Folder templates */}
                {!isCollapsed && (
                  <div className="p-4 pt-2 bg-muted/10">
                    {folderTemplates.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        <Folder className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p>אין תבניות בתיקייה זו</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            const newTemplate = createEmptyTemplate();
                            newTemplate.folder_id = folder.id;
                            setEditingTemplate(newTemplate);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 ml-1" />
                          הוסף תבנית
                        </Button>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {folderTemplates.map(renderTemplateCard)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Unfoldered templates */}
          {unfolderedTemplates.length > 0 && (
            <div>
              {folders.length > 0 && (
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    תבניות ללא תיקייה ({unfolderedTemplates.length})
                  </span>
                </div>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unfolderedTemplates.map(renderTemplateCard)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Dialogs ===== */}

      {/* Folder Create/Edit Dialog */}
      <Dialog
        open={folderDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFolderDialogOpen(false);
            setEditingFolder(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingFolder?.id ? "עריכת תיקייה" : "תיקייה חדשה"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                שם התיקייה
              </label>
              <Input
                value={editingFolder?.name || ""}
                onChange={(e) =>
                  setEditingFolder((prev) =>
                    prev ? { ...prev, name: e.target.value } : prev,
                  )
                }
                placeholder="לדוגמה: שיפוצים, היתרי בנייה..."
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">צבע</label>
              <div className="flex gap-2 flex-wrap">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      editingFolder?.color === color
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      setEditingFolder((prev) =>
                        prev ? { ...prev, color } : prev,
                      )
                    }
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFolderDialogOpen(false);
                setEditingFolder(null);
              }}
            >
              ביטול
            </Button>
            <Button
              onClick={() =>
                editingFolder && saveFolderMutation.mutate(editingFolder)
              }
              disabled={
                !editingFolder?.name?.trim() || saveFolderMutation.isPending
              }
              className="bg-[#d8ac27] hover:bg-[#c49b22] text-white"
            >
              {saveFolderMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent ml-2" />
              ) : null}
              {editingFolder?.id ? "עדכן" : "צור תיקייה"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move to Folder Dialog */}
      <Dialog
        open={!!moveToFolderTemplateId}
        onOpenChange={(open) => {
          if (!open) setMoveToFolderTemplateId(null);
        }}
      >
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>העבר לתיקייה</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {/* No folder option */}
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-right"
              onClick={() =>
                moveToFolderTemplateId &&
                moveToFolderMutation.mutate({
                  templateId: moveToFolderTemplateId,
                  folderId: null,
                })
              }
            >
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span>ללא תיקייה</span>
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-right"
                onClick={() =>
                  moveToFolderTemplateId &&
                  moveToFolderMutation.mutate({
                    templateId: moveToFolderTemplateId,
                    folderId: folder.id,
                  })
                }
              >
                <Folder className="h-5 w-5" style={{ color: folder.color }} />
                <span>{folder.name}</span>
                <Badge variant="secondary" className="text-xs mr-auto">
                  {(templatesByFolder[folder.id] || []).length}
                </Badge>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Dialogs */}
      <AdvancedTemplateDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSave={(t) => saveMutation.mutateAsync(t)}
        isSaving={saveMutation.isPending}
      />

      {previewTemplate && (
        <TemplatePreviewDialog
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {htmlEditorTemplate && (
        <HtmlTemplateEditor
          open={!!htmlEditorTemplate}
          onClose={() => setHtmlEditorTemplate(null)}
          template={htmlEditorTemplate}
          onSave={async (t) => {
            await saveMutation.mutateAsync(t);
            setHtmlEditorTemplate(null);
          }}
        />
      )}
    </div>
  );
}

export default QuoteTemplatesManager;
