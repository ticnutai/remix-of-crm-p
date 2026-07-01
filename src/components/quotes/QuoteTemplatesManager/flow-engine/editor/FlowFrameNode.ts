// FlowFrame — Node לתמיכה במסגרות ובקאלאאוט בתוך העורך.
// שני וריאנטים: "frame" (מסגרת רגילה) ו-"callout" (הדגשה בצבע accent).
// שומר class בעת renderHTML ובעת parseHTML כדי שהעיצוב (מהערכה) יופעל.
import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    flowFrame: {
      setFlowFrame: (variant?: "frame" | "callout") => ReturnType;
      toggleFlowFrame: (variant?: "frame" | "callout") => ReturnType;
      unsetFlowFrame: () => ReturnType;
    };
  }
}

export const FlowFrame = Node.create({
  name: "flowFrame",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: "frame",
        parseHTML: (el: HTMLElement) =>
          el.getAttribute("data-variant") ||
          (el.classList.contains("flow-callout") ? "callout" : "frame"),
        renderHTML: (attrs: any) => ({ "data-variant": attrs.variant }),
      },
    };
  },

  parseHTML() {
    return [
      { tag: "div.flow-frame" },
      { tag: "div.flow-callout" },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const cls = node.attrs.variant === "callout" ? "flow-callout" : "flow-frame";
    return ["div", mergeAttributes(HTMLAttributes, { class: cls }), 0];
  },

  addCommands() {
    return {
      setFlowFrame:
        (variant = "frame") =>
        ({ commands }: any) =>
          commands.wrapIn(this.name, { variant }),
      toggleFlowFrame:
        (variant = "frame") =>
        ({ commands, editor }: any) => {
          if (editor.isActive(this.name, { variant })) {
            return commands.lift(this.name);
          }
          if (editor.isActive(this.name)) {
            // מחליף וריאנט
            return commands.updateAttributes(this.name, { variant });
          }
          return commands.wrapIn(this.name, { variant });
        },
      unsetFlowFrame:
        () =>
        ({ commands }: any) =>
          commands.lift(this.name),
    };
  },
});

export default FlowFrame;
