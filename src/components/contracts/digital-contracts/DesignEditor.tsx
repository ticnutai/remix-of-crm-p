import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Type, Layout, Image as ImageIcon, Save, RotateCcw } from "lucide-react";
import { ContractDesign, DESIGN_PRESETS, FONT_OPTIONS, DEFAULT_DESIGN } from "@/types/contract-design";

interface DesignEditorProps {
  design: ContractDesign;
  onChange: (design: ContractDesign) => void;
  onSave?: () => void;
}

export function DesignEditor({ design, onChange, onSave }: DesignEditorProps) {
  const [localDesign, setLocalDesign] = useState<ContractDesign>(design);

  const updateDesign = (updates: Partial<ContractDesign>) => {
    const newDesign = { ...localDesign, ...updates };
    setLocalDesign(newDesign);
    onChange(newDesign);
  };

  const applyPreset = (preset: ContractDesign) => {
    const newDesign = { ...preset, logo: localDesign.logo };
    setLocalDesign(newDesign);
    onChange(newDesign);
  };

  const resetToDefault = () => {
    const newDesign = { ...DEFAULT_DESIGN, logo: localDesign.logo };
    setLocalDesign(newDesign);
    onChange(newDesign);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateDesign({
          logo: {
            url: reader.result as string,
            width: 120,
            height: 60,
            position: localDesign.logo?.position || 'top-right',
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            תבניות עיצוב מוכנות
          </CardTitle>
          <CardDescription>בחר תבנית מעוצבת והתאם אותה לצרכים שלך</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {DESIGN_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                  localDesign.id === preset.id
                    ? 'border-primary shadow-md'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div
                  className="w-full h-20 rounded mb-2"
                  style={{ background: preset.headerBgColor }}
                />
                <p className="text-sm font-medium text-center">{preset.name}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Editor Tabs */}
      <Tabs defaultValue="colors" dir="rtl">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors">
            <Palette className="w-4 h-4 ml-2" />
            צבעים
          </TabsTrigger>
          <TabsTrigger value="typography">
            <Type className="w-4 h-4 ml-2" />
            טיפוגרפיה
          </TabsTrigger>
          <TabsTrigger value="layout">
            <Layout className="w-4 h-4 ml-2" />
            פריסה
          </TabsTrigger>
          <TabsTrigger value="logo">
            <ImageIcon className="w-4 h-4 ml-2" />
            לוגו
          </TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-4">
          <div className="max-h-[60vh] overflow-y-auto pr-4">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">צבעים עיקריים</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>צבע ראשי</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={localDesign.primaryColor}
                        onChange={(e) => updateDesign({ primaryColor: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={localDesign.primaryColor}
                        onChange={(e) => updateDesign({ primaryColor: e.target.value })}
                        placeholder="#B8860B"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>צבע משני</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={localDesign.secondaryColor}
                        onChange={(e) => updateDesign({ secondaryColor: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={localDesign.secondaryColor}
                        onChange={(e) => updateDesign({ secondaryColor: e.target.value })}
                        placeholder="#DAA520"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>צבע הדגשה</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={localDesign.accentColor}
                        onChange={(e) => updateDesign({ accentColor: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={localDesign.accentColor}
                        onChange={(e) => updateDesign({ accentColor: e.target.value })}
                        placeholder="#FFD700"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>צבע רקע</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={localDesign.backgroundColor}
                        onChange={(e) => updateDesign({ backgroundColor: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={localDesign.backgroundColor}
                        onChange={(e) => updateDesign({ backgroundColor: e.target.value })}
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">צבעי כותרת</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>רקע כותרת</Label>
                    <Input
                      value={localDesign.headerBgColor}
                      onChange={(e) => updateDesign({ headerBgColor: e.target.value })}
                      placeholder="linear-gradient(...)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>טקסט כותרת</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={localDesign.headerTextColor}
                        onChange={(e) => updateDesign({ headerTextColor: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={localDesign.headerTextColor}
                        onChange={(e) => updateDesign({ headerTextColor: e.target.value })}
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">צבעי סעיפים</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>רקע סעיף</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={localDesign.sectionStyle.backgroundColor}
                        onChange={(e) =>
                          updateDesign({
                            sectionStyle: { ...localDesign.sectionStyle, backgroundColor: e.target.value },
                          })
                        }
                        className="w-16 h-10"
                      />
                      <Input
                        value={localDesign.sectionStyle.backgroundColor}
                        onChange={(e) =>
                          updateDesign({
                            sectionStyle: { ...localDesign.sectionStyle, backgroundColor: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>צבע אייקון</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={localDesign.sectionStyle.iconColor}
                        onChange={(e) =>
                          updateDesign({
                            sectionStyle: { ...localDesign.sectionStyle, iconColor: e.target.value },
                          })
                        }
                        className="w-16 h-10"
                      />
                      <Input
                        value={localDesign.sectionStyle.iconColor}
                        onChange={(e) =>
                          updateDesign({
                            sectionStyle: { ...localDesign.sectionStyle, iconColor: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-4">
          <div className="max-h-[60vh] overflow-y-auto pr-4">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">פונטים</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>פונט ראשי</Label>
                    <Select
                      value={localDesign.fontFamily}
                      onValueChange={(value) => updateDesign({ fontFamily: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>פונט כותרת</Label>
                    <Select
                      value={localDesign.headerFontFamily}
                      onValueChange={(value) => updateDesign({ headerFontFamily: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">גדלי טקסט</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>כותרת ראשית</Label>
                    <Input
                      value={localDesign.fontSize.title}
                      onChange={(e) =>
                        updateDesign({
                          fontSize: { ...localDesign.fontSize, title: e.target.value },
                        })
                      }
                      placeholder="28px"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>כותרת משנה</Label>
                    <Input
                      value={localDesign.fontSize.subtitle}
                      onChange={(e) =>
                        updateDesign({
                          fontSize: { ...localDesign.fontSize, subtitle: e.target.value },
                        })
                      }
                      placeholder="14px"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>טקסט רגיל</Label>
                    <Input
                      value={localDesign.fontSize.body}
                      onChange={(e) =>
                        updateDesign({
                          fontSize: { ...localDesign.fontSize, body: e.target.value },
                        })
                      }
                      placeholder="14px"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>טקסט קטן</Label>
                    <Input
                      value={localDesign.fontSize.small}
                      onChange={(e) =>
                        updateDesign({
                          fontSize: { ...localDesign.fontSize, small: e.target.value },
                        })
                      }
                      placeholder="12px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-4">
          <div className="max-h-[60vh] overflow-y-auto pr-4">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">מרווחים</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>מרווח כללי</Label>
                    <Input
                      value={localDesign.spacing}
                      onChange={(e) => updateDesign({ spacing: e.target.value })}
                      placeholder="20px"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Padding כותרת</Label>
                    <Input
                      value={localDesign.headerPadding}
                      onChange={(e) => updateDesign({ headerPadding: e.target.value })}
                      placeholder="30px"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Padding תוכן</Label>
                    <Input
                      value={localDesign.contentPadding}
                      onChange={(e) => updateDesign({ contentPadding: e.target.value })}
                      placeholder="40px"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>עיגול פינות</Label>
                    <Input
                      value={localDesign.borderRadius}
                      onChange={(e) => updateDesign({ borderRadius: e.target.value })}
                      placeholder="12px"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">גבולות</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>עובי גבול</Label>
                    <Input
                      value={localDesign.borderWidth}
                      onChange={(e) => updateDesign({ borderWidth: e.target.value })}
                      placeholder="1px"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>צבע גבול</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={localDesign.borderColor}
                        onChange={(e) => updateDesign({ borderColor: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={localDesign.borderColor}
                        onChange={(e) => updateDesign({ borderColor: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>סגנון גבול</Label>
                    <Select
                      value={localDesign.borderStyle}
                      onValueChange={(value: 'solid' | 'dashed' | 'dotted' | 'none') =>
                        updateDesign({ borderStyle: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">רצוף</SelectItem>
                        <SelectItem value="dashed">מקווקו</SelectItem>
                        <SelectItem value="dotted">מנוקד</SelectItem>
                        <SelectItem value="none">ללא</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Logo Tab */}
        <TabsContent value="logo" className="space-y-4">
          <div className="max-h-[60vh] overflow-y-auto pr-4">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">העלאת לוגו</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo-upload">בחר קובץ לוגו</Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </div>
                {localDesign.logo && (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <img
                        src={localDesign.logo.url}
                        alt="Logo preview"
                        style={{
                          width: `${localDesign.logo.width}px`,
                          height: `${localDesign.logo.height}px`,
                        }}
                        className="mx-auto object-contain"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>רוחב</Label>
                        <Input
                          type="number"
                          value={localDesign.logo.width}
                          onChange={(e) =>
                            updateDesign({
                              logo: { ...localDesign.logo!, width: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>גובה</Label>
                        <Input
                          type="number"
                          value={localDesign.logo.height}
                          onChange={(e) =>
                            updateDesign({
                              logo: { ...localDesign.logo!, height: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>מיקום</Label>
                        <Select
                          value={localDesign.logo.position}
                          onValueChange={(value: any) =>
                            updateDesign({
                              logo: { ...localDesign.logo!, position: value },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top-left">למעלה - שמאל</SelectItem>
                            <SelectItem value="top-center">למעלה - מרכז</SelectItem>
                            <SelectItem value="top-right">למעלה - ימין</SelectItem>
                            <SelectItem value="bottom-left">למטה - שמאל</SelectItem>
                            <SelectItem value="bottom-center">למטה - מרכז</SelectItem>
                            <SelectItem value="bottom-right">למטה - ימין</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => updateDesign({ logo: undefined })}
                      className="w-full"
                    >
                      הסר לוגו
                    </Button>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button variant="outline" onClick={resetToDefault}>
          <RotateCcw className="w-4 h-4 ml-2" />
          איפוס לברירת מחדל
        </Button>
        {onSave && (
          <Button onClick={onSave}>
            <Save className="w-4 h-4 ml-2" />
            שמור עיצוב
          </Button>
        )}
      </div>
    </div>
  );
}
