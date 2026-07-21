import { afterEach, describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import AdvancedTextStyle from "./AdvancedTextStyle";
import { MultiSelection, applyAcrossRanges } from "./MultiSelection";

describe("applyAcrossRanges", () => {
  let editor: Editor | null = null;

  afterEach(() => {
    editor?.destroy();
    editor = null;
  });

  const createEditor = () => {
    editor = new Editor({
      extensions: [StarterKit, AdvancedTextStyle, Color, FontFamily, MultiSelection],
      content: "<p>abc def</p>",
    });
    editor.commands.setTextSelection({ from: 1, to: 4 });
    return editor;
  };

  it("applies font size only to the selected characters", () => {
    const instance = createEditor();
    applyAcrossRanges(instance, (chain) => chain.setFontSize("20px"));

    expect(instance.getHTML()).toBe(
      '<p><span style="font-size: 20px;">abc</span> def</p>',
    );
  });

  it("applies font family only to the selected characters", () => {
    const instance = createEditor();
    applyAcrossRanges(instance, (chain) => chain.setFontFamily("Arial"));

    expect(instance.getHTML()).toBe(
      '<p><span style="font-family: Arial;">abc</span> def</p>',
    );
  });

  it("applies color only to the selected characters", () => {
    const instance = createEditor();
    applyAcrossRanges(instance, (chain) => chain.setColor("#ff0000"));

    expect(instance.getHTML()).toBe(
      '<p><span style="color: rgb(255, 0, 0);">abc</span> def</p>',
    );
  });
});
