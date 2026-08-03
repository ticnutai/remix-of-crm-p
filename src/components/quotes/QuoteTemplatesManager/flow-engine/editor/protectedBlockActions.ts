import type { Editor } from "@tiptap/react";
import { Fragment, type Node as ProseMirrorNode } from "@tiptap/pm/model";
import { NodeSelection } from "@tiptap/pm/state";

const PROTECTED_NODE_TYPES = new Set(["paymentsBlock", "computedBlock"]);

type ProtectedRange = {
  from: number;
  to: number;
  node: ProseMirrorNode;
};

export function findProtectedBlock(editor: Editor): ProtectedRange | null {
  const { state } = editor;
  const { selection } = state;

  if (selection instanceof NodeSelection && PROTECTED_NODE_TYPES.has(selection.node.type.name)) {
    return { from: selection.from, to: selection.to, node: selection.node };
  }

  const $from = selection.$from;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    if (!PROTECTED_NODE_TYPES.has(node.type.name)) continue;
    const from = $from.before(depth);
    return { from, to: from + node.nodeSize, node };
  }

  const candidates = [
    { node: $from.nodeAfter, from: selection.from },
    { node: $from.nodeBefore, from: selection.from - ($from.nodeBefore?.nodeSize || 0) },
  ];
  for (const candidate of candidates) {
    if (candidate.node && PROTECTED_NODE_TYPES.has(candidate.node.type.name)) {
      return {
        from: candidate.from,
        to: candidate.from + candidate.node.nodeSize,
        node: candidate.node,
      };
    }
  }

  return null;
}

/** Remove only the protected wrapper, preserving its table/text as normal editable content. */
export function detachProtectedBlock(editor: Editor): boolean {
  const range = findProtectedBlock(editor);
  if (!range) return false;
  const tr = editor.state.tr.replaceWith(range.from, range.to, Fragment.from(range.node.content));
  editor.view.dispatch(tr.scrollIntoView());
  editor.commands.focus();
  return true;
}

export function deleteProtectedBlock(editor: Editor): boolean {
  const range = findProtectedBlock(editor);
  if (!range) return false;
  editor.view.dispatch(editor.state.tr.delete(range.from, range.to).scrollIntoView());
  editor.commands.focus();
  return true;
}
