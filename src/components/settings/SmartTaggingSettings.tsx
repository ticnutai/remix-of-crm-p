// Smart Tagging Settings Component
// הגדרות תיוג אוטומטי חכם

import React, { useState } from "react";
import {
  useSmartTagging,
  SmartTag,
  TagCriteria,
} from "@/hooks/useSmartTagging";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tag,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  Star,
  AlertTriangle,
  UserPlus,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export function SmartTaggingSettings() {
  const {
    config,
    taggedClients,
    isAnalyzing,
    updateConfig,
    addCustomTag,
    removeCustomTag,
    analyzeClients,
    allTags,
    tagSummary,
  } = useSmartTagging();

  const navigate = useNavigate();

  // New custom tag form
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagEmoji, setNewTagEmoji] = useState("🏷️");
  const [newTagType, setNewTagType] = useState<TagCriteria["type"]>("revenue");
  const [newTagOperator, setNewTagOperator] =
    useState<TagCriteria["operator"]>("gt");
  const [newTagValue, setNewTagValue] = useState("");

  const handleAddCustomTag = () => {
    if (!newTagLabel || !newTagValue) return;

    const tag: SmartTag = {
      id: `custom-${Date.now()}`,
      label: newTagLabel,
      emoji: newTagEmoji,
      color: "#6366f1",
      description: `תג מותאם: ${newTagLabel}`,
      criteria: {
        type: newTagType,
        operator: newTagOperator,
        value: parseInt(newTagValue),
      },
    };

    addCustomTag(tag);
    setNewTagLabel("");
    setNewTagValue("");
  };

  const criteriaTypeLabels: Record<string, string> = {
    revenue: "הכנסות (₪)",
    activity: "ימים ללא פעילות",
    age: "גיל הלקוח (ימים)",
    tasks: "משימות פתוחות",
    meetings: "פגישות (חודש)",
  };

  const operatorLabels: Record<string, string> = {
    gt: "גדול מ-",
    lt: "קטן מ-",
    eq: "שווה ל-",
    between: "בין",
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Main Toggle */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  config.enabled ? "bg-indigo-500/10" : "bg-muted",
                )}
              >
                <Sparkles
                  className={cn(
                    "h-5 w-5",
                    config.enabled
                      ? "text-indigo-600"
                      : "text-muted-foreground",
                  )}
                />
              </div>
              <div>
                <CardTitle className="text-lg">תיוג אוטומטי חכם</CardTitle>
                <CardDescription>
                  סיווג לקוחות אוטומטי לפי דפוסי פעילות
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => updateConfig({ enabled })}
            />
          </div>
        </CardHeader>

        {config.enabled && (
          <CardContent className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-amber-500/10 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 text-amber-600" />
                  <span className="text-xl font-bold text-amber-600">
                    {tagSummary.vip}
                  </span>
                </div>
                <div className="text-xs text-amber-600">VIP</div>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 text-center">
                <div className="flex items-center justify-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-xl font-bold text-red-600">
                    {tagSummary.atRisk}
                  </span>
                </div>
                <div className="text-xs text-red-600">בסיכון</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                <div className="flex items-center justify-center gap-1">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <span className="text-xl font-bold text-blue-600">
                    {tagSummary.newClients}
                  </span>
                </div>
                <div className="text-xs text-blue-600">חדשים</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Tag className="h-4 w-4" />
                  <span className="text-xl font-bold">{tagSummary.total}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  סה"כ מתויגים
                </div>
              </div>
            </div>

            {/* Auto Apply Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <div>
                  <Label className="font-medium">שמירה אוטומטית</Label>
                  <p className="text-xs text-muted-foreground">
                    שמור תגיות אוטומטית לכל לקוח
                  </p>
                </div>
              </div>
              <Switch
                checked={config.autoApply}
                onCheckedChange={(autoApply) => updateConfig({ autoApply })}
              />
            </div>

            {/* Analyze Button */}
            <Button
              onClick={() => analyzeClients()}
              disabled={isAnalyzing}
              className="w-full"
            >
              <RefreshCw
                className={cn("h-4 w-4 ml-2", isAnalyzing && "animate-spin")}
              />
              {isAnalyzing ? "מנתח..." : "נתח לקוחות עכשיו"}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Tag Rules */}
      {config.enabled && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              כללי תיוג ({allTags.length})
            </CardTitle>
            <CardDescription>תגיות אוטומטיות מובנות ומותאמות</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {allTags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{tag.emoji}</span>
                  <div>
                    <div className="font-medium">{tag.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {tag.description}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {criteriaTypeLabels[tag.criteria.type]}{" "}
                    {operatorLabels[tag.criteria.operator]}{" "}
                    {tag.criteria.value.toLocaleString("he-IL")}
                  </Badge>
                  {tag.id.startsWith("custom-") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeCustomTag(tag.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Add Custom Tag */}
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Plus className="h-4 w-4" />
                הוסף תג מותאם
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">אימוג'י</Label>
                  <Input
                    value={newTagEmoji}
                    onChange={(e) => setNewTagEmoji(e.target.value)}
                    className="h-9 text-center"
                    maxLength={4}
                  />
                </div>
                <div>
                  <Label className="text-xs">תווית</Label>
                  <Input
                    value={newTagLabel}
                    onChange={(e) => setNewTagLabel(e.target.value)}
                    placeholder="שם התג"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">סוג</Label>
                  <Select
                    value={newTagType}
                    onValueChange={(v) => setNewTagType(v as any)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">הכנסות</SelectItem>
                      <SelectItem value="activity">ימים ללא פעילות</SelectItem>
                      <SelectItem value="age">גיל לקוח</SelectItem>
                      <SelectItem value="tasks">משימות פתוחות</SelectItem>
                      <SelectItem value="meetings">פגישות</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">תנאי</Label>
                  <Select
                    value={newTagOperator}
                    onValueChange={(v) => setNewTagOperator(v as any)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gt">גדול מ-</SelectItem>
                      <SelectItem value="lt">קטן מ-</SelectItem>
                      <SelectItem value="eq">שווה ל-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">ערך</Label>
                  <Input
                    type="number"
                    value={newTagValue}
                    onChange={(e) => setNewTagValue(e.target.value)}
                    placeholder="0"
                    className="h-9"
                  />
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleAddCustomTag}
                disabled={!newTagLabel || !newTagValue}
                className="w-full"
              >
                <Plus className="h-4 w-4 ml-2" />
                הוסף תג
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tagged Clients Preview */}
      {config.enabled && taggedClients.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              לקוחות מתויגים ({taggedClients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {taggedClients.slice(0, 20).map((client) => (
                  <div
                    key={client.clientId}
                    className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() =>
                      navigate(`/client-profile/${client.clientId}`)
                    }
                  >
                    <div className="font-medium">{client.clientName}</div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {client.autoTags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SmartTaggingSettings;
