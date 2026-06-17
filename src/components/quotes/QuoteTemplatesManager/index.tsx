// מנהל תבניות הצעות מחיר מתקדם - עם תיקיות
import React, { useEffect, useRef, useState } from "react";
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
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  List,
  LayoutGrid,
  Maximize2,
  Minimize2,
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
  Rows3,
  Square,
  Table2,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  isTableAvailable,
  markTableUnavailable,
} from "@/lib/supabaseTableCheck";
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

type FolderLayoutMode = "grid" | "dense" | "list" | "expanded" | "table";
type TemplateLayoutMode = "regular" | "compact" | "expanded" | "quick";

const FOLDER_LAYOUT_STORAGE_KEY = "quote-templates-folder-layout";
const UNGROUPED_LAYOUT_STORAGE_KEY = "quote-templates-ungrouped-layout";
const FOLDER_CARD_STYLE_STORAGE_KEY = "quote-templates-folder-card-style";
const UNGROUPED_CARD_STYLE_STORAGE_KEY = "quote-templates-ungrouped-card-style";

const FOLDER_LAYOUT_OPTIONS: Array<{
  value: FolderLayoutMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: "list",
    label: "רשימה",
    description: "תיקייה אחת בשורה (ברירת מחדל)",
    icon: List,
  },
  {
    value: "grid",
    label: "גריד",
    description: "2-3 תיקיות בשורה",
    icon: LayoutGrid,
  },
  {
    value: "dense",
    label: "גריד צפוף",
    description: "3-4 תיקיות בשורה",
    icon: GripVertical,
  },
  {
    value: "expanded",
    label: "מורחב",
    description: "תיקייה אחת עם יותר מקום",
    icon: Rows3,
  },
  {
    value: "table",
    label: "טבלה",
    description: "תצוגת שורות עם עמודות",
    icon: Table2,
  },
];

const TEMPLATE_LAYOUT_OPTIONS: Array<{
  value: TemplateLayoutMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: "regular",
    label: "רגיל",
    description: "התצוגה המלאה הנוכחית",
    icon: Square,
  },
  {
    value: "compact",
    label: "קומפקטי",
    description: "פחות פרטים, יותר צפוף",
    icon: Minimize2,
  },
  {
    value: "expanded",
    label: "מורחב",
    description: "יותר מקום ופרטים",
    icon: Maximize2,
  },
  {
    value: "quick",
    label: "מהיר",
    description: "שם + פתיחה בעורך + שכפול",
    icon: Zap,
  },
];

const parseFolderLayout = (value: string | null): FolderLayoutMode => {
  if (
    value === "grid" ||
    value === "dense" ||
    value === "list" ||
    value === "expanded" ||
    value === "table"
  ) {
    return value;
  }
  return "grid";
};

const parseTemplateLayout = (value: string | null): TemplateLayoutMode => {
  if (value === "regular" || value === "compact" || value === "expanded" || value === "quick") {
    return value;
  }
  return "regular";
};

