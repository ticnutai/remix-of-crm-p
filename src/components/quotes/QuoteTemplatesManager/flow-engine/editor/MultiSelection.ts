// MultiSelection — תוסף TipTap שמאפשר בחירה מרובה של טווחים (Ctrl/Cmd+סימון)
// ומחיל עיצוב על כל הטווחים יחד (כולל הבחירה הנוכחית).
import { Extension } from "@tiptap/core";
import type { Editor, ChainedCommands } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export type ExtraRange = { from: number; to: number };

export const multiSelectionKey = new PluginKey<{
  ranges: ExtraRange[];
  deco: DecorationSet;
}>("multiSelection");

type Meta =
  | { type: "add"; range: ExtraRange }
  | { type: "clear" }
  | { type: "set"; ranges: ExtraRange[] };

export const MultiSelection = Extension.create({
  name: "multiSelection",

  addStorage() {
    return { ranges: [] as ExtraRange[] };
  },

  addProseMirrorPlugins() {
    const ext = this;
    return [
      new Plugin({
        key: multiSelectionKey,
        state: {
          init() {
            return { ranges: [] as ExtraRange[], deco: DecorationSet.empty };
          },
          apply(tr, value, _oldState, newState) {
            // map ranges through document changes
            let ranges: ExtraRange[] = value.ranges
              .map((r) => ({
                from: tr.mapping.map(r.from),
                to: tr.mapping.map(r.to),
              }))
              .filter((r) => r.from < r.to);

            const meta = tr.getMeta(multiSelectionKey) as Meta | undefined;
            if (meta?.type === "add") {
              // avoid exact duplicates
              const exists = ranges.some(
                (r) => r.from === meta.range.from && r.to === meta.range.to,
              );
              if (!exists && meta.range.from < meta.range.to) {
                ranges = [...ranges, meta.range];
              }
            } else if (meta?.type === "clear") {
              ranges = [];
            } else if (meta?.type === "set") {
              ranges = meta.ranges.filter((r) => r.from < r.to);
            }

            // sync storage so consumers can read synchronously
            ext.storage.ranges = ranges;

            const decos = ranges.map((r) =>
              Decoration.inline(r.from, r.to, { class: "flow-multi-sel" }),
            );
            return { ranges, deco: DecorationSet.create(newState.doc, decos) };
          },
        },
        props: {
          decorations(state) {
            return multiSelectionKey.getState(state)?.deco;
          },
          handleKeyDown(view, event) {
            if (event.key === "Escape") {
              const st = multiSelectionKey.getState(view.state);
              if (st && st.ranges.length) {
                view.dispatch(view.state.tr.setMeta(multiSelectionKey, { type: "clear" }));
                return true;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});

export function getExtraRanges(editor: Editor): ExtraRange[] {
  return (((editor.storage as any).multiSelection?.ranges) as ExtraRange[]) || [];
}

export function getAllSelectionRanges(editor: Editor): ExtraRange[] {
  const extras = getExtraRanges(editor);
  const sel = editor.state.selection;
  const all = [...extras];
  if (!sel.empty) {
    // avoid duplicate of current selection
    const dup = extras.some((r) => r.from === sel.from && r.to === sel.to);
    if (!dup) all.push({ from: sel.from, to: sel.to });
  }
  return all;
}

export function addExtraRange(editor: Editor, range: ExtraRange) {
  if (range.from >= range.to) return;
  editor.view.dispatch(
    editor.state.tr.setMeta(multiSelectionKey, { type: "add", range }),
  );
}

export function clearExtraRanges(editor: Editor) {
  editor.view.dispatch(editor.state.tr.setMeta(multiSelectionKey, { type: "clear" }));
}

/**
 * מריץ פעולה (chain TipTap) על כל הטווחים שנבחרו (כולל הנוכחי).
 * אם יש רק טווח אחד — התנהגות רגילה.
 */
export function applyAcrossRanges(
  editor: Editor,
  runFn: (chain: ChainedCommands) => ChainedCommands,
) {
  const ranges = getAllSelectionRanges(editor);
  if (ranges.length === 0) {
    runFn(editor.chain().focus()).run();
    return;
  }
  if (ranges.length === 1) {
    const r = ranges[0];
    runFn(editor.chain().focus().setTextSelection(r)).run();
    return;
  }
  let chain: ChainedCommands = editor.chain().focus();
  ranges.forEach((r) => {
    chain = chain.setTextSelection(r);
    chain = runFn(chain);
  });
  chain.run();
}
