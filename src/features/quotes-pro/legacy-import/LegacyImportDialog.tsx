// Quotes Pro — דיאלוג ייבוא מהתבניות הישנות
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  listLegacyTemplates,
  importLegacyTemplate,
  type LegacyTemplateSummary,
} from "./importFromLegacy";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

export function LegacyImportDialog({ open, onOpenChange, onDone }: Props) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<LegacyTemplateSummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelected(new Set());
    listLegacyTemplates()
      .then(setTemplates)
      .catch((e) =>
        toast({ title: "שגיאה בטעינת תבניות ישנות", description: e.message, variant: "destructive" }),
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    let ok = 0;
    let fail = 0;
    for (const id of selected) {
      try {
        await importLegacyTemplate(id);
        ok++;
      } catch {
        fail++;
      }
    }
    setImporting(false);
    toast({
      title: "הייבוא הושלם",
      description: `${ok} יובאו${fail ? `, ${fail} נכשלו` : ""}`,
    });
    onDone();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>ייבוא מהתבניות הישנות</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          בחר תבניות מהמערכת הישנה. הן יומרו לבלוקים ויתווספו כהצעות חדשות (הישנות לא ישתנו).
        </p>

        <div className="max-h-80 overflow-y-auto space-y-1 border rounded-md p-2">
          {loading ? (
            <div className="text-center py-6">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-6">אין תבניות ישנות</div>
          ) : (
            templates.map((t) => (
              <label
                key={t.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
              >
                <Checkbox checked={selected.has(t.id)} onCheckedChange={() => toggle(t.id)} />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{t.name || "ללא שם"}</div>
                  {t.description && (
                    <div className="text-xs text-muted-foreground truncate">{t.description}</div>
                  )}
                </div>
              </label>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || selected.size === 0}
            className="bg-[#d8ac27] hover:bg-[#c49b22] text-white"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Download className="h-4 w-4 ml-1" />}
            ייבא {selected.size > 0 ? `(${selected.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
