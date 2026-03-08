import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  isEditMode: boolean;
  className?: string;
  multiline?: boolean;
}

const EditableText = ({ value, onChange, isEditMode, className = "", multiline = false }: EditableTextProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!isEditMode) {
    return <span className={className}>{value}</span>;
  }

  if (isEditing) {
    return (
      <div className="inline-flex items-center gap-1">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`bg-background text-foreground border-2 border-gold rounded px-3 py-2 min-w-[200px] ${className}`}
            rows={3}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`bg-background text-foreground border-2 border-gold rounded px-3 py-2 min-w-[100px] ${className}`}
          />
        )}
        <button onClick={handleSave} className="p-1.5 bg-green-600 text-white hover:bg-green-700 rounded shadow-sm">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={handleCancel} className="p-1.5 bg-red-600 text-white hover:bg-red-700 rounded shadow-sm">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer group inline-flex items-center gap-1 hover:bg-gold/20 rounded px-2 py-0.5 -mx-2 transition-colors ${className}`}
    >
      {value}
      <Pencil className="w-3 h-3 text-gold-dark opacity-0 group-hover:opacity-100 transition-opacity" />
    </span>
  );
};

export default EditableText;
