import React, { useEffect, useState } from "react";
import { Loader2, Search, User, FileText, ListTree } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { OnlyOfficeDocument } from "@/services/onlyofficeService";
import {
  MERGE_FIELDS,
  MergeClient,
  MergeQuote,
  MergeTemplate,
  generateQuoteDocumentFromTemplate,
  listMergeClients,
  listMergeQuotes,
  listMergeTemplates,
  loadTemplateAsMergeQuote,
} from "@/services/onlyofficeMergeService";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateDocument: OnlyOfficeDocument | null;
  onCreated: (document: OnlyOfficeDocument) => void;
}

export function CreateQuoteFromTemplateDialog({
  open,
  onOpenChange,
  templateDocument,
  onCreated,
}: Props) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<MergeClient[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<MergeClient | null>(null);
  const [quotes, setQuotes] = useState<MergeQuote[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("none");
  const [dataSource, setDataSource] = useState<"quote" | "template">("quote");
  const [templates, setTemplates] = useState<MergeTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsLoadingClients(true);
    const timer = setTimeout(() => {
      listMergeClients(search)
        .then(setClients)
        .catch((error: any) =>
          toast({ title: "שגיאה בטעינת לקוחות", description: error.message, variant: "destructive" }),
        )
        .finally(() => setIsLoadingClients(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [open, search, toast]);

  useEffect(() => {
    setQuotes([]);
    setSelectedQuoteId("none");
    if (!selectedClient) return;
    listMergeQuotes(selectedClient.id)
      .then((next) => {
        setQuotes(next);
        if (next.length > 0) setSelectedQuoteId(next[0].id);
      })
      .catch((error: any) =>
        toast({ title: "שגיאה בטעינת הצעות", description: error.message, variant: "destructive" }),
      );
  }, [selectedClient, toast]);

  useEffect(() => {
    if (!open) return;
    listMergeTemplates()
      .then((next) => {
        setTemplates(next);
        if (next.length > 0) setSelectedTemplateId((prev) => prev || next[0].id);
      })
      .catch(() => {
        // Non-fatal — the template source just stays empty.
      });
  }, [open]);

  const handleGenerate = async () => {
    if (!templateDocument || !selectedClient) return;
    setIsGenerating(true);
    try {
      let quote: MergeQuote | null = null;
      if (dataSource === "template") {
        if (selectedTemplateId) quote = await loadTemplateAsMergeQuote(selectedTemplateId);
      } else {
        quote = quotes.find((q) => q.id === selectedQuoteId) || null;
      }
      const document = await generateQuoteDocumentFromTemplate(
        templateDocument,
        selectedClient,
        quote,
      );
      toast({
        title: "המסמך נוצר",
        description: `"${document.title}" נוסף לרשימת המסמכים ונפתח לעריכה`,
      });
      onOpenChange(false);
      onCreated(document);
    } catch (error: any) {
      toast({
        title: "שגיאה ביצירת המסמך",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            יצירת הצעה מתבנית
          </DialogTitle>
          <DialogDescription>
            נתוני הלקוח וההצעה יוזרקו למצייני המקום שבמסמך
            {templateDocument ? ` "${templateDocument.title}"` : ""} וייווצר מסמך חדש.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לקוח לפי שם..."
              className="pr-9"
            />
          </div>

          <ScrollArea className="h-44 rounded-md border">
            {isLoadingClients ? (
              <div className="flex h-full items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="ml-2 h-4 w-4 animate-spin" /> טוען לקוחות
              </div>
            ) : clients.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">לא נמצאו לקוחות</div>
            ) : (
              <div className="p-1">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-right text-sm transition-colors hover:bg-accent",
                      selectedClient?.id === client.id && "bg-accent font-medium",
                    )}
                  >
                    <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{client.name}</span>
                    {client.phone && (
                      <span className="shrink-0 text-xs text-muted-foreground" dir="ltr">
                        {client.phone}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {selectedClient && (
            <div className="space-y-2">
              <div className="text-sm font-medium">מקור נתוני הסכומים והתשלומים</div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={dataSource === "quote" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDataSource("quote")}
                >
                  הצעה קיימת
                </Button>
                <Button
                  type="button"
                  variant={dataSource === "template" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDataSource("template")}
                >
                  תבנית הצעת מחיר
                </Button>
              </div>

              {dataSource === "quote" ? (
                <Select value={selectedQuoteId} onValueChange={setSelectedQuoteId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">בלי הצעה — רק פרטי לקוח</SelectItem>
                    {quotes.map((quote) => (
                      <SelectItem key={quote.id} value={quote.id}>
                        {quote.quote_number} · {quote.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר תבנית" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
                <ListTree className="ml-1 h-4 w-4" />
                אילו שדות אפשר לכתוב בתבנית?
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="h-36 rounded-md border bg-muted/30 p-2">
                <div className="space-y-1 text-xs leading-6">
                  {MERGE_FIELDS.map((field) => (
                    <div key={field.tag} className="flex items-baseline justify-between gap-2">
                      <code className="shrink-0 rounded bg-background px-1">{field.tag}</code>
                      <span className="truncate text-muted-foreground">{field.label}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleGenerate} disabled={!selectedClient || isGenerating}>
            {isGenerating && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            צור מסמך ללקוח
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
