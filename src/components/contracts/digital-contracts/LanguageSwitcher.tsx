import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Languages } from "lucide-react";
import { Card } from "@/components/ui/card";

interface LanguageSwitcherProps {
  contractId: string;
  currentLanguage?: "he" | "en";
  onLanguageChange: (contractId: string, language: "he" | "en") => void;
}

const languageOptions = [
  { value: "he", label: "עברית", flag: "🇮🇱" },
  { value: "en", label: "English", flag: "🇬🇧" },
] as const;

export function LanguageSwitcher({
  contractId,
  currentLanguage = "he",
  onLanguageChange,
}: LanguageSwitcherProps) {
  const handleLanguageChange = (newLanguage: "he" | "en") => {
    onLanguageChange(contractId, newLanguage);
    
    // Update document direction
    if (newLanguage === "he") {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Languages className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-teal-900">שפת החוזה</h3>
        </div>

        <Select
          value={currentLanguage}
          onValueChange={handleLanguageChange}
        >
          <SelectTrigger className="w-full bg-white border-2 border-teal-300">
            <SelectValue placeholder="בחר שפה" />
          </SelectTrigger>
          <SelectContent>
            {languageOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{option.flag}</span>
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className="text-xs text-teal-700">
          {currentLanguage === "he" 
            ? "החוזה יוצג בעברית עם יישור לימין"
            : "Contract will be displayed in English with left alignment"}
        </p>
      </div>
    </Card>
  );
}
