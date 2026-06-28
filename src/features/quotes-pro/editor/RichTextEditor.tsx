// Quotes Pro — עורך טקסט עשיר (WYSIWYG) מבוסס contentEditable
import React, { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Heading,
  Eraser,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

const cmd = (command: string, arg?: string) => {
  document.execCommand(command, false, arg);
};

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      // onMouseDown ולא onClick — כדי לא לאבד את הבחירה בעורך
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  // סנכרון ראשוני / חיצוני בלבד (לא בכל הקלדה, כדי לא לאבד קרסור)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 p-1">
        <ToolbarButton title="מודגש" onClick={() => { cmd("bold"); emit(); }}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="נטוי" onClick={() => { cmd("italic"); emit(); }}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="קו תחתון" onClick={() => { cmd("underline"); emit(); }}>
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton title="כותרת" onClick={() => { cmd("formatBlock", "<h3>"); emit(); }}>
          <Heading className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="רשימה" onClick={() => { cmd("insertUnorderedList"); emit(); }}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="רשימה ממוספרת" onClick={() => { cmd("insertOrderedList"); emit(); }}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton title="ימין" onClick={() => { cmd("justifyRight"); emit(); }}>
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="מרכז" onClick={() => { cmd("justifyCenter"); emit(); }}>
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="שמאל" onClick={() => { cmd("justifyLeft"); emit(); }}>
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton title="נקה עיצוב" onClick={() => { cmd("removeFormat"); emit(); }}>
          <Eraser className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <div
        ref={ref}
        contentEditable
        dir="rtl"
        onInput={emit}
        onBlur={emit}
        className="min-h-[120px] p-3 text-sm focus:outline-none prose-sm"
        suppressContentEditableWarning
      />
    </div>
  );
}
