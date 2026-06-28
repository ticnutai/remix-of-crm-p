// Quotes Pro — ייצוא/הדפסה ל-PDF דרך חלון הדפסה של הדפדפן
import type { QPDocument } from "../model/types";
import { composeDocumentHtml } from "../render/composeDocument";

/** פותח חלון הדפסה עם המסמך המורכב (המשתמש בוחר "שמור כ-PDF"). */
export function printDocument(doc: QPDocument): void {
  const html = composeDocumentHtml(doc);
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) {
    alert("חלון ההדפסה נחסם. אפשר חלונות קופצים לאתר זה.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  // המתנה לטעינת תמונות/גופנים לפני הדפסה
  const triggerPrint = () => {
    w.focus();
    w.print();
  };
  if (w.document.readyState === "complete") {
    setTimeout(triggerPrint, 300);
  } else {
    w.onload = () => setTimeout(triggerPrint, 300);
  }
}

/** הורדת ה-HTML של המסמך כקובץ עצמאי. */
export function downloadHtml(doc: QPDocument): void {
  const html = composeDocumentHtml(doc);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.name || "quote"}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
