// מילוי לפי כותרת בתוך העורך: מציג את ערך השדה ליד כל מילה שתואמת לכותרת שדה.
// מבוצע כ-decorations בלבד — הטקסט השמור לא משתנה, ולכן החוזה נשאר כללי
// ומתמלא מחדש לכל לקוח.
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, type EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { findAutofillMatches, OBJECT_CHAR } from "../labelAutofill";
import { resolveFieldFor } from "./DynamicField";
import type { Editor } from "@tiptap/core";

export const labelAutofillKey = new PluginKey<DecorationSet>("labelAutofill");

function buildDecorations(state: EditorState, editor: Editor): DecorationSet {
  const decorations: Decoration[] = [];
  const lookup = (key: string) => resolveFieldFor((editor.storage as any).dynamicField?.resolver, key);
  // לא מסתירים ____ שהסמן נמצא בהם או צמוד אליהם — אחרת ההקלדה נכנסת לטקסט מוסתר ונעלמת
  const { from: selFrom, to: selTo } = state.selection;

  state.doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    // מחרוזת מאוחדת של הבלוק + מיפוי כל תו למיקום במסמך
    let flat = "";
    const positions: number[] = [];
    node.forEach((child, offset) => {
      const childPos = pos + 1 + offset;
      if (child.isText) {
        const text = child.text || "";
        flat += text;
        for (let i = 0; i < text.length; i++) positions.push(childPos + i);
      } else {
        flat += OBJECT_CHAR;
        positions.push(childPos);
      }
    });
    if (!flat) return false;
    const blockEnd = pos + 1 + node.content.size;
    const toPos = (index: number) => (index < positions.length ? positions[index] : blockEnd);

    findAutofillMatches(flat, lookup).forEach((match) => {
      if (match.hideTo > match.hideFrom) {
        const hideFrom = toPos(match.hideFrom);
        const hideTo = toPos(match.hideTo - 1) + 1;
        const cursorInside = selTo >= hideFrom - 1 && selFrom <= hideTo + 1;
        if (cursorInside) return;
        decorations.push(
          Decoration.inline(hideFrom, hideTo, { class: "flow-autofill-hidden" }),
        );
      }
      decorations.push(
        Decoration.widget(
          toPos(match.insertAt),
          () => {
            const span = document.createElement("span");
            span.className = "flow-autofill-value";
            span.contentEditable = "false";
            span.textContent = match.text;
            span.title = "מולא אוטומטית מפרטי הלקוח לפי כותרת השדה";
            return span;
          },
          { side: -1, key: `af:${match.insertAt}:${match.text}`, ignoreSelection: true },
        ),
      );
    });
    return false;
  });

  return DecorationSet.create(state.doc, decorations);
}

export const LabelAutofill = Extension.create({
  name: "labelAutofill",

  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin<DecorationSet>({
        key: labelAutofillKey,
        state: {
          init: (_, state) => buildDecorations(state, editor),
          apply(tr, old, _oldState, newState) {
            // מחשבים מחדש רק כשהטקסט השתנה או כשפרטי הלקוח/רשימת השדות התעדכנו
            if (
              tr.docChanged ||
              tr.selectionSet ||
              tr.getMeta("dynamicFieldResolverChanged") ||
              tr.getMeta(labelAutofillKey)
            ) {
              return buildDecorations(newState, editor);
            }
            return old;
          },
        },
        props: {
          decorations(state) {
            return labelAutofillKey.getState(state);
          },
        },
      }),
    ];
  },
});