export function QuoteTemplatesManager() {
  const { user } = useAuth();
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
  const [draggedTemplateId, setDraggedTemplateId] = useState<string | null>(null);
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | "unfoldered" | "root">(null);
  const [folderLayoutMode, setFolderLayoutMode] = useState<FolderLayoutMode>(
    () => parseFolderLayout(localStorage.getItem(FOLDER_LAYOUT_STORAGE_KEY)),
  );
  const [ungroupedLayoutMode, setUngroupedLayoutMode] = useState<FolderLayoutMode>(
    () => parseFolderLayout(localStorage.getItem(UNGROUPED_LAYOUT_STORAGE_KEY)),
  );
  const [folderCardStyle, setFolderCardStyle] = useState<TemplateLayoutMode>(
    () => parseTemplateLayout(localStorage.getItem(FOLDER_CARD_STYLE_STORAGE_KEY)),
  );
  const [ungroupedCardStyle, setUngroupedCardStyle] = useState<TemplateLayoutMode>(
    () => parseTemplateLayout(localStorage.getItem(UNGROUPED_CARD_STYLE_STORAGE_KEY)),
  );
  const [cloudViewReady, setCloudViewReady] = useState(false);

  useEffect(() => {
    localStorage.setItem(FOLDER_LAYOUT_STORAGE_KEY, folderLayoutMode);
  }, [folderLayoutMode]);

  useEffect(() => {
    localStorage.setItem(UNGROUPED_LAYOUT_STORAGE_KEY, ungroupedLayoutMode);
  }, [ungroupedLayoutMode]);

  useEffect(() => {
    localStorage.setItem(FOLDER_CARD_STYLE_STORAGE_KEY, folderCardStyle);
  }, [folderCardStyle]);

  useEffect(() => {
    localStorage.setItem(UNGROUPED_CARD_STYLE_STORAGE_KEY, ungroupedCardStyle);
  }, [ungroupedCardStyle]);

  useEffect(() => {
    let isMounted = true;

    if (!user?.id || !isTableAvailable("user_preferences")) {
      setCloudViewReady(true);
      return;
    }

    const loadCloudLayouts = async () => {
      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("view_preferences")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          markTableUnavailable("user_preferences");
          return;
        }

        const viewPrefs = (data as any)?.view_preferences;
        if (!viewPrefs || typeof viewPrefs !== "object") return;

        const savedFolderLayout = parseFolderLayout(
          typeof viewPrefs.quote_templates_folder_layout === "string"
            ? viewPrefs.quote_templates_folder_layout
            : null,
        );
        const savedUngroupedLayout = parseFolderLayout(
          typeof viewPrefs.quote_templates_ungrouped_layout === "string"
            ? viewPrefs.quote_templates_ungrouped_layout
            : null,
        );
        const savedFolderCardStyle = parseTemplateLayout(
          typeof viewPrefs.quote_templates_folder_card_style === "string"
            ? viewPrefs.quote_templates_folder_card_style
            : null,
        );
        const savedUngroupedCardStyle = parseTemplateLayout(
          typeof viewPrefs.quote_templates_ungrouped_card_style === "string"
            ? viewPrefs.quote_templates_ungrouped_card_style
            : null,
        );

        if (!isMounted) return;

        setFolderLayoutMode(savedFolderLayout);
        setUngroupedLayoutMode(savedUngroupedLayout);
        setFolderCardStyle(savedFolderCardStyle);
        setUngroupedCardStyle(savedUngroupedCardStyle);
        localStorage.setItem(FOLDER_LAYOUT_STORAGE_KEY, savedFolderLayout);
        localStorage.setItem(UNGROUPED_LAYOUT_STORAGE_KEY, savedUngroupedLayout);
        localStorage.setItem(FOLDER_CARD_STYLE_STORAGE_KEY, savedFolderCardStyle);
        localStorage.setItem(UNGROUPED_CARD_STYLE_STORAGE_KEY, savedUngroupedCardStyle);
      } catch {
        markTableUnavailable("user_preferences");
      } finally {
        if (isMounted) setCloudViewReady(true);
      }
    };

    loadCloudLayouts();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!cloudViewReady || !user?.id || !isTableAvailable("user_preferences")) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("user_preferences")
          .select("view_preferences")
          .eq("user_id", user.id)
          .maybeSingle();

        if (fetchError) {
          markTableUnavailable("user_preferences");
          return;
        }

        const existingViewPrefs =
          data && typeof (data as any).view_preferences === "object"
            ? ((data as any).view_preferences as Record<string, unknown>)
            : {};

        const mergedViewPrefs = {
          ...existingViewPrefs,
          quote_templates_folder_layout: folderLayoutMode,
          quote_templates_ungrouped_layout: ungroupedLayoutMode,
          quote_templates_folder_card_style: folderCardStyle,
          quote_templates_ungrouped_card_style: ungroupedCardStyle,
        };

        const { error: saveError } = await supabase
          .from("user_preferences")
          .upsert(
            {
              user_id: user.id,
              view_preferences: mergedViewPrefs as any,
              updated_at: new Date().toISOString(),
            } as any,
            { onConflict: "user_id" },
          );

        if (saveError) {
          markTableUnavailable("user_preferences");
        }
      } catch {
        markTableUnavailable("user_preferences");
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [cloudViewReady, folderLayoutMode, ungroupedLayoutMode, folderCardStyle, ungroupedCardStyle, user?.id]);

  const getFolderTemplatesContainerClass = () => {
    switch (folderLayoutMode) {
      case "dense":
        return "grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3";
      case "list":
        return "flex flex-col gap-3";
      case "expanded":
        return "grid md:grid-cols-1 xl:grid-cols-2 gap-5";
      case "table":
        return "";
      case "grid":
      default:
        return "grid md:grid-cols-2 lg:grid-cols-3 gap-4";
    }
  };

  const getUngroupedTemplatesContainerClass = () => {
    switch (ungroupedLayoutMode) {
      case "dense":
        return "grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3";
      case "list":
        return "flex flex-col gap-3";
      case "expanded":
        return "grid md:grid-cols-1 xl:grid-cols-2 gap-5";
      case "table":
        return "";
      case "grid":
      default:
        return "grid md:grid-cols-2 lg:grid-cols-3 gap-4";
    }
  };

  const getFolderTilesContainerClass = () => {
    switch (folderLayoutMode) {
      case "grid":
        return "grid md:grid-cols-2 lg:grid-cols-3 gap-4";
      case "dense":
        return "grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3";
      case "expanded":
        return "flex flex-col gap-6";
      case "table":
        return "";
      case "list":
      default:
        return "flex flex-col gap-4";
    }
  };

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
        stagesTitle: t.stages_title || undefined,
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
          .update({
            name: folder.name,
            color: folder.color,
            icon: folder.icon,
            parent_id: folder.parent_id ?? null,
          })
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
              parent_id: folder.parent_id ?? null,
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

  // Move folder to a new parent (or to root when newParentId is null)
  const moveFolderMutation = useMutation({
    mutationFn: async ({
      folderId,
      newParentId,
    }: {
      folderId: string;
      newParentId: string | null;
    }) => {
      const { error } = await (supabase as any)
        .from("quote_template_folders")
        .update({ parent_id: newParentId })
        .eq("id", folderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-template-folders"] });
    },
    onError: (err: any) => {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
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
    mutationFn: async (template: Partial<QuoteTemplate>): Promise<{ newId?: string }> => {
      const payload = {
        name: template.name,
        description: template.description,
        category: template.category,
        items: template.items || [],
        stages: template.stages || [],
        stages_title: template.stagesTitle || null,
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
        return {};
      } else {
        const { data, error } = await (supabase as any)
          .from("quote_templates")
          .insert([payload])
          .select("id")
          .single();
        if (error) throw error;
        return { newId: data?.id };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-templates-advanced"] });
      // When the HTML editor is open it manages its own toast + stays open
      if (!htmlEditorTemplate) {
        setIsDialogOpen(false);
        setEditingTemplate(null);
        toast({
          title: "נשמר בהצלחה",
          description: "התבנית נשמרה",
        });
      }
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
  const handleNew = (folderId?: string | null) => {
    const newTemplate = createEmptyTemplate();
    const resolvedFolderId = folderId !== undefined ? folderId : selectedFolderId;
    if (resolvedFolderId) newTemplate.folder_id = resolvedFolderId;
    setHtmlEditorTemplate({
      ...newTemplate,
      id: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as QuoteTemplate);
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

  const openTemplateInDocumentEditor = (templateId: string) => {
    const params = new URLSearchParams({
      type: "quote",
      templateId,
    });
    window.location.href = `/document-editor?${params.toString()}`;
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

  // Tree helpers for nested folders
  const childFoldersByParent = folders.reduce<Record<string, QuoteTemplateFolder[]>>(
    (acc, f) => {
      const key = f.parent_id || "__root__";
      (acc[key] = acc[key] || []).push(f);
      return acc;
    },
    {},
  );
  const rootFolders = childFoldersByParent["__root__"] || [];

  // Returns set of descendant ids (including self) to prevent cycles when dragging folders
  const getDescendantIds = (folderId: string): Set<string> => {
    const result = new Set<string>([folderId]);
    const walk = (id: string) => {
      (childFoldersByParent[id] || []).forEach((child) => {
        if (!result.has(child.id)) {
          result.add(child.id);
          walk(child.id);
        }
      });
    };
    walk(folderId);
    return result;
  };

  // Recursive count of templates in folder + all subfolders
  const countTemplatesDeep = (folderId: string): number => {
    let count = (templatesByFolder[folderId] || []).length;
    (childFoldersByParent[folderId] || []).forEach((c) => {
      count += countTemplatesDeep(c.id);
    });
    return count;
  };

  // For "Move to Folder" dialog - flatten tree with depth
  const flattenFolderTree = (
    parentId: string | null = null,
    depth = 0,
  ): Array<{ folder: QuoteTemplateFolder; depth: number }> => {
    const list = (childFoldersByParent[parentId || "__root__"] || []).slice().sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
    );
    const result: Array<{ folder: QuoteTemplateFolder; depth: number }> = [];
    list.forEach((f) => {
      result.push({ folder: f, depth });
      result.push(...flattenFolderTree(f.id, depth + 1));
    });
    return result;
  };


  const calculateTotal = (template: QuoteTemplate) => {
    // Prefer base_price (set in editor), fallback to items sum
    if (template.base_price && template.base_price > 0) {
      return template.base_price;
    }
    return (template.items || []).reduce(
      (sum, item) => sum + (item.total || 0),
      0,
    );
  };

  // State for open-template choice dialog
  const [openChoiceTemplate, setOpenChoiceTemplate] = useState<QuoteTemplate | null>(null);

  const renderTemplatesTable = (tableTemplates: QuoteTemplate[]) => {
    return (
      <div className="overflow-x-auto rounded-md border bg-background [content-visibility:visible] [contain-intrinsic-size:auto]">
        <table className="w-full min-w-[980px] table-fixed text-sm">
          <colgroup>
            <col className="w-[38%]" />
            <col className="w-[14%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[11%]" />
            <col className="w-[15%]" />
          </colgroup>
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-right font-medium">תבנית</th>
              <th className="px-3 py-2 text-right font-medium">קטגוריה</th>
              <th className="px-3 py-2 text-right font-medium">שלבים/פריטים</th>
              <th className="px-3 py-2 text-right font-medium">תוקף</th>
              <th className="px-3 py-2 text-right font-medium">סה״כ</th>
              <th className="px-3 py-2 text-right font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {tableTemplates.map((template) => {
              const primaryColor = template.design_settings?.primary_color || "#d8ac27";
              const stagesCount = (template.stages || []).length;
              const itemsCount =
                (template.stages || []).reduce(
                  (sum, stage) => sum + (stage.items || []).length,
                  0,
                ) + (template.items || []).length;

              return (
                <tr key={template.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 align-top min-w-0">
                    <div
                      className="text-sm font-semibold leading-snug truncate"
                      title={template.name}
                    >
                      {template.name}
                    </div>
                    <div
                      className="text-xs text-muted-foreground truncate"
                      title={template.description || "ללא תיאור"}
                    >
                      {template.description || "ללא תיאור"}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className="w-fit whitespace-nowrap"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                    >
                      {CATEGORIES.find((c) => c.value === template.category)?.label ||
                        template.category}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 align-top text-muted-foreground whitespace-nowrap">
                    {stagesCount} / {itemsCount}
                  </td>
                  <td className="px-3 py-2 align-top text-muted-foreground whitespace-nowrap">
                    {template.validity_days} יום
                  </td>
                  <td
                    className="px-3 py-2 align-top font-bold whitespace-nowrap"
                    style={{ color: primaryColor }}
                  >
                    ₪{calculateTotal(template).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 align-top whitespace-nowrap">
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <Button
                        size="sm"
                        className="h-8 shrink-0 bg-[#d8ac27] text-white hover:bg-[#c49b22]"
                        onClick={() => setHtmlEditorTemplate(template)}
                      >
                        <ExternalLink className="h-3.5 w-3.5 ml-1" />
                        פתח
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 shrink-0"
                        title="שכפל וצור הצעת מחיר חדשה"
                        onClick={() => openTemplateInDocumentEditor(template.id)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 shrink-0"
                        onClick={() => handleEdit(template)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 shrink-0"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // --- Render template card ---
  const renderTemplateCard = (template: QuoteTemplate, cardStyle: TemplateLayoutMode = "regular") => {
    const primaryColor = template.design_settings?.primary_color || "#d8ac27";
    const stagesCount = (template.stages || []).length;
    const itemsCount =
      (template.stages || []).reduce(
        (sum, stage) => sum + (stage.items || []).length,
        0,
      ) + (template.items || []).length;

    const isRenaming = renamingTemplateId === template.id;
    const isCompactLayout = cardStyle === "compact";
    const isExpandedLayout = cardStyle === "expanded";
    const isQuickLayout = cardStyle === "quick";
    const cardHeaderClassName = isCompactLayout
      ? "p-4 pb-2"
      : isExpandedLayout
        ? "p-6 pb-3"
        : "pb-2";
    const cardContentClassName = isCompactLayout
      ? "p-4 pt-1"
      : isExpandedLayout
        ? "p-6 pt-2"
        : undefined;

    return (
      <Card
        key={template.id}
        draggable={!isRenaming}
        onDragStart={(e) => {
          setDraggedTemplateId(template.id);
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", template.id);
        }}
        onDragEnd={() => {
          setDraggedTemplateId(null);
          setDragOverFolderId(null);
        }}
        className={`overflow-hidden hover:shadow-lg transition-all group cursor-move ${
          draggedTemplateId === template.id ? "opacity-40 scale-95" : ""
          } ${
          isQuickLayout ? "border-primary/30" : ""
        }`}
      >
        <div className="h-2" style={{ backgroundColor: primaryColor }} />

        <CardHeader className={cardHeaderClassName}>
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
                <CardTitle
                  className={
                    isCompactLayout
                      ? "text-sm leading-snug line-clamp-2"
                      : isExpandedLayout
                        ? "text-base leading-snug line-clamp-2"
                        : "text-sm md:text-base leading-snug line-clamp-2"
                  }
                >
                  {template.name}
                </CardTitle>
              )}

              {!isQuickLayout && (
                <CardDescription
                  className={`mt-1 ${isExpandedLayout ? "line-clamp-4" : "line-clamp-2"}`}
                >
                  {template.description || "ללא תיאור"}
                </CardDescription>
              )}
            </div>

            <div className="flex items-center gap-1">
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
                <DropdownMenuContent align="end">
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
          </div>

          {!isQuickLayout && (
            <Badge
              variant="outline"
              className="w-fit"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              {CATEGORIES.find((c) => c.value === template.category)?.label ||
                template.category}
            </Badge>
          )}
        </CardHeader>

        <CardContent className={cardContentClassName}>
          <div className="space-y-3">
            {!isQuickLayout && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{stagesCount} שלבים</span>
                <span>•</span>
                <span>{itemsCount} פריטים</span>
                <span>•</span>
                <span>{template.validity_days} יום</span>
              </div>
            )}

            {/* Project details if available */}
            {isExpandedLayout &&
              template.project_details &&
              (template.project_details.gush ||
                template.project_details.helka ||
                template.project_details.projectName) && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5 space-y-0.5">
                {template.project_details.projectName && (
                  <div className="truncate">📋 {template.project_details.projectName}</div>
                )}
                {(template.project_details.gush || template.project_details.helka) && (
                  <div>📍 גוש: {template.project_details.gush || '-'} חלקה: {template.project_details.helka || '-'}</div>
                )}
              </div>
            )}

            {!isQuickLayout && (
              <div className="flex items-center justify-between py-2 border-t">
                <span className="font-medium">סה״כ:</span>
                <span
                  className={`font-bold ${isCompactLayout ? "text-base" : "text-lg"}`}
                  style={{ color: primaryColor }}
                >
                  ₪{calculateTotal(template).toLocaleString()}
                </span>
              </div>
            )}

            <div className={`flex gap-2 ${isQuickLayout ? "flex-nowrap" : "flex-wrap"}`}>
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
                onClick={() => openTemplateInDocumentEditor(template.id)}
                title="שכפל וצור הצעת מחיר חדשה"
                className={isQuickLayout ? "px-4" : undefined}
              >
                <Copy className="h-4 w-4" />
                {isQuickLayout ? <span className="mr-1">שכפל</span> : null}
              </Button>

              {!isQuickLayout && (
                <>
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
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
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
      <div className="flex items-center justify-start gap-4 flex-nowrap">
        <div className="shrink-0">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-[#d8ac27]" />
            תבניות הצעות מחיר
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-nowrap">
          <Button
            onClick={() => {
              setEditingFolder({ name: "", color: "#d8ac27" });
              setFolderDialogOpen(true);
            }}
            variant="outline"
            className="shrink-0 border-primary/50 text-primary hover:bg-primary/10"
          >
            <FolderPlus className="h-4 w-4 ml-2" />
            תיקייה חדשה
          </Button>
          <Button
            onClick={() => wordToHtmlInputRef.current?.click()}
            variant="outline"
            disabled={isConverting}
            className="shrink-0 border-primary text-primary hover:bg-primary/10"
          >
            {isConverting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent ml-2" />
            ) : (
              <FileCode className="h-4 w-4 ml-2" />
            )}
            Word → HTML
          </Button>
          <Button
            onClick={handleNew}
            className="shrink-0 bg-[#d8ac27] hover:bg-[#c49b22] text-white"
          >
            <Plus className="h-4 w-4 ml-2" />
            תבנית חדשה
          </Button>
          <Button
            onClick={handleImportClick}
            variant="outline"
            disabled={isImporting}
            aria-label="יבוא"
            title="יבוא"
            className="shrink-0 border-[#d8ac27] text-[#d8ac27] hover:bg-[#d8ac27]/10"
          >
            {isImporting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#d8ac27] border-t-transparent ml-2" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
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
          {/* Folders - recursive tree */}
          {(() => {
            const renderFolderNode = (
              folder: QuoteTemplateFolder,
              depth: number,
            ): React.ReactNode => {
              const folderTemplates = templatesByFolder[folder.id] || [];
              const childFolders = (childFoldersByParent[folder.id] || []).slice().sort(
                (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
              );
              const isCollapsed = collapsedFolders.has(folder.id);
              const deepCount = countTemplatesDeep(folder.id);
              const isDropTarget = dragOverFolderId === folder.id;
              const canAcceptFolder =
                draggedFolderId &&
                draggedFolderId !== folder.id &&
                !getDescendantIds(draggedFolderId).has(folder.id);

              return (
                <div
                  key={folder.id}
                  className={`border rounded-lg overflow-hidden bg-card transition-all ${
                    isDropTarget ? "ring-2 ring-offset-2 scale-[1.005]" : ""
                  }`}
                  style={
                    isDropTarget
                      ? { boxShadow: `0 0 0 2px ${folder.color}` }
                      : undefined
                  }
                  onDragOver={(e) => {
                    if (!draggedTemplateId && !canAcceptFolder) return;
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "move";
                    setDragOverFolderId(folder.id);
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    setDragOverFolderId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (draggedTemplateId) {
                      const t = templates.find((x) => x.id === draggedTemplateId);
                      if (t && t.folder_id !== folder.id) {
                        moveToFolderMutation.mutate({
                          templateId: draggedTemplateId,
                          folderId: folder.id,
                        });
                      }
                    } else if (draggedFolderId && canAcceptFolder) {
                      moveFolderMutation.mutate({
                        folderId: draggedFolderId,
                        newParentId: folder.id,
                      });
                    }
                    setDragOverFolderId(null);
                    setDraggedTemplateId(null);
                    setDraggedFolderId(null);
                  }}
                >
                  {/* Folder header (draggable) */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    style={{ borderRight: `4px solid ${folder.color}` }}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      setDraggedFolderId(folder.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("application/x-folder-id", folder.id);
                    }}
                    onDragEnd={() => {
                      setDraggedFolderId(null);
                      setDragOverFolderId(null);
                    }}
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

                    <span className="font-semibold flex-1 truncate">{folder.name}</span>

                    <Badge variant="secondary" className="text-xs">
                      {deepCount} תבניות
                    </Badge>
                    {childFolders.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {childFolders.length} תתי-תיקיות
                      </Badge>
                    )}

                    <div className="flex items-center gap-1">
                      {/* Add subfolder */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="תת-תיקייה חדשה"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFolder({
                            name: "",
                            color: folder.color,
                            parent_id: folder.id,
                          });
                          setFolderDialogOpen(true);
                        }}
                      >
                        <FolderPlus className="h-4 w-4" />
                      </Button>

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
                        <DropdownMenuContent align="end">
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
                              setEditingFolder({
                                name: "",
                                color: folder.color,
                                parent_id: folder.id,
                              });
                              setFolderDialogOpen(true);
                            }}
                          >
                            <FolderPlus className="h-4 w-4 ml-2" />
                            תת-תיקייה חדשה
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNew(folder.id);
                            }}
                          >
                            <Plus className="h-4 w-4 ml-2" />
                            תבנית חדשה בתיקייה
                          </DropdownMenuItem>
                          {folder.parent_id && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                moveFolderMutation.mutate({
                                  folderId: folder.id,
                                  newParentId: null,
                                });
                              }}
                            >
                              <FolderOpen className="h-4 w-4 ml-2" />
                              העבר לרמה הראשית
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                confirm(
                                  `למחוק את התיקייה "${folder.name}"? התבניות בתוכה יעברו לרשימה הראשית, ותתי-התיקיות יימחקו.`,
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
                  </div>

                  {/* Folder body */}
                  {!isCollapsed && (
                    <div className="p-4 pt-2 bg-muted/10 space-y-3">
                      {/* Subfolders first */}
                      {childFolders.length > 0 && (
                        <div className="space-y-3 pr-4 border-r-2 border-dashed border-muted">
                          {childFolders.map((sub) => renderFolderNode(sub, depth + 1))}
                        </div>
                      )}

                      {/* Templates */}
                      {folderTemplates.length === 0 && childFolders.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          <Folder className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p>אין תבניות בתיקייה זו</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            onClick={() => handleNew(folder.id)}
                          >
                            <Plus className="h-4 w-4 ml-1" />
                            הוסף תבנית
                          </Button>
                        </div>
                      ) : folderTemplates.length > 0 ? (
                        folderLayoutMode === "table" ? (
                          renderTemplatesTable(folderTemplates)
                        ) : (
                          <div className={getFolderTemplatesContainerClass()}>
                            {folderTemplates.map(t => renderTemplateCard(t, folderCardStyle))}
                          </div>
                        )
                      ) : null}
                    </div>
                  )}
                </div>
              );
            };

            const sortedRoots = rootFolders.slice().sort(
              (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
            );

            return (
              <>
                {sortedRoots.length > 0 && (
                  <div className="flex items-center justify-between gap-2 mb-3 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        תיקיות ({sortedRoots.length})
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="תצוגת תיקיות"
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rtl min-w-60">
                        <DropdownMenuLabel>פריסת תיקיות</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup
                          value={folderLayoutMode}
                          onValueChange={(value) => setFolderLayoutMode(parseFolderLayout(value))}
                        >
                          {FOLDER_LAYOUT_OPTIONS.map((option) => {
                            const OptionIcon = option.icon;
                            return (
                              <DropdownMenuRadioItem key={option.value} value={option.value}>
                                <div className="w-full text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <span>{option.label}</span>
                                    <OptionIcon className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="text-xs text-muted-foreground">{option.description}</div>
                                </div>
                              </DropdownMenuRadioItem>
                            );
                          })}
                        </DropdownMenuRadioGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>סגנון כרטיס</DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                          value={folderCardStyle}
                          onValueChange={(value) => setFolderCardStyle(parseTemplateLayout(value))}
                        >
                          {TEMPLATE_LAYOUT_OPTIONS.map((option) => {
                            const OptionIcon = option.icon;
                            return (
                              <DropdownMenuRadioItem key={option.value} value={option.value}>
                                <div className="w-full text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <span>{option.label}</span>
                                    <OptionIcon className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="text-xs text-muted-foreground">{option.description}</div>
                                </div>
                              </DropdownMenuRadioItem>
                            );
                          })}
                        </DropdownMenuRadioGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setCollapsedFolders(new Set(folders.map(f => f.id)))}>
                          <Minimize2 className="h-4 w-4 ml-2" />
                          כווץ את כל התיקיות
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setCollapsedFolders(new Set())}>
                          <Maximize2 className="h-4 w-4 ml-2" />
                          הרחב את כל התיקיות
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                <div className={getFolderTilesContainerClass()}>
                  {sortedRoots.map((f) => renderFolderNode(f, 0))}
                  {/* Root drop zone for folders being dragged out of a parent */}
                  {draggedFolderId && (
                    <div
                      className={`rounded-lg border-2 border-dashed py-3 text-center text-sm transition-all ${
                        dragOverFolderId === "root"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-muted-foreground/30 text-muted-foreground"
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        setDragOverFolderId("root");
                      }}
                      onDragLeave={() => setDragOverFolderId(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedFolderId) {
                          moveFolderMutation.mutate({
                            folderId: draggedFolderId,
                            newParentId: null,
                          });
                        }
                        setDragOverFolderId(null);
                        setDraggedFolderId(null);
                      }}
                    >
                      שחרר כאן להעברה לרמה הראשית
                    </div>
                  )}
                </div>
              </>
            );
          })()}


          {/* Unfoldered drop zone (always visible while dragging) */}
          {(unfolderedTemplates.length > 0 || (draggedTemplateId && folders.length > 0)) && (
            <div
              className={`rounded-lg transition-all ${
                dragOverFolderId === "unfoldered"
                  ? "ring-2 ring-primary ring-offset-2 bg-primary/5 p-3"
                  : draggedTemplateId
                    ? "border-2 border-dashed border-muted-foreground/30 p-3"
                    : ""
              }`}
              onDragOver={(e) => {
                if (!draggedTemplateId) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOverFolderId("unfoldered");
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                setDragOverFolderId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = draggedTemplateId || e.dataTransfer.getData("text/plain");
                if (id) {
                  const t = templates.find((x) => x.id === id);
                  if (t && t.folder_id) {
                    moveToFolderMutation.mutate({ templateId: id, folderId: null });
                  }
                }
                setDragOverFolderId(null);
                setDraggedTemplateId(null);
              }}
            >
              {folders.length > 0 && (
                <div className="flex items-center justify-between gap-2 mb-3 text-muted-foreground">
                  <div className="flex items-center gap-2 flex-1">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    תבניות ללא תיקייה ({unfolderedTemplates.length})
                    {draggedTemplateId && (
                      <span className="mr-2 text-primary text-xs">— שחרר כאן להוצאה מתיקייה</span>
                    )}
                  </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="תצוגת תבניות ללא תיקייה"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rtl min-w-60">
                      <DropdownMenuLabel>פריסת תבניות ללא תיקייה</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuRadioGroup
                        value={ungroupedLayoutMode}
                        onValueChange={(value) => setUngroupedLayoutMode(parseFolderLayout(value))}
                      >
                        {FOLDER_LAYOUT_OPTIONS.map((option) => {
                          const OptionIcon = option.icon;
                          return (
                            <DropdownMenuRadioItem key={option.value} value={option.value}>
                              <div className="w-full text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <span>{option.label}</span>
                                  <OptionIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="text-xs text-muted-foreground">{option.description}</div>
                              </div>
                            </DropdownMenuRadioItem>
                          );
                        })}
                      </DropdownMenuRadioGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>סגנון כרטיס</DropdownMenuLabel>
                      <DropdownMenuRadioGroup
                        value={ungroupedCardStyle}
                        onValueChange={(value) => setUngroupedCardStyle(parseTemplateLayout(value))}
                      >
                        {TEMPLATE_LAYOUT_OPTIONS.map((option) => {
                          const OptionIcon = option.icon;
                          return (
                            <DropdownMenuRadioItem key={option.value} value={option.value}>
                              <div className="w-full text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <span>{option.label}</span>
                                  <OptionIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="text-xs text-muted-foreground">{option.description}</div>
                              </div>
                            </DropdownMenuRadioItem>
                          );
                        })}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {ungroupedLayoutMode === "table" ? (
                renderTemplatesTable(unfolderedTemplates)
              ) : (
                <div className={getUngroupedTemplatesContainerClass()}>
                  {unfolderedTemplates.map(t => renderTemplateCard(t, ungroupedCardStyle))}
                </div>
              )}
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
        <DialogContent className="sm:max-w-md">
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
            {/* Parent folder picker */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                תיקיית אב (אופציונלי)
              </label>
              <select
                className="w-full border rounded-md px-3 py-2 bg-background text-sm"
                value={editingFolder?.parent_id || ""}
                onChange={(e) =>
                  setEditingFolder((prev) =>
                    prev
                      ? { ...prev, parent_id: e.target.value || null }
                      : prev,
                  )
                }
              >
                <option value="">— ללא (רמה ראשית) —</option>
                {flattenFolderTree().map(({ folder: f, depth }) => {
                  // Prevent selecting self or own descendant
                  const disabled =
                    editingFolder?.id &&
                    getDescendantIds(editingFolder.id).has(f.id);
                  return (
                    <option key={f.id} value={f.id} disabled={!!disabled}>
                      {"— ".repeat(depth)}
                      {f.name}
                    </option>
                  );
                })}
              </select>
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
        <DialogContent className="sm:max-w-sm">
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
            {flattenFolderTree().map(({ folder, depth }) => (
              <button
                key={folder.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-right"
                style={{ paddingRight: `${0.75 + depth * 1.25}rem` }}
                onClick={() =>
                  moveToFolderTemplateId &&
                  moveToFolderMutation.mutate({
                    templateId: moveToFolderTemplateId,
                    folderId: folder.id,
                  })
                }
              >
                <Folder className="h-5 w-5" style={{ color: folder.color }} />
                <span className="truncate">{folder.name}</span>
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
            const result = await saveMutation.mutateAsync(t);
            if (result?.newId) {
              // New template — update state with real DB id so future saves are UPDATEs
              setHtmlEditorTemplate(prev =>
                prev ? { ...prev, ...t, id: result.newId! } as QuoteTemplate : null
              );
            }
            // Existing template: keep editor open, just sync saved fields
            else {
              setHtmlEditorTemplate(prev => prev ? { ...prev, ...t } as QuoteTemplate : null);
            }
          }}
        />
      )}
    </div>
  );
}

export default QuoteTemplatesManager;
