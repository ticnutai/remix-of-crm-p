// MenuBar — סרגל כלים מינימלי לעורך TipTap
import React, { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Highlighter,
  Table as TableIcon,
  Minus,
  Undo2,
  Redo2,
  Tag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const DEFAULT_FIELDS: { key: string; label: string; group: string }[] = [
  { key: "customer.name", label: "שם לקוח", group: "לקוח" },
  { key: "customer.address", label: "כתובת לקוח", group: "לקוח" },
  { key: "customer.phone", label: "טלפון", group: "לקוח" },
  { key: "customer.email", label: 'דוא"ל', group: "לקוח" },
  { key: "parcel.block", label: "גוש", group: "נכס" },
  { key: "parcel.lot", label: "חלקה", group: "נכס" },
  { key: "parcel.plot", label: "מגרש", group: "נכס" },
  { key: "quote.number", label: "מספר הצעה", group: "הצעה" },
  { key: "quote.date", label: "תאריך הצעה", group: "הצעה" },
  { key: "quote.validity", label: "תוקף", group: "הצעה" },
  { key: "quote.total", label: 'סה"כ', group: "הצעה" },
];

interface Props {
  editor: Editor | null;
}

export default function MenuBar({ editor }: Props) {
  const [open, setOpen] = useState(false);
  if (!editor) return null;

  const btn = (active: boolean) =>
    active
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : "bg-transparent hover:bg-muted";

  const groups: Record<string, typeof DEFAULT_FIELDS> = {};
  DEFAULT_FIELDS.forEach((f) => {
    groups[f.group] = groups[f.group] || [];
    groups[f.group].push(f);
  });

  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-background px-2 py-1.5">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={btn(editor.isActive("bold"))}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="מודגש"
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={btn(editor.isActive("italic"))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="נטוי"
      >
        <Italic className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={btn(editor.isActive("highlight"))}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        title="הדגשה"
      >
        <Highlighter className="h-3.5 w-3.5" />
      </Button>

      <div className="mx-1 h-5 w-px bg-border" />

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={btn(editor.isActive("heading", { level: 1 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="כותרת 1"
      >
        <Heading1 className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={btn(editor.isActive("heading", { level: 2 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="כותרת 2"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={btn(editor.isActive("heading", { level: 3 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="כותרת 3"
      >
        <Heading3 className="h-3.5 w-3.5" />
      </Button>

      <div className="mx-1 h-5 w-px bg-border" />

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={btn(editor.isActive("bulletList"))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="רשימה"
      >
        <List className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={btn(editor.isActive("orderedList"))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="רשימה ממוספרת"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </Button>

      <div className="mx-1 h-5 w-px bg-border" />

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="bg-transparent hover:bg-muted"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        title="טבלה"
      >
        <TableIcon className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="bg-transparent hover:bg-muted"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="קו מפריד"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>

      <div className="mx-1 h-5 w-px bg-border" />

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            title="הוסף שדה דינמי"
          >
            <Tag className="h-3.5 w-3.5" />
            הוסף שדה
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-80 w-56 overflow-auto">
          {Object.entries(groups).map(([group, fields], i) => (
            <React.Fragment key={group}>
              {i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                {group}
              </DropdownMenuLabel>
              {fields.map((f) => (
                <DropdownMenuItem
                  key={f.key}
                  onSelect={() => {
                    editor.chain().focus().insertDynamicField(f.key, f.label).run();
                  }}
                >
                  <span className="text-sm">{f.label}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {f.key}
                  </span>
                </DropdownMenuItem>
              ))}
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="ml-auto flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="bg-transparent hover:bg-muted"
          onClick={() => editor.chain().focus().undo().run()}
          title="בטל"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="bg-transparent hover:bg-muted"
          onClick={() => editor.chain().focus().redo().run()}
          title="בצע שוב"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
