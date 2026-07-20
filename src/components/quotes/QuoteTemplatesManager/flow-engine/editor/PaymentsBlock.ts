// PaymentsBlock — TipTap Node שעוטף את לוח התשלומים כגוש נגרר אחד.
// מאפשר להזיז את כל מקטע התשלומים (כותרת + רשימה/טבלה) למיקום אחר במסמך,
// כולל בין עמודים, מבלי לאבד את הסנכרון עם טאב "תוכן".

import { Node, mergeAttributes } from "@tiptap/core";

export const PaymentsBlock = Node.create({
  name: "paymentsBlock",
  group: "block",
  content: "block+",
  defining: true,
  draggable: true,
  isolating: true,

  addAttributes() {
    return {
      protected: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-flow-protected") === "1",
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-payments-block]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const isProtected = Boolean(HTMLAttributes.protected);
    const { protected: _protected, ...rest } = HTMLAttributes;
    return [
      "div",
      mergeAttributes(rest, {
        "data-payments-block": "1",
        ...(isProtected ? { "data-flow-protected": "1", contenteditable: "false" } : {}),
        class: "payments-block",
      }),
      0,
    ];
  },
});

export default PaymentsBlock;
