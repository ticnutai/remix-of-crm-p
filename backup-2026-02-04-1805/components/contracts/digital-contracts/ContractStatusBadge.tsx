import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Send, 
  CheckCircle, 
  Clock, 
  CheckCheck,
  XCircle 
} from "lucide-react";

interface ContractStatusBadgeProps {
  status?: "draft" | "sent" | "approved" | "in_progress" | "completed" | "cancelled";
}

const statusConfig = {
  draft: {
    label: "טיוטה",
    icon: FileText,
    className: "bg-gray-100 text-gray-700 border-gray-300",
  },
  sent: {
    label: "נשלח",
    icon: Send,
    className: "bg-blue-100 text-blue-700 border-blue-300",
  },
  approved: {
    label: "אושר",
    icon: CheckCircle,
    className: "bg-green-100 text-green-700 border-green-300",
  },
  in_progress: {
    label: "בביצוע",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-700 border-yellow-300",
  },
  completed: {
    label: "הושלם",
    icon: CheckCheck,
    className: "bg-emerald-100 text-emerald-700 border-emerald-300",
  },
  cancelled: {
    label: "בוטל",
    icon: XCircle,
    className: "bg-red-100 text-red-700 border-red-300",
  },
};

export function ContractStatusBadge({ status = "draft" }: ContractStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`flex items-center gap-1.5 px-3 py-1 ${config.className} border-2`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="font-semibold">{config.label}</span>
    </Badge>
  );
}
