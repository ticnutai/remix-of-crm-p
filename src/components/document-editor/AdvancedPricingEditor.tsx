import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  Pencil,
  Star,
  ArrowUp,
  ArrowDown,
  Package,
  Sparkles,
  FileText,
  Clock,
  AlertCircle,
  GripVertical,
  X,
} from 'lucide-react';
import {
  PricingTier,
  Upgrade,
  DocumentSection,
  DocumentItem,
  TimelineStep,
} from './types';

const generateId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

interface AdvancedPricingEditorProps {
  pricingTiers: PricingTier[];
  upgrades: Upgrade[];
  sections: DocumentSection[];
  timeline: TimelineStep[];
  importantNotes: string[];
  onUpdateTiers: (tiers: PricingTier[]) => void;
  onUpdateUpgrades: (upgrades: Upgrade[]) => void;
  onUpdateSections: (sections: DocumentSection[]) => void;
  onUpdateTimeline: (timeline: TimelineStep[]) => void;
  onUpdateNotes: (notes: string[]) => void;
}

export function AdvancedPricingEditor({
  pricingTiers,
  upgrades,
  sections,
  timeline,
  importantNotes,
  onUpdateTiers,
  onUpdateUpgrades,
  onUpdateSections,
  onUpdateTimeline,
  onUpdateNotes,
}: AdvancedPricingEditorProps) {
  const [openSections, setOpenSections] = useState<string[]>(['tiers', 'upgrades', 'sections']);
  
  // Tier editing
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);
  const [tierDialog, setTierDialog] = useState(false);
  
  // Upgrade editing
  const [editingUpgrade, setEditingUpgrade] = useState<Upgrade | null>(null);
  const [upgradeDialog, setUpgradeDialog] = useState(false);
  
  // Section editing
  const [editingSection, setEditingSection] = useState<DocumentSection | null>(null);
  const [sectionDialog, setSectionDialog] = useState(false);
  
  // Timeline editing
  const [editingStep, setEditingStep] = useState<TimelineStep | null>(null);
  const [stepDialog, setStepDialog] = useState(false);

  // ========== PRICING TIERS ==========
  const handleAddTier = () => {
    setEditingTier({
      id: generateId(),
      order: pricingTiers.length,
      name: '',
      price: 0,
      description: '',
      features: [],
      isRecommended: false,
    });
    setTierDialog(true);
  };

  const handleSaveTier = () => {
    if (!editingTier) return;
    const exists = pricingTiers.find(t => t.id === editingTier.id);
    if (exists) {
      onUpdateTiers(pricingTiers.map(t => t.id === editingTier.id ? editingTier : t));
    } else {
      onUpdateTiers([...pricingTiers, editingTier]);
    }
    setTierDialog(false);
    setEditingTier(null);
  };

  const handleDeleteTier = (id: string) => {
    onUpdateTiers(pricingTiers.filter(t => t.id !== id));
  };

  // ========== UPGRADES ==========
  const handleAddUpgrade = () => {
    setEditingUpgrade({
      id: generateId(),
      order: upgrades.length,
      name: '',
      price: 0,
      description: '',
    });
    setUpgradeDialog(true);
  };

  const handleSaveUpgrade = () => {
    if (!editingUpgrade) return;
    const exists = upgrades.find(u => u.id === editingUpgrade.id);
    if (exists) {
      onUpdateUpgrades(upgrades.map(u => u.id === editingUpgrade.id ? editingUpgrade : u));
    } else {
      onUpdateUpgrades([...upgrades, editingUpgrade]);
    }
    setUpgradeDialog(false);
    setEditingUpgrade(null);
  };

  const handleDeleteUpgrade = (id: string) => {
    onUpdateUpgrades(upgrades.filter(u => u.id !== id));
  };

  // ========== SECTIONS ==========
  const handleAddSection = () => {
    setEditingSection({
      id: generateId(),
      order: sections.length,
      title: '',
      icon: '📋',
      items: [],
    });
    setSectionDialog(true);
  };

  const handleSaveSection = () => {
    if (!editingSection) return;
    const exists = sections.find(s => s.id === editingSection.id);
    if (exists) {
      onUpdateSections(sections.map(s => s.id === editingSection.id ? editingSection : s));
    } else {
      onUpdateSections([...sections, editingSection]);
    }
    setSectionDialog(false);
    setEditingSection(null);
  };

  const handleDeleteSection = (id: string) => {
    onUpdateSections(sections.filter(s => s.id !== id));
  };

  const handleAddItemToSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    const newItem: DocumentItem = {
      id: generateId(),
      order: section.items.length,
      description: '',
      quantity: 1,
      unit: 'יחידה',
      unitPrice: 0,
      total: 0,
    };
    onUpdateSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, items: [...s.items, newItem] }
        : s
    ));
  };

  const handleUpdateSectionItem = (sectionId: string, itemId: string, updates: Partial<DocumentItem>) => {
    onUpdateSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, items: s.items.map(item => item.id === itemId ? { ...item, ...updates } : item) }
        : s
    ));
  };

  const handleDeleteSectionItem = (sectionId: string, itemId: string) => {
    onUpdateSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, items: s.items.filter(item => item.id !== itemId) }
        : s
    ));
  };

  // ========== TIMELINE ==========
  const handleAddTimelineStep = () => {
    setEditingStep({
      id: generateId(),
      order: timeline.length,
      description: '',
      duration: '',
    });
    setStepDialog(true);
  };

  const handleSaveTimelineStep = () => {
    if (!editingStep) return;
    const exists = timeline.find(s => s.id === editingStep.id);
    if (exists) {
      onUpdateTimeline(timeline.map(s => s.id === editingStep.id ? editingStep : s));
    } else {
      onUpdateTimeline([...timeline, editingStep]);
    }
    setStepDialog(false);
    setEditingStep(null);
  };

  const handleDeleteTimelineStep = (id: string) => {
    onUpdateTimeline(timeline.filter(s => s.id !== id));
  };

  // ========== NOTES ==========
  const handleAddNote = () => {
    onUpdateNotes([...importantNotes, '']);
  };

  const handleUpdateNote = (index: number, value: string) => {
    const updated = [...importantNotes];
    updated[index] = value;
    onUpdateNotes(updated);
  };

  const handleDeleteNote = (index: number) => {
    onUpdateNotes(importantNotes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4" dir="rtl">
      <Accordion
        type="multiple"
        value={openSections}
        onValueChange={setOpenSections}
        className="space-y-2"
      >
        {/* ========== PRICING TIERS ========== */}
        <AccordionItem value="tiers" className="border rounded-lg">
          <AccordionTrigger className="px-3 py-2 hover:no-underline">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">חבילות מחיר</span>
              <Badge variant="secondary" className="mr-2">{pricingTiers.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3">
            <div className="space-y-2">
              {pricingTiers.map((tier, index) => (
                <Card key={tier.id} className={cn(
                  "relative",
                  tier.isRecommended && "border-amber-500 bg-amber-50/50"
                )}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tier.name || 'חבילה ללא שם'}</span>
                          {tier.isRecommended && (
                            <Badge className="bg-amber-500">
                              <Star className="h-3 w-3 ml-1" /> מומלץ
                            </Badge>
                          )}
                        </div>
                        <div className="text-lg font-bold text-amber-700">₪{tier.price.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{tier.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {tier.features.length} תכונות
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingTier(tier);
                            setTierDialog(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteTier(tier.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={handleAddTier}>
                <Plus className="h-4 w-4 ml-2" />
                הוסף חבילה
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ========== UPGRADES ========== */}
        <AccordionItem value="upgrades" className="border rounded-lg">
          <AccordionTrigger className="px-3 py-2 hover:no-underline">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">שידרוגים ותוספות</span>
              <Badge variant="secondary" className="mr-2">{upgrades.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3">
            <div className="space-y-2">
              {upgrades.map((upgrade) => (
                <Card key={upgrade.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium">{upgrade.name || 'שידרוג ללא שם'}</div>
                        <div className="text-sm font-bold text-purple-700">₪{upgrade.price.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{upgrade.description}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingUpgrade(upgrade);
                            setUpgradeDialog(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteUpgrade(upgrade.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={handleAddUpgrade}>
                <Plus className="h-4 w-4 ml-2" />
                הוסף שידרוג
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ========== SECTIONS ========== */}
        <AccordionItem value="sections" className="border rounded-lg">
          <AccordionTrigger className="px-3 py-2 hover:no-underline">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">סעיפים ופריטים</span>
              <Badge variant="secondary" className="mr-2">{sections.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3">
            <div className="space-y-3">
              {sections.map((section) => (
                <Card key={section.id}>
                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <span>{section.icon}</span>
                        {section.title || 'סעיף ללא שם'}
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingSection(section);
                            setSectionDialog(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteSection(section.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="space-y-2">
                      {section.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                          <span className="text-green-600">✓</span>
                          <Input
                            value={item.description}
                            onChange={(e) => handleUpdateSectionItem(section.id, item.id, { description: e.target.value })}
                            placeholder="תיאור הפריט"
                            className="flex-1 h-7 text-xs"
                          />
                          <Input
                            type="number"
                            value={item.upgradePrice || ''}
                            onChange={(e) => handleUpdateSectionItem(section.id, item.id, { 
                              upgradePrice: e.target.value ? Number(e.target.value) : undefined 
                            })}
                            placeholder="+₪"
                            className="w-20 h-7 text-xs"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => handleDeleteSectionItem(section.id, item.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-7 text-xs"
                        onClick={() => handleAddItemToSection(section.id)}
                      >
                        <Plus className="h-3 w-3 ml-1" />
                        הוסף פריט
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={handleAddSection}>
                <Plus className="h-4 w-4 ml-2" />
                הוסף סעיף
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ========== TIMELINE ========== */}
        <AccordionItem value="timeline" className="border rounded-lg">
          <AccordionTrigger className="px-3 py-2 hover:no-underline">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">לוח זמנים</span>
              <Badge variant="secondary" className="mr-2">{timeline.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3">
            <div className="space-y-2">
              {timeline.map((step, index) => (
                <div key={step.id} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {index + 1}
                  </div>
                  <Input
                    value={step.description}
                    onChange={(e) => {
                      onUpdateTimeline(timeline.map(s => s.id === step.id ? { ...s, description: e.target.value } : s));
                    }}
                    placeholder="תיאור השלב"
                    className="flex-1 h-8 text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive shrink-0"
                    onClick={() => handleDeleteTimelineStep(step.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={handleAddTimelineStep}>
                <Plus className="h-4 w-4 ml-2" />
                הוסף שלב
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ========== IMPORTANT NOTES ========== */}
        <AccordionItem value="notes" className="border rounded-lg">
          <AccordionTrigger className="px-3 py-2 hover:no-underline">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">הערות חשובות</span>
              <Badge variant="secondary" className="mr-2">{importantNotes.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3">
            <div className="space-y-2">
              {importantNotes.map((note, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-orange-600 mt-2">•</span>
                  <Textarea
                    value={note}
                    onChange={(e) => handleUpdateNote(index, e.target.value)}
                    placeholder="הערה חשובה..."
                    className="flex-1 min-h-[60px] text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive shrink-0"
                    onClick={() => handleDeleteNote(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={handleAddNote}>
                <Plus className="h-4 w-4 ml-2" />
                הוסף הערה
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* ========== TIER DIALOG ========== */}
      <Dialog open={tierDialog} onOpenChange={setTierDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingTier?.id && pricingTiers.find(t => t.id === editingTier.id) ? 'עריכת חבילה' : 'חבילה חדשה'}
            </DialogTitle>
          </DialogHeader>
          {editingTier && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>שם החבילה</Label>
                <Input
                  value={editingTier.name}
                  onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })}
                  placeholder="למשל: בסיסי, מתקדם, פרימיום"
                />
              </div>
              <div className="space-y-2">
                <Label>מחיר (₪)</Label>
                <Input
                  type="number"
                  value={editingTier.price}
                  onChange={(e) => setEditingTier({ ...editingTier, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>תיאור</Label>
                <Input
                  value={editingTier.description || ''}
                  onChange={(e) => setEditingTier({ ...editingTier, description: e.target.value })}
                  placeholder="תיאור קצר של החבילה"
                />
              </div>
              <div className="space-y-2">
                <Label>תכונות (כל שורה = תכונה אחת)</Label>
                <Textarea
                  value={editingTier.features.join('\n')}
                  onChange={(e) => setEditingTier({ ...editingTier, features: e.target.value.split('\n').filter(f => f.trim()) })}
                  placeholder="בדיקת היתכנות&#10;רישוי מלא&#10;פיקוח עליון"
                  rows={5}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingTier.isRecommended}
                  onCheckedChange={(checked) => setEditingTier({ ...editingTier, isRecommended: checked })}
                />
                <Label>סמן כמומלץ</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTierDialog(false)}>ביטול</Button>
            <Button onClick={handleSaveTier}>שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== UPGRADE DIALOG ========== */}
      <Dialog open={upgradeDialog} onOpenChange={setUpgradeDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingUpgrade?.id && upgrades.find(u => u.id === editingUpgrade.id) ? 'עריכת שידרוג' : 'שידרוג חדש'}
            </DialogTitle>
          </DialogHeader>
          {editingUpgrade && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>שם השידרוג</Label>
                <Input
                  value={editingUpgrade.name}
                  onChange={(e) => setEditingUpgrade({ ...editingUpgrade, name: e.target.value })}
                  placeholder="למשל: תכנון פנים מפורט"
                />
              </div>
              <div className="space-y-2">
                <Label>מחיר (₪)</Label>
                <Input
                  type="number"
                  value={editingUpgrade.price}
                  onChange={(e) => setEditingUpgrade({ ...editingUpgrade, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>תיאור</Label>
                <Textarea
                  value={editingUpgrade.description || ''}
                  onChange={(e) => setEditingUpgrade({ ...editingUpgrade, description: e.target.value })}
                  placeholder="תיאור מפורט של השידרוג"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeDialog(false)}>ביטול</Button>
            <Button onClick={handleSaveUpgrade}>שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== SECTION DIALOG ========== */}
      <Dialog open={sectionDialog} onOpenChange={setSectionDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingSection?.id && sections.find(s => s.id === editingSection.id) ? 'עריכת סעיף' : 'סעיף חדש'}
            </DialogTitle>
          </DialogHeader>
          {editingSection && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>אייקון (אימוג'י)</Label>
                <Input
                  value={editingSection.icon || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, icon: e.target.value })}
                  placeholder="📋"
                  className="w-20"
                />
              </div>
              <div className="space-y-2">
                <Label>כותרת הסעיף</Label>
                <Input
                  value={editingSection.title}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  placeholder="למשל: שלב ראשון - בדיקת היתכנות"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionDialog(false)}>ביטול</Button>
            <Button onClick={handleSaveSection}>שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== TIMELINE STEP DIALOG ========== */}
      <Dialog open={stepDialog} onOpenChange={setStepDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>שלב בלוח זמנים</DialogTitle>
          </DialogHeader>
          {editingStep && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>תיאור השלב</Label>
                <Textarea
                  value={editingStep.description}
                  onChange={(e) => setEditingStep({ ...editingStep, description: e.target.value })}
                  placeholder="למשל: בדיקת היתכנות מול הרשויות - תיק מידע"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>משך זמן (אופציונלי)</Label>
                <Input
                  value={editingStep.duration || ''}
                  onChange={(e) => setEditingStep({ ...editingStep, duration: e.target.value })}
                  placeholder="למשל: 25 ימי עבודה"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStepDialog(false)}>ביטול</Button>
            <Button onClick={handleSaveTimelineStep}>שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
