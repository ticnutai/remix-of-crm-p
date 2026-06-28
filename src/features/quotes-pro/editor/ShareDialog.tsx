// Quotes Pro — שיתוף הצעה: לינק ציבורי + וואטסאפ
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Check, MessageCircle, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { enableSharing, disableSharing } from "../data/api";
import type { QPDocument } from "../model/types";

interface Props {
  doc: QPDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: (patch: Partial<QPDocument>) => void;
}

export function ShareDialog({ doc, open, onOpenChange, onChanged }: Props) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!doc) return null;

  const token = doc.share_token || "";
  const link = `${window.location.origin}/quotes-pro/view/${doc.id}${token ? `?t=${token}` : ""}`;
  const isPublic = !!doc.is_public;

  const togglePublic = async (v: boolean) => {
    setBusy(true);
    try {
      if (v) {
        const t = await enableSharing(doc.id);
        onChanged({ is_public: true, share_token: t });
      } else {
        await disableSharing(doc.id);
        onChanged({ is_public: false });
      }
    } catch (e: any) {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast({ title: "הקישור הועתק" });
  };

  const shareWhatsApp = () => {
    const msg = `הצעת מחיר: ${doc.name}\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>שיתוף ההצעה</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <Label className="text-sm font-medium">קישור ציבורי</Label>
            <p className="text-xs text-muted-foreground">
              {isPublic ? "כל מי שיש לו את הקישור יכול לצפות" : "השיתוף כבוי — ההצעה פרטית"}
            </p>
          </div>
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Switch checked={isPublic} onCheckedChange={togglePublic} />
          )}
        </div>

        {isPublic && (
          <>
            <div className="flex gap-2">
              <Input value={link} readOnly className="text-xs" onFocus={(e) => e.target.select()} />
              <Button size="sm" variant="outline" onClick={copyLink} className="shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={shareWhatsApp}
                className="flex-1 bg-[#25D366] hover:bg-[#1da851] text-white"
              >
                <MessageCircle className="h-4 w-4 ml-1" />
                שלח בוואטסאפ
              </Button>
              <Button variant="outline" onClick={() => window.open(link, "_blank")}>
                <ExternalLink className="h-4 w-4 ml-1" />
                פתח
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
