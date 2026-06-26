// Inline atom node לשדות דינמיים {{customer.name}}
// נשמר ל-HTML כ-<span data-field="key">{{key}}</span>, וה-renderer הקיים יודע להמיר.

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
    };
  },

  parseHTML() {
    return [{ tag: "span[data-field]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const key = HTMLAttributes.key || HTMLAttributes["data-field"] || "";
    const label = HTMLAttributes.label || key;
    return [
      "span",
      mergeAttributes(
        {
          "data-field": key,
          class:
            "inline-block px-2 py-0.5 mx-0.5 rounded text-xs font-medium bg-accent/20 text-accent-foreground border border-accent/40",
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
