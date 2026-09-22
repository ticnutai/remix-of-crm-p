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
export function getFieldResolver(): FieldResolver | null {
  return activeResolver;
}

export function hasFieldResolver(): boolean {
  return activeResolver !== null;
}

/**
 * resolver לכל עורך בנפרד (editor.storage.dynamicField.resolver). resolver גלובלי יחיד
 * נמחק כשעורך אחר (למשל תצוגת A4) נסגר אחרי שהעורך החדש כבר הגדיר אותו.
 */
export function resolveFieldFor(storageResolver: FieldResolver | null | undefined, key: string): string {
  const resolver = storageResolver ?? activeResolver;
  if (!resolver) return "";
  const v = resolver(key);
  return v == null ? "" : String(v);
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

  addStorage() {
    return { resolver: null as FieldResolver | null };
  },

  addAttributes() {
    return {
      key: {
        default: "",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-field") || "",
        renderHTML: (attrs: Record<string, unknown>) => ({ "data-field": String(attrs.key || "") }),
      },
      label: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-label"),
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.label ? { "data-label": String(attrs.label) } : {},
      },
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
    const label = String(HTMLAttributes.label || HTMLAttributes["data-label"] || key);
    const storageResolver = (this as any).storage?.resolver as FieldResolver | null | undefined;
    const live = resolveFieldFor(storageResolver, key);
    const snapshot =
      HTMLAttributes.resolvedValue != null
        ? String(HTMLAttributes.resolvedValue)
        : (HTMLAttributes["data-resolved-value"] as string | undefined) || "";
    // כשיש resolver פעיל (עורך עם פרטי פרויקט) — הערך החי הוא האמת. snapshot משמש רק
    // כשאין resolver, אחרת ערך של לקוח קודם היה נשאר אחרי ניקוי/החלפת לקוח.
    const resolverActive = Boolean(storageResolver) || hasFieldResolver();
    const value = resolverActive ? live : live !== "" ? live : snapshot;
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
            ...(value.includes("\n") ? { style: "white-space: pre-line" } : {}),
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
