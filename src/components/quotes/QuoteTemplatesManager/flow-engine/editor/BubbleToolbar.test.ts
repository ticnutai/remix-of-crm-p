import { afterEach, describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { getAdjacentListType } from "./BubbleToolbar";

describe("normal text list alignment", () => {
  let editor: Editor | null = null;

  afterEach(() => {
    editor?.destroy();
    editor = null;
  });

  it("detects a top-level paragraph that interrupts a bullet list", () => {
    editor = new Editor({
      extensions: [StarterKit],
      content: "<ul><li><p>לפני</p></li></ul><p>קטע שנבחר</p><ul><li><p>אחרי</p></li></ul>",
    });

    let paragraphPosition = -1;
    let paragraphSize = 0;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "paragraph" && node.textContent === "קטע שנבחר") {
        paragraphPosition = pos;
        paragraphSize = node.nodeSize;
        return false;
      }
      return true;
    });

    const range = {
      from: paragraphPosition + 1,
      to: paragraphPosition + paragraphSize - 1,
    };
    expect(getAdjacentListType(editor, range)).toBe("bulletList");

    editor
      .chain()
      .setTextSelection(range)
      .clearNodes()
      .toggleBulletList()
      .run();

    const targetParents: string[] = [];
    editor.state.doc.descendants((node, pos, parent) => {
      if (node.type.name === "paragraph" && node.textContent === "קטע שנבחר") {
        targetParents.push(parent?.type.name ?? "");
      }
      return true;
    });
    expect(targetParents).toEqual(["listItem"]);
  });

  it("does not re-wrap text that is already inside a list", () => {
    editor = new Editor({
      extensions: [StarterKit],
      content: "<ul><li><p>כבר ברשימה</p></li></ul>",
    });

    expect(getAdjacentListType(editor, { from: 3, to: 8 })).toBeNull();
  });
});
