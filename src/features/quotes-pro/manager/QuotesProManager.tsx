// Quotes Pro — מנהל המסמכים (רשימה, יצירה, פתיחה, שכפול, מחיקה)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Sparkles,
  ExternalLink,
  Copy,
  Trash2,
  MoreVertical,
  FileText,
  Folder,
  FolderPlus,
  FolderInput,
  Layers,
  Download,
} from "lucide-react";
import { LegacyImportDialog } from "../legacy-import/LegacyImportDialog";
import {
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  listDocuments,
  createDocument,
  deleteDocument,
  duplicateDocument,
  listFolders,
  saveFolder,
  deleteFolder,
  moveDocumentToFolder,
} from "../data/api";
import { createEmptyDocument } from "../model/defaults";
import { QP_CATEGORIES } from "../model/types";
import type { QPDocument, QPFolder } from "../model/types";

function docTotal(doc: QPDocument): number {
  const priceBlock = doc.blocks.find((b) => b.type === "priceTable");
  if (priceBlock && priceBlock.type === "priceTable") {
    return priceBlock.items.reduce((s, it) => s + (it.total || 0), 0);
  }
  return 0;
}

export function QuotesProManager() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  // null = הכל, "none" = ללא תיקייה, אחרת מזהה תיקייה
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["qp-documents"],
    queryFn: listDocuments,
  });

  const { data: folders = [] } = useQuery({
    queryKey: ["qp-folders"],
    queryFn: listFolders,
  });

  const createFolderMutation = useMutation({
    mutationFn: (name: string) => saveFolder({ name, color: "#d8ac27" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["qp-folders"] }),
    onError: (e: any) =>
      toast({ title: "שגיאה ביצירת תיקייה", description: e.message, variant: "destructive" }),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qp-folders"] });
      queryClient.invalidateQueries({ queryKey: ["qp-documents"] });
      setSelectedFolder(null);
      toast({ title: "התיקייה נמחקה" });
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ docId, folderId }: { docId: string; folderId: string | null }) =>
      moveDocumentToFolder(docId, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qp-documents"] });
      toast({ title: "ההצעה הועברה" });
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createDocument({
        ...createEmptyDocument(),
        name: "הצעת מחיר חדשה",
        folder_id: selectedFolder && selectedFolder !== "none" ? selectedFolder : null,
      }),
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ["qp-documents"] });
      navigate(`/quotes-pro/editor/${doc.id}`);
    },
    onError: (e: any) =>
      toast({ title: "שגיאה ביצירה", description: e.message, variant: "destructive" }),
  });

  const duplicateMutation = useMutation({
    mutationFn: (doc: QPDocument) => duplicateDocument(doc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qp-documents"] });
      toast({ title: "שוכפל בהצלחה" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qp-documents"] });
      toast({ title: "נמחק" });
    },
  });

  const filtered = documents.filter((d) => {
    const matchCat = category === "all" || d.category === category;
    const matchSearch =
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.description || "").toLowerCase().includes(search.toLowerCase());
    const matchFolder =
      selectedFolder === null ||
      (selectedFolder === "none" ? !d.folder_id : d.folder_id === selectedFolder);
    return matchCat && matchSearch && matchFolder;
  });

  const folderCount = (id: string | "none") =>
    documents.filter((d) => (id === "none" ? !d.folder_id : d.folder_id === id)).length;

  const handleNewFolder = () => {
    const name = window.prompt("שם התיקייה:");
    if (name && name.trim()) createFolderMutation.mutate(name.trim());
  };

  return (
    <div className="space-y-6" dir="rtl">
      <LegacyImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onDone={() => queryClient.invalidateQueries({ queryKey: ["qp-documents"] })}
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#d8ac27]" />
            הצעות מחיר PRO
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            מערכת חדשה מבוססת בלוקים — מקצועית, מודולרית וחכמה
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => setImportOpen(true)} variant="outline">
            <Download className="h-4 w-4 ml-2" />
            ייבא מהישן
          </Button>
          <Button onClick={handleNewFolder} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
            <FolderPlus className="h-4 w-4 ml-2" />
            תיקייה
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="bg-[#d8ac27] hover:bg-[#c49b22] text-white"
          >
            <Plus className="h-4 w-4 ml-2" />
            הצעה חדשה
          </Button>
        </div>
      </div>

      {/* Folder bar */}
      {(folders.length > 0 || folderCount("none") < documents.length) && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant={selectedFolder === null ? "default" : "outline"}
            onClick={() => setSelectedFolder(null)}
            className={selectedFolder === null ? "bg-[#d8ac27] hover:bg-[#c49b22] text-white" : ""}
          >
            <Layers className="h-4 w-4 ml-1" />
            הכל ({documents.length})
          </Button>
          {folders.map((f) => (
            <div key={f.id} className="group/folder relative">
              <Button
                size="sm"
                variant={selectedFolder === f.id ? "default" : "outline"}
                onClick={() => setSelectedFolder(f.id)}
                className={selectedFolder === f.id ? "text-white" : ""}
                style={selectedFolder === f.id ? { backgroundColor: f.color } : { borderColor: f.color, color: f.color }}
              >
                <Folder className="h-4 w-4 ml-1" />
                {f.name} ({folderCount(f.id)})
                <Trash2
                  className="h-3 w-3 mr-1 opacity-0 group-hover/folder:opacity-100 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`למחוק את התיקייה "${f.name}"? ההצעות יעברו ל"ללא תיקייה".`)) {
                      deleteFolderMutation.mutate(f.id);
                    }
                  }}
                />
              </Button>
            </div>
          ))}
          {folderCount("none") > 0 && (
            <Button
              size="sm"
              variant={selectedFolder === "none" ? "default" : "outline"}
              onClick={() => setSelectedFolder("none")}
              className={selectedFolder === "none" ? "bg-muted-foreground text-white" : ""}
            >
              ללא תיקייה ({folderCount("none")})
            </Button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש הצעות..."
            className="pr-10"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="כל הקטגוריות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הקטגוריות</SelectItem>
            {QP_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
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
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">אין הצעות עדיין</h3>
            <p className="text-muted-foreground mb-6">צור את ההצעה הראשונה שלך</p>
            <Button
              onClick={() => createMutation.mutate()}
              className="bg-[#d8ac27] hover:bg-[#c49b22] text-white"
            >
              <Plus className="h-4 w-4 ml-2" />
              צור הצעה ראשונה
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const primary = doc.theme.primaryColor || "#d8ac27";
            return (
              <Card key={doc.id} className="overflow-hidden hover:shadow-lg transition-all group">
                <div className="h-2" style={{ backgroundColor: primary }} />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm md:text-base leading-snug line-clamp-2">
                        {doc.name || "ללא שם"}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {doc.description || "ללא תיאור"}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => duplicateMutation.mutate(doc)}>
                          <Copy className="h-4 w-4 ml-2" />
                          שכפל
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <FolderInput className="h-4 w-4 ml-2" />
                            העבר לתיקייה
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuLabel className="text-xs">בחר תיקייה</DropdownMenuLabel>
                            <DropdownMenuItem
                              disabled={!doc.folder_id}
                              onClick={() => moveMutation.mutate({ docId: doc.id, folderId: null })}
                            >
                              ללא תיקייה
                            </DropdownMenuItem>
                            {folders.map((f) => (
                              <DropdownMenuItem
                                key={f.id}
                                disabled={doc.folder_id === f.id}
                                onClick={() => moveMutation.mutate({ docId: doc.id, folderId: f.id })}
                              >
                                <Folder className="h-4 w-4 ml-2" style={{ color: f.color }} />
                                {f.name}
                              </DropdownMenuItem>
                            ))}
                            {folders.length === 0 && (
                              <DropdownMenuItem disabled>אין תיקיות — צור תיקייה תחילה</DropdownMenuItem>
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm("למחוק את ההצעה?")) deleteMutation.mutate(doc.id);
                          }}
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
                    style={{ borderColor: primary, color: primary }}
                  >
                    {QP_CATEGORIES.find((c) => c.value === doc.category)?.label || doc.category}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{doc.blocks.length} בלוקים</span>
                      <span>•</span>
                      <span>{doc.validity_days} יום</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="font-medium">סה״כ:</span>
                      <span className="font-bold text-lg" style={{ color: primary }}>
                        {doc.pricing.currency}
                        {docTotal(doc).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-[#d8ac27] hover:bg-[#c49b22] text-white"
                        onClick={() => navigate(`/quotes-pro/editor/${doc.id}`)}
                      >
                        <ExternalLink className="h-4 w-4 ml-1" />
                        פתח בעורך
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => duplicateMutation.mutate(doc)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
