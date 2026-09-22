// בחוזים "____" הוא מקום למילוי, לא תחביר Markdown. בלי ההרחבה הזו TipTap הופך
// "__טקסט__" לבולד ו-"_טקסט_" לנטוי תוך כדי הקלדה — ומוחק את הקווים (ולפעמים טקסט).
// ההרחבה מכניסה "_" כתו רגיל לפני שכללי ה-input של bold/italic רצים.
// קיצורי הכוכביות (**בולד**, *נטוי*) ממשיכים לעבוד.
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export const PlainUnderscores = Extension.create({
  name: "plainUnderscores",
  // עדיפות גבוהה → הפלאגין רץ לפני פלאגין ה-inputRules
  priority: 1000,

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("plainUnderscores"),
        props: {
          handleTextInput(view, from, to, text) {
            if (text !== "_") return false;
            view.dispatch(view.state.tr.insertText(text, from, to));
            return true;
          },
        },
      }),
    ];
  },
});
