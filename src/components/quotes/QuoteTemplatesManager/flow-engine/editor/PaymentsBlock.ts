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

  parseHTML() {
    return [{ tag: "div[data-payments-block]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-payments-block": "1",
        class: "payments-block",
      }),
      0,
    ];
  },
});

export default PaymentsBlock;
