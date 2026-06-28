// Inline atom node לשדות דינמיים {{customer.name}}
// נשמר ל-HTML כ-<span data-field="key">{{key}}</span>, וה-renderer הקיים יודע להמיר.
// בנוסף: אם הוגדר resolver (פרטי פרויקט) — נציג את הערך בפועל לעורך,
// כדי שהמשתמש יראה את שם הלקוח / הגוש / החלקה במקום הצ׳יפ.

import { Node, mergeAttributes } from "@tiptap/core";

export interface DynamicFieldOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    dynamicField: {
      insertDynamicField: (key: string, label?: string) => ReturnType;
    };
  }
}

// ===== Global resolver — מאפשר ל-FlowEditor להזין את פרטי הפרויקט =====
type FieldResolver = (key: string) => string | null | undefined;
let activeResolver: FieldResolver | null = null;
export function setFieldResolver(fn: FieldResolver | null) {
  activeResolver = fn;
}
export function resolveField(key: string): string {
  if (!activeResolver) return "";
  const v = activeResolver(key);
  return v == null ? "" : String(v);
}

export const DynamicField = Node.create<DynamicFieldOptions>({
  name: "dynamicField",
  inline: true,
  group: "inline",
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      key: { default: "" },
      label: { default: null },
      // snapshot של הערך שנפתר — נשמר ב-HTML כ-data-resolved-value
      // כדי שהמילוי יישרד רענון/החלפת טאב גם אם אין resolver פעיל.
      resolvedValue: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-resolved-value"),
        renderHTML: (attrs: Record<string, unknown>) => {
          const v = attrs.resolvedValue;
          if (v == null || v === "") return {};
          return { "data-resolved-value": String(v) };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-field]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const key = String(HTMLAttributes.key || HTMLAttributes["data-field"] || "");
    const label = String(HTMLAttributes.label || key);
    const live = resolveField(key);
    const snapshot =
      HTMLAttributes.resolvedValue != null
        ? String(HTMLAttributes.resolvedValue)
        : (HTMLAttributes["data-resolved-value"] as string | undefined) || "";
    const value = live !== "" ? live : snapshot;
    const hasValue = value !== "";
    if (hasValue) {
      // נפתר → טקסט רגיל לחלוטין, ללא רקע/מסגרת/צ'יפ
      return [
        "span",
        mergeAttributes(
          {
            "data-field": key,
            "data-label": label,
            "data-resolved": "true",
            "data-resolved-value": value,
            title: `${label}: ${value}`,
            class: "flow-field-resolved",
          },
          this.options.HTMLAttributes,
        ),
        value,
      ];
    }
    // אין ערך עדיין → צ'יפ דיסקרטי כדי לסמן שזה placeholder
    return [
      "span",
      mergeAttributes(
        {
          "data-field": key,
          "data-label": label,
          title: `שדה דינמי: {{${label}}} — ימולא מ"פרטי פרויקט"`,
          class:
            "inline-block px-2 py-0.5 mx-0.5 rounded text-xs font-medium bg-accent/20 text-accent-foreground border border-accent/40 border-dashed",
          contenteditable: "false",
        },
        this.options.HTMLAttributes,
      ),
      `{{${label}}}`,
    ];
  },

  addCommands() {
    return {
      insertDynamicField:
        (key: string, label?: string) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { key, label: label || key },
          }),
    };
  },
});

export default DynamicField;
