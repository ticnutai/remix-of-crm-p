// User Preferences Hook - Typography, Theme & Notifications
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export type BorderRadius = "none" | "small" | "medium" | "large" | "full";
export type BorderWidth = "none" | "thin" | "normal" | "thick";
export type ShadowIntensity = "none" | "subtle" | "medium" | "strong";
export type CardStyle = "flat" | "outlined" | "elevated" | "glass";
export type ButtonStyle = "square" | "rounded" | "pill";
export type InputStyle = "outlined" | "filled" | "underlined";
export type AnimationSpeed = "none" | "slow" | "normal" | "fast";
export type SidebarStyle = "solid" | "gradient" | "transparent";
export type HeaderStyle = "solid" | "gradient" | "blur";
export type TableStyle = "minimal" | "striped" | "bordered" | "cards";
export type TableDensity = "compact" | "normal" | "spacious";
export type TableDividers = "none" | "horizontal" | "vertical" | "both";
export type TableHeaderOpacity = "transparent" | "semi" | "solid";

export interface UserPreferences {
  id?: string;
  user_id?: string;
  // Typography
  font_family: string;
  heading_font: string;
  font_size: number;
  line_height: "compact" | "normal" | "spacious";
  letter_spacing: "compact" | "normal" | "spacious";
  // Theme
  theme_preset: string;
  custom_primary_color: string | null;
  custom_secondary_color: string | null;
  // Advanced Visual Customization
  border_radius: BorderRadius;
  border_width: BorderWidth;
  shadow_intensity: ShadowIntensity;
  card_style: CardStyle;
  button_style: ButtonStyle;
  input_style: InputStyle;
  animation_speed: AnimationSpeed;
  custom_accent_color: string | null;
  custom_success_color: string | null;
  custom_warning_color: string | null;
  custom_error_color: string | null;
  custom_border_color: string | null;
  sidebar_style: SidebarStyle;
  header_style: HeaderStyle;
  table_style: TableStyle;
  table_density: TableDensity;
  table_dividers: TableDividers;
  table_header_sticky: boolean;
  table_header_opacity: TableHeaderOpacity;
  table_row_gap: number; // pixels
  table_cell_padding: number; // pixels
  // Virtual scroll
  virtual_scroll_threshold: number;
  // Notifications
  notification_email: string | null;
  notification_phone: string | null;
  notification_whatsapp: string | null;
  channels: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    browser: boolean;
  };
  reminder_frequency: "once" | "3times" | "5times";
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  notification_types: {
    invoice_overdue: boolean;
    payment_received: boolean;
    monthly_summary: boolean;
    deadline_approaching: boolean;
    status_update: boolean;
    new_message: boolean;
    file_uploaded: boolean;
    system_updates: boolean;
    weekly_summary: boolean;
  };
}

const defaultPreferences: UserPreferences = {
  font_family: "Heebo",
  heading_font: "Heebo",
  font_size: 100,
  line_height: "normal",
  letter_spacing: "normal",
  theme_preset: "navy-executive",
  custom_primary_color: null,
  custom_secondary_color: null,
  // Advanced Visual Customization
  border_radius: "medium",
  border_width: "normal",
  shadow_intensity: "medium",
  card_style: "elevated",
  button_style: "rounded",
  input_style: "outlined",
  animation_speed: "normal",
  custom_accent_color: null,
  custom_success_color: null,
  custom_warning_color: null,
  custom_error_color: null,
  custom_border_color: null,
  sidebar_style: "solid",
  header_style: "solid",
  table_style: "striped",
  table_density: "normal",
  table_dividers: "horizontal",
  table_header_sticky: true,
  table_header_opacity: "solid",
  table_row_gap: 0,
  table_cell_padding: 12,
  // Virtual scroll
  virtual_scroll_threshold: 50,
  // Notifications
  notification_email: null,
  notification_phone: null,
  notification_whatsapp: null,
  channels: { email: true, sms: false, whatsapp: false, browser: true },
  reminder_frequency: "once",
  quiet_hours_start: null,
  quiet_hours_end: null,
  notification_types: {
    invoice_overdue: true,
    payment_received: true,
    monthly_summary: true,
    deadline_approaching: true,
    status_update: true,
    new_message: true,
    file_uploaded: true,
    system_updates: false,
    weekly_summary: true,
  },
};

