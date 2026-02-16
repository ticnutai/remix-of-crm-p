// Shared types and constants for Gmail components
import React from "react";
import { Flag } from "lucide-react";

// Client interface for auto-tagging
export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

// Email Labels/Tags Configuration
export interface EmailLabel {
  id: string;
  name: string;
  color: string;
  icon?: React.ReactNode;
}

// Priority levels
export type Priority = "high" | "medium" | "low" | "none";

export const DEFAULT_LABELS: EmailLabel[] = [
  { id: "client", name: "לקוח", color: "bg-blue-500" },
  { id: "project", name: "פרויקט", color: "bg-green-500" },
  { id: "urgent", name: "דחוף", color: "bg-red-500" },
  { id: "followup", name: "מעקב", color: "bg-orange-500" },
  { id: "invoice", name: "חשבונית", color: "bg-purple-500" },
  { id: "meeting", name: "פגישה", color: "bg-pink-500" },
  { id: "task", name: "משימה", color: "bg-yellow-500" },
  { id: "info", name: "מידע", color: "bg-gray-500" },
];

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; icon: React.ReactNode }
> = {
  high: {
    label: "גבוהה",
    color: "text-red-600",
    icon: <Flag className="h-4 w-4 text-red-500 fill-red-500" />,
  },
  medium: {
    label: "בינונית",
    color: "text-orange-600",
    icon: <Flag className="h-4 w-4 text-orange-500 fill-orange-500" />,
  },
  low: {
    label: "נמוכה",
    color: "text-blue-600",
    icon: <Flag className="h-4 w-4 text-blue-500" />,
  },
  none: {
    label: "ללא",
    color: "text-gray-400",
    icon: <Flag className="h-4 w-4 text-gray-300" />,
  },
};
