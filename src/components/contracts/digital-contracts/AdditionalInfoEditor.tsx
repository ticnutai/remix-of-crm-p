import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, MapPin } from "lucide-react";
import { toast } from "sonner";

interface AdditionalInfo {
  gush?: string;
  helka?: string;
  magash?: string;
  area?: string;
  buildingRights?: string;
  zoning?: string;
  customFields?: { [key: string]: string };
}

interface AdditionalInfoEditorProps {
  onSave: (info: AdditionalInfo) => void;
}

export function AdditionalInfoEditor({ onSave }: AdditionalInfoEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<AdditionalInfo>({
    gush: "",
    helka: "",
    magash: "",
    area: "",
    buildingRights: "",
    zoning: "",
  });

  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string }>>([]);

  const handleSave = () => {
    const customFieldsObj = customFields.reduce((acc, field) => {
      if (field.key && field.value) {
        acc[field.key] = field.value;
      }
      return acc;
    }, {} as { [key: string]: string });

    const infoToSave = {
      ...formData,
      customFields: Object.keys(customFieldsObj).length > 0 ? customFieldsObj : undefined,
    };

    onSave(infoToSave);
    toast.success("המידע הנוסף נוסף לחוזה");
    setIsOpen(false);
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { key: "", value: "" }]);
  };

  const updateCustomField = (index: number, field: 'key' | 'value', value: string) => {
    const newFields = [...customFields];
    newFields[index][field] = value;
    setCustomFields(newFields);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-sm font-medium flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          מידע נוסף
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-end">
            <MapPin className="w-5 h-5" />
            הוספת מידע נוסף לחוזה
          </DialogTitle>
          <DialogDescription>
            הוסף פרטי נכס, גוש וחלקה ומידע נוסף רלוונטי
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* פרטי נכס */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">פרטי נכס</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gush">גוש</Label>
                <Input
                  id="gush"
                  value={formData.gush}
                  onChange={(e) => setFormData({ ...formData, gush: e.target.value })}
                  placeholder="לדוגמה: 12345"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="helka">חלקה</Label>
                <Input
                  id="helka"
                  value={formData.helka}
                  onChange={(e) => setFormData({ ...formData, helka: e.target.value })}
                  placeholder="לדוגמה: 67"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="magash">מגרש</Label>
                <Input
                  id="magash"
                  value={formData.magash}
                  onChange={(e) => setFormData({ ...formData, magash: e.target.value })}
                  placeholder="לדוגמה: 89"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">שטח (מ״ר)</Label>
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="לדוגמה: 500"
                  className="text-right"
                />
              </div>
            </div>
          </div>

          {/* פרטי תכנון */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">פרטי תכנון</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buildingRights">זכויות בנייה</Label>
                <Input
                  id="buildingRights"
                  value={formData.buildingRights}
                  onChange={(e) => setFormData({ ...formData, buildingRights: e.target.value })}
                  placeholder="לדוגמה: 200 מ״ר"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zoning">ייעוד</Label>
                <Input
                  id="zoning"
                  value={formData.zoning}
                  onChange={(e) => setFormData({ ...formData, zoning: e.target.value })}
                  placeholder="לדוגמה: מגורים א'"
                  className="text-right"
                />
              </div>
            </div>
          </div>

          {/* שדות מותאמים אישית */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomField}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                הוסף שדה
              </Button>
              <h3 className="font-semibold text-lg">שדות נוספים</h3>
            </div>
            {customFields.map((field, index) => (
              <div key={index} className="grid grid-cols-2 gap-2">
                <Input
                  value={field.value}
                  onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                  placeholder="ערך"
                  className="text-right"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCustomField(index)}
                    className="h-10 px-2"
                  >
                    ✕
                  </Button>
                  <Input
                    value={field.key}
                    onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                    placeholder="שם השדה"
                    className="text-right flex-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            ביטול
          </Button>
          <Button onClick={handleSave} className="bg-gold hover:bg-gold-dark">
            הוסף לחוזה
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
