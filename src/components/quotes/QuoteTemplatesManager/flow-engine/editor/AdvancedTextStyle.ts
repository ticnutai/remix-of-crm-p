// AdvancedTextStyle — מרחיב את TextStyle עם font-size, letter/word spacing וגרדיאנט טקסט
import { TextStyle } from "@tiptap/extension-text-style";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    advancedTextStyle: {
      setFontSize: (size: string | null) => ReturnType;
      setLetterSpacing: (val: string | null) => ReturnType;
      setWordSpacing: (val: string | null) => ReturnType;
      setGradient: (css: string | null) => ReturnType;
    };
  }
}

const AdvancedTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.fontSize || null,
        renderHTML: (attrs: any) =>
          attrs.fontSize ? { style: `font-size:${attrs.fontSize}` } : {},
      },
      letterSpacing: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.letterSpacing || null,
        renderHTML: (attrs: any) =>
          attrs.letterSpacing
            ? { style: `letter-spacing:${attrs.letterSpacing}` }
            : {},
      },
      wordSpacing: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.wordSpacing || null,
        renderHTML: (attrs: any) =>
          attrs.wordSpacing
            ? { style: `word-spacing:${attrs.wordSpacing}` }
            : {},
      },
      gradient: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-gradient"),
        renderHTML: (attrs: any) =>
          attrs.gradient
            ? {
                "data-gradient": attrs.gradient,
                style: `background:${attrs.gradient};-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent`,
              }
            : {},
      },
    };
  },
  addCommands() {
    const parent = this.parent?.() as any;
    return {
      ...parent,
      setFontSize:
        (size: string | null) =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { fontSize: size }).run(),
      setLetterSpacing:
        (val: string | null) =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { letterSpacing: val }).run(),
      setWordSpacing:
        (val: string | null) =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { wordSpacing: val }).run(),
      setGradient:
        (css: string | null) =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { gradient: css }).run(),
    };
  },
});

export default AdvancedTextStyle;
