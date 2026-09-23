// מספור כותרות (כמו "מספור כותרות" ב-Word): כותרת נשארת כותרת (גודל, צבע, הדגשה)
// ומקבלת מספר רץ לאורך כל המסמך — "1. העבודה תכלול", "2. שכר טרחה" — גם כשיש
// ביניהן פסקאות. בעבר כפתור המספור הפך כותרת לפסקה בתוך רשימה ואיבד את העיצוב.
// המספור עצמו מחושב ב-CSS counters (docTypography.ts); בהדפסה הוא הופך לטקסט.
import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    headingNumbering: {
      /** מדליק/מכבה מספור לכל הכותרות שבבחירה */
      toggleHeadingNumbering: () => ReturnType;
    };
  }
}

/** האם הבחירה נמצאת כולה בכותרות (ולכן כפתור המספור צריך למספר כותרות). */
export function selectionIsHeadingsOnly(editor: Editor): boolean {
  const { from, to } = editor.state.selection;
  let sawHeading = false;
  let sawOther = false;
  editor.state.doc.nodesBetween(from, to, (node) => {
    if (!node.isTextblock) return true;
    if (node.type.name === "heading") sawHeading = true;
    else sawOther = true;
    return false;
  });
  return sawHeading && !sawOther;
}

export function isHeadingNumberingActive(editor: Editor): boolean {
  return editor.isActive("heading", { numbered: true });
}

export const HeadingNumbering = Extension.create({
  name: "headingNumbering",

  addGlobalAttributes() {
    return [
      {
        types: ["heading"],
        attributes: {
          numbered: {
            default: false,
            parseHTML: (element: HTMLElement) => element.getAttribute("data-numbered") === "true",
            renderHTML: (attributes: Record<string, unknown>) =>
              attributes.numbered ? { "data-numbered": "true" } : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      toggleHeadingNumbering:
        () =>
        ({ state, tr, dispatch }) => {
          const { from, to } = state.selection;
          const headings: Array<{ pos: number; numbered: boolean }> = [];
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.type.name === "heading") headings.push({ pos, numbered: Boolean(node.attrs.numbered) });
            return !node.isTextblock;
          });
          if (!headings.length) return false;
          // אם כולן כבר ממוספרות — מכבים; אחרת מדליקים לכולן
          const next = !headings.every((h) => h.numbered);
          if (dispatch) {
            headings.forEach(({ pos }) => {
              const node = tr.doc.nodeAt(pos);
              if (node) tr.setNodeMarkup(pos, undefined, { ...node.attrs, numbered: next });
            });
          }
          return true;
        },
    };
  },
});
