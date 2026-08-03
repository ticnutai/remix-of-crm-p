import { describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { NodeSelection } from "@tiptap/pm/state";
import ComputedBlock from "./ComputedBlock";
import PaymentsBlock from "./PaymentsBlock";
import { deleteProtectedBlock, detachProtectedBlock } from "./protectedBlockActions";

function createEditor() {
  return new Editor({
    extensions: [StarterKit, PaymentsBlock, ComputedBlock],
    content: '<div data-payments-block="1" data-flow-protected="1"><p>לוח תשלומים</p></div><p>אחרי</p>',
  });
}

describe("protected block actions", () => {
  it("detaches a synchronized block and preserves its content", () => {
    const editor = createEditor();
    editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 0)));

    expect(detachProtectedBlock(editor)).toBe(true);
    expect(editor.getHTML()).not.toContain("data-payments-block");
    expect(editor.getText()).toContain("לוח תשלומים");
    expect(editor.getText()).toContain("אחרי");
  });

  it("deletes the whole synchronized block without deleting adjacent content", () => {
    const editor = createEditor();
    editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 0)));

    expect(deleteProtectedBlock(editor)).toBe(true);
    expect(editor.getText()).not.toContain("לוח תשלומים");
    expect(editor.getText()).toContain("אחרי");
  });
});
