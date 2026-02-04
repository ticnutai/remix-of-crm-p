import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";

interface StatusSelectorProps {
  contractId: string;
  currentStatus?: "draft" | "sent" | "approved" | "in_progress" | "completed" | "cancelled";
  onStatusChange: (contractId: string, status: "draft" | "sent" | "approved" | "in_progress" | "completed" | "cancelled") => void;
}

const statusOptions = [
  { value: "draft", label: "טיוטה" },
  { value: "sent", label: "נשלח" },
  { value: "approved", label: "אושר" },
  { value: "in_progress", label: "בביצוע" },
  { value: "completed", label: "הושלם" },
  { value: "cancelled", label: "בוטל" },
] as const;

export function StatusSelector({
  contractId,
  currentStatus = "draft",
  onStatusChange,
}: StatusSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-semibold">
        <RefreshCw className="w-4 h-4" />
        סטטוס החוזה
      </Label>
      <Select
        value={currentStatus}
        onValueChange={(value) => onStatusChange(contractId, value as any)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="בחר סטטוס" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
