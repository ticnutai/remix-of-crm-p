import { Node, mergeAttributes } from "@tiptap/core";

/** A structured, calculated quote section that is visible but not text-editable. */
export const ComputedBlock = Node.create({
  name: "computedBlock",
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      kind: {
        default: "computed",
        parseHTML: (element) => element.getAttribute("data-computed-block") || "computed",
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-computed-block]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const kind = String(HTMLAttributes.kind || "computed");
    const { kind: _kind, ...rest } = HTMLAttributes;
    return [
      "div",
      mergeAttributes(rest, {
        "data-computed-block": kind,
        "data-flow-protected": "1",
        contenteditable: "false",
        class: "computed-block",
      }),
      0,
    ];
  },
});

export default ComputedBlock;
