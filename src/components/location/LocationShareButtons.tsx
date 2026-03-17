// LocationShareButtons - Share location via Waze, Google Maps, WhatsApp
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Compass, Map, MessageCircle, Share2, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LocationShareButtonsProps {
  location: string;
  /** Optional: client phone number for WhatsApp sharing */
  clientPhone?: string | null;
  /** Optional: client name for personalized message */
  clientName?: string | null;
  /** Optional: meeting title for context */
  meetingTitle?: string | null;
  /** Size variant */
  size?: "sm" | "default";
  /** Show as icon-only buttons or dropdown */
  variant?: "inline" | "dropdown";
}

function buildWazeUrl(address: string): string {
  return `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
}

function buildGoogleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function buildWhatsAppMessage(
  location: string,
  clientName?: string | null,
  meetingTitle?: string | null,
): string {
  const wazeLink = buildWazeUrl(location);
  const mapsLink = buildGoogleMapsUrl(location);

  let message = "";
  if (clientName) message += `שלום ${clientName}! 👋\n`;
  if (meetingTitle) message += `לגבי הפגישה: ${meetingTitle}\n`;
  message += `\n📍 מיקום: ${location}\n\n`;
  message += `🗺️ ניווט עם Waze:\n${wazeLink}\n\n`;
  message += `📍 Google Maps:\n${mapsLink}`;

  return message;
}

function buildWhatsAppUrl(
  phone: string | null | undefined,
  location: string,
  clientName?: string | null,
  meetingTitle?: string | null,
): string {
  const message = buildWhatsAppMessage(location, clientName, meetingTitle);
  const cleanPhone = phone?.replace(/[^0-9+]/g, "") || "";
  
  if (cleanPhone) {
    // Format Israeli numbers
    let formatted = cleanPhone;
    if (formatted.startsWith("0")) {
      formatted = "972" + formatted.substring(1);
    }
    return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function LocationShareButtons({
  location,
  clientPhone,
  clientName,
  meetingTitle,
  size = "sm",
  variant = "dropdown",
}: LocationShareButtonsProps) {
  if (!location) return null;

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const btnSize = size === "sm" ? "h-7 w-7" : "h-8 w-8";

  const openWaze = () => window.open(buildWazeUrl(location), "_blank");
  const openMaps = () => window.open(buildGoogleMapsUrl(location), "_blank");
  const openWhatsApp = () =>
    window.open(
      buildWhatsAppUrl(clientPhone, location, clientName, meetingTitle),
      "_blank",
    );

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={btnSize}
              onClick={openWaze}
            >
              <Compass className={`${iconSize} text-blue-500`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>נווט עם Waze</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={btnSize}
              onClick={openMaps}
            >
              <Map className={`${iconSize} text-red-500`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>פתח ב-Google Maps</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={btnSize}
              onClick={openWhatsApp}
            >
              <MessageCircle className={`${iconSize} text-green-500`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>שלח מיקום בוואטסאפ</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  // Dropdown variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={btnSize}>
          <Share2 className={iconSize} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={openWaze} className="gap-2 cursor-pointer">
          <Compass className="h-4 w-4 text-blue-500" />
          <span>נווט עם Waze</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openMaps} className="gap-2 cursor-pointer">
          <Map className="h-4 w-4 text-red-500" />
          <span>פתח ב-Google Maps</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={openWhatsApp}
          className="gap-2 cursor-pointer"
        >
          <MessageCircle className="h-4 w-4 text-green-500" />
          <span>שלח מיקום בוואטסאפ</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LocationShareButtons;