// Theme presets with colors
export const themePresets = {
  "navy-executive": {
    name: "Navy Executive",
    primary: "220 45% 18%",
    secondary: "43 45% 60%",
    primaryHex: "#1B2541",
    secondaryHex: "#C9A962",
  },
  ocean: {
    name: "אוקיינוס",
    primary: "199 89% 48%",
    secondary: "213 47% 25%",
    primaryHex: "#0EA5E9",
    secondaryHex: "#1E3A5F",
  },
  midnight: {
    name: "חצות",
    primary: "222 47% 8%",
    secondary: "217 91% 60%",
    primaryHex: "#0A0F1C",
    secondaryHex: "#3B82F6",
  },
  coral: {
    name: "אלמוגים",
    primary: "25 95% 53%",
    secondary: "0 72% 51%",
    primaryHex: "#F97316",
    secondaryHex: "#DC2626",
  },
  mint: {
    name: "מנטה",
    primary: "160 84% 39%",
    secondary: "160 60% 52%",
    primaryHex: "#10B981",
    secondaryHex: "#34D399",
  },
  warm: {
    name: "חם",
    primary: "38 92% 50%",
    secondary: "21 90% 48%",
    primaryHex: "#F59E0B",
    secondaryHex: "#EA580C",
  },
  sunset: {
    name: "שקיעה",
    primary: "25 95% 53%",
    secondary: "0 84% 60%",
    primaryHex: "#F97316",
    secondaryHex: "#EF4444",
  },
  forest: {
    name: "יער",
    primary: "142 71% 45%",
    secondary: "142 64% 29%",
    primaryHex: "#22C55E",
    secondaryHex: "#15803D",
  },
  lavender: {
    name: "לבנדר",
    primary: "258 90% 76%",
    secondary: "258 90% 66%",
    primaryHex: "#A78BFA",
    secondaryHex: "#8B5CF6",
  },
  luxury: {
    name: "יוקרה",
    primary: "43 45% 60%",
    secondary: "220 45% 18%",
    primaryHex: "#C9A962",
    secondaryHex: "#1B2541",
  },
  royal: {
    name: "מלכותי",
    primary: "239 84% 67%",
    secondary: "239 84% 58%",
    primaryHex: "#6366F1",
    secondaryHex: "#4F46E5",
  },
  cream: {
    name: "קרם קלאסי",
    primary: "36 30% 76%",
    secondary: "30 20% 44%",
    primaryHex: "#D4C5B0",
    secondaryHex: "#8B7355",
  },
};

export const fontOptions = [
  // גופנים עבריים מודרניים
  { value: "Heebo", label: "Heebo (היבו)" },
  { value: "Assistant", label: "Assistant (אסיסטנט)" },
  { value: "Rubik", label: "Rubik (רוביק)" },
  { value: "Open Sans Hebrew", label: "Open Sans Hebrew" },
  { value: "Secular One", label: "Secular One (סקולר וואן)" },
  { value: "Alef", label: "Alef (אלף)" },
  { value: "Varela Round", label: "Varela Round (ורלה ראונד)" },
  { value: "Frank Ruhl Libre", label: "Frank Ruhl Libre (פרנק רוהל)" },
  { value: "Suez One", label: "Suez One (סואץ)" },
  { value: "Amatic SC", label: "Amatic SC (אמטיק)" },
  // גופנים עבריים קלאסיים
  { value: "Arial Hebrew", label: "Arial (אריאל)" },
  { value: "David", label: "David (דוד)" },
  { value: "Miriam", label: "Miriam (מרים)" },
  { value: "Narkisim", label: "Narkisim (נרקיסים)" },
  { value: "FrankRuehl", label: "Frank Ruehl (פרנק רוהל)" },
  { value: "Guttman", label: "Guttman (גוטמן)" },
];

