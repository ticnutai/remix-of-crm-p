// FlowEditor — TipTap rich text editor, RTL, עם autosave ושדות דינמיים
import React, { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { FontFamily } from "@tiptap/extension-font-family";
import DynamicField from "./DynamicField";
import MenuBar from "./MenuBar";
import BubbleToolbar from "./BubbleToolbar";
import AdvancedTextStyle from "./AdvancedTextStyle";

interface Props {
  initialHtml: string;
  onChange: (html: string) => void;
}

export default function FlowEditor({ initialHtml, onChange }: Props) {
  const debounceRef = useRef<number | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        history: { depth: 200, newGroupDelay: 400 },
      } as any),
      AdvancedTextStyle,
      Color,
      FontFamily,
      Underline,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      DynamicField,
      Placeholder.configure({ placeholder: "התחל לכתוב..." }),
    ],
    content: initialHtml || "<p></p>",
    editorProps: {
      attributes: {
        dir: "rtl",
        class:
          "flow-editor-content min-h-[60vh] max-w-none px-6 py-6 focus:outline-none",
      },
      handleKeyDown(view, event) {
        const mod = event.ctrlKey || event.metaKey;
        if (!mod) return false;
        const key = event.key.toLowerCase();
        // Ctrl/Cmd + Z = undo, Ctrl/Cmd + Shift + Z = redo, Ctrl/Cmd + Y = redo
        if (key === "z" && !event.shiftKey) {
          event.preventDefault();
          (editor as any)?.chain().focus().undo().run();
          return true;
        }
        if ((key === "z" && event.shiftKey) || key === "y") {
          event.preventDefault();
          (editor as any)?.chain().focus().redo().run();
          return true;
        }
        return false;
      },
    },
    onUpdate({ editor }) {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        onChange(editor.getHTML());
      }, 500);
    },
  });

  // עדכון תוכן כשטוענים מסמך חדש (החלפת תבנית)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (initialHtml && initialHtml !== current) {
      editor.commands.setContent(initialHtml, { emitUpdate: false } as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHtml, editor]);

  return (
    <div className="flex h-full flex-col bg-background">
      <MenuBar editor={editor} />
      <BubbleToolbar editor={editor} />
      <div className="flex-1 overflow-auto bg-muted/30">
        <div className="mx-auto my-4 max-w-[860px] rounded-md border bg-background shadow-sm">
          <EditorContent editor={editor} />
        </div>
      </div>
      <style>{`
        .flow-editor-content { font-family: Heebo, Arial, sans-serif; line-height: 1.7; color: hsl(var(--foreground)); }
        .flow-editor-content h1 { font-size: 1.6rem; font-weight: 700; margin: 1rem 0 0.5rem; color: hsl(var(--primary)); border-bottom: 2px solid hsl(var(--accent)); padding-bottom: .3rem; }
        .flow-editor-content h2 { font-size: 1.3rem; font-weight: 700; margin: .9rem 0 .4rem; color: hsl(var(--primary)); }
        .flow-editor-content h3 { font-size: 1.1rem; font-weight: 600; margin: .7rem 0 .3rem; color: hsl(var(--primary)); }
        .flow-editor-content p { margin: 0 0 .5rem; }
        .flow-editor-content ul, .flow-editor-content ol { padding-inline-start: 1.5rem; margin: 0 0 .7rem; }
        .flow-editor-content li { margin-bottom: .2rem; }
        .flow-editor-content table { border-collapse: collapse; width: 100%; margin: .5rem 0; }
        .flow-editor-content th, .flow-editor-content td { border: 1px solid hsl(var(--border)); padding: .35rem .55rem; text-align: right; }
        .flow-editor-content th { background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); }
        .flow-editor-content hr { border: 0; border-top: 1px dashed hsl(var(--border)); margin: .8rem 0; }
        .flow-editor-content mark { background: hsl(var(--accent) / 0.35); padding: 0 .15rem; border-radius: .15rem; }
        .flow-editor-content [data-field] { user-select: all; }
        .flow-editor-content .ProseMirror-focused { outline: none; }
      `}</style>
    </div>
  );
}
