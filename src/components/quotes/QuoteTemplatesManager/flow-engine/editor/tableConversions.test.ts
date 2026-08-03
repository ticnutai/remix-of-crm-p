import { describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { convertCurrentTableToText, convertSelectionToTable } from "./tableConversions";

function createEditor(content: string) {
  return new Editor({
    extensions: [StarterKit, Table, TableRow, TableHeader, TableCell],
    content,
  });
}

describe("table conversions", () => {
  it("converts selected paragraphs to an editable table and preserves marks", () => {
    const editor = createEditor("<p><strong>ראשון</strong></p><p><em>שני</em></p>");
    editor.commands.setTextSelection({ from: 1, to: editor.state.doc.content.size - 1 });

    expect(convertSelectionToTable(editor, 2)).toBe(true);
    expect(editor.getHTML()).toContain("<table");
    expect(editor.getHTML()).toContain("<strong>ראשון</strong>");
    expect(editor.getHTML()).toContain("<em>שני</em>");
  });

  it("converts a table back to paragraphs while preserving cell formatting", () => {
    const editor = createEditor("<table><tbody><tr><td><p><strong>א</strong></p></td><td><p><em>ב</em></p></td></tr></tbody></table>");
    editor.commands.setTextSelection(3);

    expect(convertCurrentTableToText(editor)).toBe(true);
    expect(editor.getHTML()).not.toContain("<table");
    expect(editor.getHTML()).toContain("<strong>א</strong>");
    expect(editor.getHTML()).toContain("<em>ב</em>");
    expect(editor.getText()).toContain("א | ב");
  });
});
