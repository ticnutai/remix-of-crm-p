// עמוד צפייה ציבורי בהצעת מחיר PRO (לינק ללקוח, ללא התחברות)
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Printer } from "lucide-react";
import { getPublicDocument } from "@/features/quotes-pro/data/api";
import { composeDocumentHtml } from "@/features/quotes-pro/render/composeDocument";
import { printDocument } from "@/features/quotes-pro/preview/exportPdf";
import type { QPDocument } from "@/features/quotes-pro/model/types";

export default function QuotesProPublicView() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<QPDocument | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "notfound">("loading");

  useEffect(() => {
    if (!id) return;
    getPublicDocument(id)
      .then((d) => {
        if (d && d.is_public) {
          setDoc(d);
          setState("ok");
        } else {
          setState("notfound");
        }
      })
      .catch(() => setState("notfound"));
  }, [id]);

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-[#d8ac27]" />
      </div>
    );
  }

  if (state === "notfound" || !doc) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 text-center px-4" dir="rtl">
        <h1 className="text-xl font-bold mb-2">ההצעה אינה זמינה</h1>
        <p className="text-muted-foreground">ייתכן שהקישור שגוי או שהשיתוף בוטל.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-2 flex items-center justify-between">
        <span className="font-semibold truncate">{doc.name}</span>
        <button
          onClick={() => printDocument(doc)}
          className="inline-flex items-center gap-1 bg-[#d8ac27] hover:bg-[#c49b22] text-white text-sm px-3 py-1.5 rounded-md"
        >
          <Printer className="h-4 w-4" />
          הורד PDF
        </button>
      </div>
      <iframe
        title={doc.name}
        srcDoc={composeDocumentHtml(doc)}
        className="w-full bg-white"
        style={{ height: "calc(100vh - 49px)" }}
      />
    </div>
  );
}
