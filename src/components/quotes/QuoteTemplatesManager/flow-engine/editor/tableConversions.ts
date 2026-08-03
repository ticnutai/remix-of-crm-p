import type { Editor } from "@tiptap/core";
import { Fragment, type Node as ProseMirrorNode } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";

type NodeRange = { from: number; to: number; node: ProseMirrorNode };

function selectedTable(editor: Editor): NodeRange | null {
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    if (node.type.name !== "table") continue;
    return {
      node,
      from: $from.before(depth),
      to: $from.after(depth),
    };
  }
  return null;
}

function inlineContent(node: ProseMirrorNode, editor: Editor): ProseMirrorNode[] {
  const paragraph = editor.schema.nodes.paragraph;
  const parts: ProseMirrorNode[] = [];
  node.descendants((child) => {
    if (child.type === paragraph) {
      child.content.forEach((inline) => parts.push(inline));
      return false;
    }
    return true;
  });
  return parts;
}

/** Convert the table containing the cursor to ordinary paragraphs, preserving inline marks. */
export function convertCurrentTableToText(editor: Editor): boolean {
  const table = selectedTable(editor);
  if (!table) return false;
  const paragraph = editor.schema.nodes.paragraph;
  const paragraphs: ProseMirrorNode[] = [];

  table.node.forEach((row) => {
    const rowContent: ProseMirrorNode[] = [];
    row.forEach((cell, _offset, cellIndex) => {
      if (cellIndex > 0) rowContent.push(editor.schema.text(" | "));
      rowContent.push(...inlineContent(cell, editor));
    });
    paragraphs.push(paragraph.create(null, Fragment.fromArray(rowContent)));
  });

  const tr = editor.state.tr.replaceWith(table.from, table.to, Fragment.fromArray(paragraphs));
  tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(table.from + 1, tr.doc.content.size))));
  editor.view.dispatch(tr.scrollIntoView());
  editor.commands.focus();
  return true;
}

function selectedBlocks(editor: Editor): { blocks: ProseMirrorNode[]; from: number; to: number } {
  const { $from, $to } = editor.state.selection;
  const startDepth = Math.max(1, $from.depth);
  const endDepth = Math.max(1, $to.depth);
  const from = $from.before(startDepth);
  const to = $to.after(endDepth);
  const blocks: ProseMirrorNode[] = [];
  editor.state.doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isTextblock) return true;
    if (pos + node.nodeSize <= from || pos >= to) return false;
    blocks.push(node);
    return false;
  });
  return { blocks, from, to };
}

/** Convert selected text blocks to an editable table, retaining their rich inline content. */
export function convertSelectionToTable(editor: Editor, columns = 1): boolean {
  const { empty } = editor.state.selection;
  if (empty || editor.isActive("table")) return false;
  const { blocks, from, to } = selectedBlocks(editor);
  if (!blocks.length) return false;

  const safeColumns = Math.max(1, Math.min(8, Math.floor(columns)));
  const paragraph = editor.schema.nodes.paragraph;
  const cell = editor.schema.nodes.tableCell;
  const row = editor.schema.nodes.tableRow;
  const table = editor.schema.nodes.table;
  if (!paragraph || !cell || !row || !table) return false;

  const cells = blocks.map((block) => cell.create(null, paragraph.create(null, block.content)));
  const rows: ProseMirrorNode[] = [];
  for (let index = 0; index < cells.length; index += safeColumns) {
    const rowCells = cells.slice(index, index + safeColumns);
    while (rowCells.length < safeColumns) rowCells.push(cell.createAndFill()!);
    rows.push(row.create(null, Fragment.fromArray(rowCells)));
  }

  const tableNode = table.create(null, Fragment.fromArray(rows));
  const tr = editor.state.tr.replaceRangeWith(from, to, tableNode);
  tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(from + 2, tr.doc.content.size))));
  editor.view.dispatch(tr.scrollIntoView());
  editor.commands.focus();
  return true;
}
