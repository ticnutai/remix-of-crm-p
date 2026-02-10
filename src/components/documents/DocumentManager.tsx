import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClients } from "@/hooks/useClients";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Folder,
  FolderOpen,
  Search,
  Plus,
  File,
  FileImage,
  FileSpreadsheet,
  FileCode,
  MoreVertical,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Document {
  id: string;
  name: string;
  description?: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  mime_type?: string;
  client_id?: string;
  project_id?: string;
  folder: string;
  tags?: string[];
  version: number;
  uploaded_by?: string;
  created_at: string;
  client?: { name: string };
}

const FOLDERS = [
  { id: "general", name: "כללי", icon: Folder },
  { id: "contracts", name: "חוזים", icon: FileText },
  { id: "quotes", name: "הצעות מחיר", icon: FileSpreadsheet },
  { id: "invoices", name: "חשבוניות", icon: FileSpreadsheet },
  { id: "images", name: "תמונות", icon: FileImage },
  { id: "other", name: "אחר", icon: File },
];

const FILE_ICONS: Record<string, React.ComponentType<any>> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
  gif: FileImage,
  default: File,
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function getFileIcon(fileName: string): React.ComponentType<any> {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return FILE_ICONS[ext] || FILE_ICONS.default;
}

function useDocuments(folder?: string, clientId?: string) {
  return useQuery({
    queryKey: ["documents", folder, clientId],
    queryFn: async () => {
      let query = (supabase as any)
        .from("documents")
        .select(`*, client:clients(name)`)
        .order("created_at", { ascending: false });

      if (folder && folder !== "all") {
        query = query.eq("folder", folder);
      }
      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Document[];
    },
  });
}

export function DocumentManager() {
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { clients } = useClients();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useDocuments(
    selectedFolder !== "all" ? selectedFolder : undefined,
    selectedClient || undefined,
  );

  const [uploadData, setUploadData] = useState({
    name: "",
    description: "",
    folder: "general",
    client_id: "",
    file: null as File | null,
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: typeof uploadData) => {
      if (!data.file) throw new Error("No file selected");

      // Upload file to Supabase Storage
      const fileExt = data.file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, data.file);

      if (uploadError) {
        // If storage bucket doesn't exist, just save the metadata
        console.warn(
          "Storage upload failed, saving metadata only:",
          uploadError,
        );
      }

      const { data: publicUrl } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      // Save document metadata
      const { error } = await (supabase as any).from("documents").insert({
        name: data.name || data.file.name,
        description: data.description,
        file_url: publicUrl.publicUrl || filePath,
        file_type: fileExt,
        file_size: data.file.size,
        mime_type: data.file.type,
        folder: data.folder,
        client_id: data.client_id || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "המסמך הועלה בהצלחה" });
      setIsUploadOpen(false);
      setUploadData({
        name: "",
        description: "",
        folder: "general",
        client_id: "",
        file: null,
      });
    },
    onError: () => {
      toast({ title: "שגיאה בהעלאת המסמך", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("documents")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "המסמך נמחק" });
    },
  });

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadData({
        ...uploadData,
        file,
        name: uploadData.name || file.name,
      });
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FolderOpen className="h-6 w-6" />
          ניהול מסמכים
        </h1>

        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 ml-2" />
              העלאת מסמך
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>העלאת מסמך חדש</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                uploadMutation.mutate(uploadData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium">קובץ</label>
                <Input
                  type="file"
                  onChange={handleFileChange}
                  className="mt-1"
                  required
                />
              </div>

              <Input
                placeholder="שם המסמך"
                value={uploadData.name}
                onChange={(e) =>
                  setUploadData({ ...uploadData, name: e.target.value })
                }
              />

              <Input
                placeholder="תיאור (אופציונלי)"
                value={uploadData.description}
                onChange={(e) =>
                  setUploadData({ ...uploadData, description: e.target.value })
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={uploadData.folder}
                  onValueChange={(v) =>
                    setUploadData({ ...uploadData, folder: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="תיקייה" />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLDERS.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={uploadData.client_id || "__none__"}
                  onValueChange={(v) =>
                    setUploadData({
                      ...uploadData,
                      client_id: v === "__none__" ? "" : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="לקוח" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">ללא לקוח</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? "מעלה..." : "העלה"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadOpen(false)}
                >
                  ביטול
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-6">
        {/* Sidebar - Folders */}
        <div className="w-48 shrink-0">
          <div className="space-y-1">
            <Button
              variant={selectedFolder === "all" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedFolder("all")}
            >
              <FolderOpen className="h-4 w-4 ml-2" />
              הכל
            </Button>
            {FOLDERS.map((folder) => {
              const Icon = folder.icon;
              return (
                <Button
                  key={folder.id}
                  variant={selectedFolder === folder.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <Icon className="h-4 w-4 ml-2" />
                  {folder.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search & Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש מסמכים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select
              value={selectedClient || "__all__"}
              onValueChange={(v) => setSelectedClient(v === "__all__" ? "" : v)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="כל הלקוחות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">כל הלקוחות</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Documents Grid */}
          {isLoading ? (
            <div className="text-center py-8">טוען...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              אין מסמכים בתיקייה זו
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => {
                const FileIcon = getFileIcon(doc.name);
                return (
                  <Card
                    key={doc.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <FileIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{doc.name}</h3>
                          {doc.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {doc.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {doc.client?.name && (
                              <Badge variant="outline" className="text-xs">
                                {doc.client.name}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(doc.file_size)}
                            </span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(doc.file_url, "_blank")
                              }
                            >
                              <Eye className="h-4 w-4 ml-2" />
                              צפייה
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const a = document.createElement("a");
                                a.href = doc.file_url;
                                a.download = doc.name;
                                a.click();
                              }}
                            >
                              <Download className="h-4 w-4 ml-2" />
                              הורדה
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                if (confirm("האם למחוק את המסמך?")) {
                                  deleteMutation.mutate(doc.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              מחיקה
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentManager;
