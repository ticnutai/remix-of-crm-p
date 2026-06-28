// Quotes Pro — שדה לוגו: העלאת קובץ (→ data URL) או הדבקת URL
import React, { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

interface Props {
  label?: string;
  value?: string | null;
  onChange: (v: string | null) => void;
}

export function LogoUploadField({ label = "לוגו", value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        {value ? (
          <img src={value} alt="logo" className="h-9 w-9 object-contain rounded border bg-white" />
        ) : (
          <div className="h-9 w-9 rounded border bg-muted/40 flex items-center justify-center text-muted-foreground text-[10px]">
            ללא
          </div>
        )}
        <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4 ml-1" />
          העלה
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => onChange(null)}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Input
        value={value && value.startsWith("data:") ? "" : value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="h-8 text-xs"
        placeholder="או הדבק כתובת URL"
      />
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}
