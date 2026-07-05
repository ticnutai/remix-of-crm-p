import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Download,
  FileText,
  Loader2,
  Plus,
  Printer,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  createBlankOnlyOfficeDocument,
  createOnlyOfficeDownloadUrl,
  deleteOnlyOfficeDocument,
  formatOfficeFileSize,
  getOnlyOfficeEditorConfig,
  isOnlyOfficeSupported,
  listOnlyOfficeDocuments,
  OnlyOfficeDocument,
  OnlyOfficeEditorPayload,
  uploadOnlyOfficeDocument,
} from "@/services/onlyofficeService";

declare global {
  interface Window {
    DocsAPI?: { DocEditor: new (id: string, config: Record<string, unknown>) => { destroyEditor: () => void } };
  }
}

let docsApiPromise: Promise<void> | null = null;

function loadDocsApi(documentServerUrl: string) {
  if (window.DocsAPI) return Promise.resolve();
  if (!docsApiPromise) {
    docsApiPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${documentServerUrl.replace(/\/$/, "")}/web-apps/apps/api/documents/api.js`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        docsApiPromise = null;
        reject(new Error("לא ניתן לטעון את OnlyOffice API — ודא שה-Document Server רץ"));
      };
      document.head.appendChild(script);
    });
  }
  return docsApiPromise;
}

// The ONLYOFFICE script replaces its target div with an iframe, i.e. it
// mutates DOM that React would otherwise reconcile. To stay StrictMode-safe
// we give it an inner div created imperatively, so React only ever manages
// the outer container.
function OnlyOfficeEditorHost({
  documentServerUrl,
  config,
  onError,
}: {
  documentServerUrl: string;
  config: Record<string, unknown>;
  onError: (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let editor: { destroyEditor: () => void } | null = null;
    const mountId = `oo-editor-mount-${Math.random().toString(36).slice(2)}`;

    loadDocsApi(documentServerUrl)
      .then(() => {
        if (cancelled || !window.DocsAPI) return;
        const mount = document.createElement("div");
        mount.id = mountId;
        container.appendChild(mount);
        editor = new window.DocsAPI.DocEditor(mountId, {
          ...config,
          events: {
            ...(config.events as Record<string, unknown> | undefined),
            onError: (event: unknown) => onError(JSON.stringify(event)),
          },
        });
      })
      .catch((error: Error) => {
        if (!cancelled) onError(error.message);
      });

    return () => {
      cancelled = true;
      try {
        editor?.destroyEditor();
      } catch {
        // DocsAPI may already have torn down its own DOM.
      }
      container.innerHTML = "";
    };
  }, [documentServerUrl, config, onError]);

  return <div ref={containerRef} className="h-full w-full" />;
}

function formatDate(value?: string | null) {
  if (!value) return "עדיין לא נשמר";
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function OnlyOfficeEditor() {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<OnlyOfficeDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<OnlyOfficeDocument | null>(null);
  const [editorPayload, setEditorPayload] = useState<OnlyOfficeEditorPayload | null>(null);
  const [title, setTitle] = useState("מסמך חדש");
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isOpening, setIsOpening] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const nextDocuments = await listOnlyOfficeDocuments();
      setDocuments(nextDocuments);
      if (!selectedDocument && nextDocuments.length > 0) {
        setSelectedDocument(nextDocuments[0]);
      }
    } catch (error: any) {
      toast({
        title: "שגיאה בטעינת מסמכים",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingList(false);
    }
  }, [selectedDocument, toast]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  // Saving happens in the background (Document Server → relay → cloud), so
  // the app only sees the new version/saved_at by re-reading the list. Poll
  // quietly while a document is open to keep the header and badges fresh.
  useEffect(() => {
    if (!selectedDocument) return;
    const interval = setInterval(async () => {
      try {
        setDocuments(await listOnlyOfficeDocuments());
      } catch {
        // Silent background refresh; the manual refresh button reports errors.
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [selectedDocument?.id]);

  // Freshest metadata for the open document (saved_at/version update as
  // background saves land) without remounting the editor, whose key must
  // stay tied to the document_key it was opened with.
  const displayDocument = useMemo(
    () => documents.find((item) => item.id === selectedDocument?.id) ?? selectedDocument,
    [documents, selectedDocument],
  );

  const openDocument = useCallback(
    async (document: OnlyOfficeDocument) => {
      setSelectedDocument(document);
      setEditorError(null);
      setIsOpening(true);
      try {
        const payload = await getOnlyOfficeEditorConfig(document.id);
        setEditorPayload(payload);
      } catch (error: any) {
        setEditorPayload(null);
        setEditorError(error.message);
      } finally {
        setIsOpening(false);
      }
    },
    [],
  );

  const handleCreateBlank = async () => {
    setIsCreating(true);
    try {
      const document = await createBlankOnlyOfficeDocument(title);
      setDocuments((prev) => [document, ...prev]);
      setTitle("מסמך חדש");
      await openDocument(document);
      toast({ title: "מסמך חדש נוצר" });
    } catch (error: any) {
      toast({
        title: "שגיאה ביצירת מסמך",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!isOnlyOfficeSupported(file.name)) {
      toast({
        title: "קובץ לא נתמך",
        description: "אפשר להעלות doc/docx, xls/xlsx, ppt/pptx או pdf.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const document = await uploadOnlyOfficeDocument(file);
      setDocuments((prev) => [document, ...prev]);
      await openDocument(document);
      toast({ title: "הקובץ הועלה ונפתח לעריכה" });
    } catch (error: any) {
      toast({
        title: "שגיאה בהעלאה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (document: OnlyOfficeDocument) => {
    try {
      const url = await createOnlyOfficeDownloadUrl(document);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error: any) {
      toast({
        title: "שגיאה בהורדה",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (document: OnlyOfficeDocument) => {
    if (!confirm(`למחוק את "${document.title}"?`)) return;
    try {
      await deleteOnlyOfficeDocument(document);
      setDocuments((prev) => prev.filter((item) => item.id !== document.id));
      if (selectedDocument?.id === document.id) {
        setSelectedDocument(null);
        setEditorPayload(null);
      }
      toast({ title: "המסמך נמחק" });
    } catch (error: any) {
      toast({
        title: "שגיאה במחיקה",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const editorKey = useMemo(() => {
    if (!selectedDocument || !editorPayload) return "empty";
    return `${selectedDocument.id}-${selectedDocument.document_key}-${selectedDocument.version}`;
  }, [editorPayload, selectedDocument]);

  return (
    <AppLayout title="עורך OnlyOffice">
      <div className="h-[calc(100svh-7rem)] min-h-[620px] grid grid-cols-[320px_minmax(0,1fr)] gap-4" dir="rtl">
        <aside className="min-h-0 rounded-lg border bg-background flex flex-col">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">מסמכי Office</h2>
                <p className="text-xs text-muted-foreground">MVP לעריכה, עימוד והדפסה</p>
              </div>
              <Button variant="outline" size="icon" onClick={loadDocuments} disabled={isLoadingList}>
                <RefreshCw className={cn("h-4 w-4", isLoadingList && "animate-spin")} />
              </Button>
            </div>

            <div className="space-y-2">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="שם מסמך חדש" />
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleCreateBlank} disabled={isCreating}>
                  {isCreating ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Plus className="h-4 w-4 ml-2" />}
                  חדש
                </Button>
                <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Upload className="h-4 w-4 ml-2" />}
                  העלה
                </Button>
              </div>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf"
                onChange={handleUpload}
              />
            </div>
          </div>

          <Separator />

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isLoadingList ? (
                <div className="py-8 flex items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin ml-2" />
                  טוען מסמכים
                </div>
              ) : documents.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-60" />
                  <p className="text-sm">אין עדיין מסמכים</p>
                </div>
              ) : (
                documents.map((document) => (
                  <button
                    key={document.id}
                    onClick={() => openDocument(document)}
                    className={cn(
                      "w-full rounded-md p-3 text-right transition-colors hover:bg-accent",
                      selectedDocument?.id === document.id && "bg-accent",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-1 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{document.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{document.file_name}</div>
                        <div className="mt-2 flex items-center gap-1 flex-wrap">
                          <Badge variant="secondary">{document.file_type.toUpperCase()}</Badge>
                          <Badge variant="outline">v{document.version}</Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {formatOfficeFileSize(document.size_bytes)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </aside>

        <section className="min-w-0 min-h-0 rounded-lg border bg-background overflow-hidden flex flex-col">
          <div className="h-14 px-4 border-b flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <div className="font-semibold truncate">
                {displayDocument ? displayDocument.title : "בחר מסמך לעריכה"}
              </div>
              {displayDocument && (
                <div className="text-xs text-muted-foreground truncate">
                  נשמר: {formatDate(displayDocument.saved_at)} · עודכן: {formatDate(displayDocument.updated_at)}
                  {" · "}גרסה {displayDocument.version}
                </div>
              )}
            </div>
            {selectedDocument && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 ml-1" />
                  הדפסה
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownload(selectedDocument)}>
                  <Download className="h-4 w-4 ml-1" />
                  הורדה
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleDelete(selectedDocument)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 bg-muted/20">
            {isOpening ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin ml-2" />
                פותח את OnlyOffice
              </div>
            ) : editorError ? (
              <div className="h-full p-6">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>OnlyOffice עדיין לא מוכן</AlertTitle>
                  <AlertDescription className="leading-7">
                    {editorError}
                    <br />
                    ודא ש־Document Server רץ וש־Supabase secret בשם
                    {" "}
                    <code>ONLYOFFICE_DOCUMENT_SERVER_URL</code>
                    {" "}
                    מוגדר.
                  </AlertDescription>
                </Alert>
              </div>
            ) : editorPayload && selectedDocument ? (
              <OnlyOfficeEditorHost
                key={editorKey}
                documentServerUrl={editorPayload.documentServerUrl}
                config={editorPayload.config}
                onError={setEditorError}
              />
            ) : (
              <div className="h-full flex items-center justify-center p-6">
                <Card className="max-w-md w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      התחלה מהירה
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground leading-7">
                    <p>צור מסמך DOCX חדש או העלה קובץ Office קיים. אחרי ש־Document Server מוגדר, העורך ייפתח כאן לעריכה מלאה.</p>
                    <p>ההדפסה והעימוד מתבצעים בתוך OnlyOffice. השמירה חוזרת ל־Supabase דרך callback.</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
