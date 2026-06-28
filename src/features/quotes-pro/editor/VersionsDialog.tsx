// Quotes Pro — גרסאות מסמך: שמירת snapshot, רשימה, שחזור
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { History, Save, RotateCcw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { listVersions, saveVersion } from "../data/api";
import type { QPDocument, QPVersion } from "../model/types";

interface Props {
  doc: QPDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: (snapshot: Partial<QPDocument>) => void;
}

export function VersionsDialog({ doc, open, onOpenChange, onRestore }: Props) {
  const { toast } = useToast();
  const [versions, setVersions] = useState<QPVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState("");

  const refresh = async () => {
    if (!doc) return;
    setLoading(true);
    try {
      setVersions(await listVersions(doc.id));
    } catch (e: any) {
      toast({ title: "שגיאה בטעינת גרסאות", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doc?.id]);

  const handleSave = async () => {
    if (!doc) return;
    setLoading(true);
    try {
      const { id, created_at, updated_at, ...snapshot } = doc;
      await saveVersion(doc.id, snapshot, label.trim() || "גרסה");
      setLabel("");
      toast({ title: "הגרסה נשמרה" });
      await refresh();
    } catch (e: any) {
      toast({ title: "שגיאה בשמירת גרסה", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            גרסאות
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="תיאור הגרסה (אופציונלי)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <Button onClick={handleSave} disabled={loading} className="bg-[#d8ac27] hover:bg-[#c49b22] text-white shrink-0">
            <Save className="h-4 w-4 ml-1" />
            שמור גרסה
          </Button>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2 mt-2">
          {loading && versions.length === 0 ? (
            <div className="text-center py-6">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-6">אין גרסאות שמורות עדיין</div>
          ) : (
            versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    #{v.version_number} · {v.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(v.created_at).toLocaleString("he-IL")}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm("לשחזר גרסה זו? השינויים הנוכחיים שלא נשמרו כגרסה יידרסו.")) {
                      onRestore(v.snapshot);
                      onOpenChange(false);
                      toast({ title: "הגרסה שוחזרה" });
                    }
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5 ml-1" />
                  שחזר
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
