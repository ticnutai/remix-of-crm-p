// מילוי לפי כותרת בתוך העורך: מציג את ערך השדה ליד כל מילה שתואמת לכותרת שדה.
// מבוצע כ-decorations בלבד — הטקסט השמור לא משתנה, ולכן החוזה נשאר כללי
// ומתמלא מחדש לכל לקוח.
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, type EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { findAutofillMatches, OBJECT_CHAR } from "../labelAutofill";
import { resolveField } from "./DynamicField";

export const labelAutofillKey = new PluginKey<DecorationSet>("labelAutofill");

function buildDecorations(state: EditorState): DecorationSet {
  const decorations: Decoration[] = [];
  const lookup = (key: string) => resolveField(key);

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
        decorations.push(
          Decoration.inline(toPos(match.hideFrom), toPos(match.hideTo - 1) + 1, {
            class: "flow-autofill-hidden",
          }),
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
    return [
      new Plugin<DecorationSet>({
        key: labelAutofillKey,
        state: {
          init: (_, state) => buildDecorations(state),
          apply(tr, old, _oldState, newState) {
            // מחשבים מחדש רק כשהטקסט השתנה או כשפרטי הלקוח/רשימת השדות התעדכנו
            if (
              tr.docChanged ||
              tr.getMeta("dynamicFieldResolverChanged") ||
              tr.getMeta(labelAutofillKey)
            ) {
              return buildDecorations(newState);
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