export function useUserPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] =
    useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          ...defaultPreferences,
          ...data,
          channels:
            typeof data.channels === "object"
              ? data.channels
              : defaultPreferences.channels,
          notification_types:
            typeof data.notification_types === "object"
              ? data.notification_types
              : defaultPreferences.notification_types,
        } as UserPreferences);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Apply styles to document
  useEffect(() => {
    if (loading) return;

    const root = document.documentElement;

    // Apply font
    root.style.setProperty("--font-family", preferences.font_family);
    root.style.setProperty("--heading-font", preferences.heading_font);

    // Apply font size
    root.style.setProperty(
      "--font-size-multiplier",
      `${preferences.font_size / 100}`,
    );

    // Apply line height
    const lineHeightMap = { compact: "1.4", normal: "1.6", spacious: "1.8" };
    root.style.setProperty(
      "--line-height",
      lineHeightMap[preferences.line_height],
    );

    // Apply letter spacing
    const letterSpacingMap = {
      compact: "-0.02em",
      normal: "0",
      spacious: "0.02em",
    };
    root.style.setProperty(
      "--letter-spacing",
      letterSpacingMap[preferences.letter_spacing],
    );

    // Apply theme colors
    const theme =
      themePresets[preferences.theme_preset as keyof typeof themePresets] ||
      themePresets["navy-executive"];
    root.style.setProperty(
      "--primary",
      preferences.custom_primary_color || theme.primary,
    );
    root.style.setProperty(
      "--secondary",
      preferences.custom_secondary_color || theme.secondary,
    );

    // Apply advanced visual customization
    const borderRadiusMap = {
      none: "0",
      small: "0.25rem",
      medium: "0.5rem",
      large: "0.75rem",
      full: "9999px",
    };
    root.style.setProperty(
      "--custom-radius",
      borderRadiusMap[preferences.border_radius],
    );

    const borderWidthMap = {
      none: "0",
      thin: "1px",
      normal: "2px",
      thick: "3px",
    };
    root.style.setProperty(
      "--custom-border-width",
      borderWidthMap[preferences.border_width],
    );

    const shadowMap = {
      none: "none",
      subtle: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      medium:
        "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      strong:
        "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    };
    root.style.setProperty(
      "--custom-shadow",
      shadowMap[preferences.shadow_intensity],
    );

    const animationSpeedMap = {
      none: "0ms",
      slow: "400ms",
      normal: "200ms",
      fast: "100ms",
    };
    root.style.setProperty(
      "--custom-animation-speed",
      animationSpeedMap[preferences.animation_speed],
    );

    // Apply custom colors if set
    if (preferences.custom_accent_color) {
      root.style.setProperty("--accent", preferences.custom_accent_color);
    }
    if (preferences.custom_success_color) {
      root.style.setProperty("--success", preferences.custom_success_color);
    }
    if (preferences.custom_warning_color) {
      root.style.setProperty("--warning", preferences.custom_warning_color);
    }
    if (preferences.custom_error_color) {
      root.style.setProperty("--destructive", preferences.custom_error_color);
    }
    if (preferences.custom_border_color) {
      root.style.setProperty("--border", preferences.custom_border_color);
    }

    // Apply style classes to body
    root.setAttribute("data-card-style", preferences.card_style);
    root.setAttribute("data-button-style", preferences.button_style);
    root.setAttribute("data-input-style", preferences.input_style);
    root.setAttribute("data-sidebar-style", preferences.sidebar_style);
    root.setAttribute("data-header-style", preferences.header_style);
    root.setAttribute("data-table-style", preferences.table_style);
    root.setAttribute("data-table-density", preferences.table_density);
  }, [preferences, loading]);

  // Save preferences
  const savePreferences = async (newPreferences: Partial<UserPreferences>) => {
    if (!user?.id) return;

    setSaving(true);
    const updatedPreferences = { ...preferences, ...newPreferences };

    try {
      const { error } = await supabase.from("user_preferences").upsert(
        {
          user_id: user.id,
          ...updatedPreferences,
        },
        { onConflict: "user_id" },
      );

      if (error) throw error;

      setPreferences(updatedPreferences);
      toast({
        title: "ההגדרות נשמרו",
        description: "השינויים הוחלו בהצלחה",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לשמור את ההגדרות",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = async () => {
    await savePreferences(defaultPreferences);
  };

  return {
    preferences,
    loading,
    saving,
    savePreferences,
    resetToDefaults,
    themePresets,
    fontOptions,
  };
}
