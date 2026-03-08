// Emoji Picker Component for email compose
import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smile, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  triggerSize?: "sm" | "icon" | "default";
}

const EMOJI_CATEGORIES: Record<string, string[]> = {
  פרצופים: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "🤣",
    "😂",
    "🙂",
    "😊",
    "😇",
    "🥰",
    "😍",
    "🤩",
    "😘",
    "😗",
    "😚",
    "😙",
    "🥲",
    "😋",
    "😛",
    "😜",
    "🤪",
    "😝",
    "🤑",
    "🤗",
    "🤭",
    "🫢",
    "🤫",
    "🤔",
    "🫡",
    "🤐",
    "🤨",
    "😐",
    "😑",
    "😶",
    "🫥",
    "😏",
    "😒",
    "🙄",
    "😬",
    "🤥",
    "😌",
    "😔",
    "😪",
    "🤤",
    "😴",
    "😷",
    "🤒",
    "🤕",
    "🤢",
    "🤮",
    "🥵",
    "🥶",
    "🥴",
    "😵",
    "🤯",
    "🤠",
    "🥳",
    "🥸",
    "😎",
    "🤓",
    "🧐",
    "😕",
    "🫤",
    "😟",
    "🙁",
    "☹️",
    "😮",
    "😯",
    "😲",
    "😳",
    "🥺",
    "🥹",
    "😦",
    "😧",
    "😨",
    "😰",
    "😥",
    "😢",
    "😭",
    "😱",
    "😖",
    "😣",
    "😞",
    "😓",
    "😩",
    "😫",
    "🥱",
    "😤",
    "😡",
    "😠",
    "🤬",
    "😈",
    "👿",
    "💀",
    "☠️",
    "💩",
    "🤡",
    "👹",
    "👺",
    "👻",
    "👽",
    "👾",
    "🤖",
  ],
  מחוות: [
    "👋",
    "🤚",
    "🖐️",
    "✋",
    "🖖",
    "🫱",
    "🫲",
    "🫳",
    "🫴",
    "👌",
    "🤌",
    "🤏",
    "✌️",
    "🤞",
    "🫰",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "🖕",
    "👇",
    "☝️",
    "🫵",
    "👍",
    "👎",
    "✊",
    "👊",
    "🤛",
    "🤜",
    "👏",
    "🙌",
    "🫶",
    "👐",
    "🤲",
    "🤝",
    "🙏",
    "✍️",
    "💅",
    "🤳",
    "💪",
    "🦾",
    "🦿",
    "🦵",
    "🦶",
    "👂",
    "🦻",
    "👃",
    "🧠",
    "🫀",
    "🫁",
    "🦷",
    "🦴",
    "👀",
    "👁️",
    "👅",
    "👄",
  ],
  לבבות: [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "❤️‍🔥",
    "❤️‍🩹",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
    "💝",
    "💟",
  ],
  עבודה: [
    "💼",
    "📁",
    "📂",
    "🗂️",
    "📋",
    "📌",
    "📎",
    "🖇️",
    "📏",
    "📐",
    "✂️",
    "🗃️",
    "📊",
    "📈",
    "📉",
    "🗒️",
    "🗓️",
    "📆",
    "📅",
    "🗑️",
    "📇",
    "✉️",
    "📧",
    "📨",
    "📩",
    "📤",
    "📥",
    "📦",
    "📫",
    "📪",
    "📬",
    "📭",
    "📮",
    "🏷️",
    "🔖",
  ],
  סמלים: [
    "✅",
    "❌",
    "⭐",
    "🌟",
    "💫",
    "✨",
    "🔥",
    "💯",
    "💢",
    "💥",
    "💦",
    "💨",
    "🕳️",
    "💣",
    "💬",
    "👁️‍🗨️",
    "🗨️",
    "🗯️",
    "💭",
    "💤",
    "🔔",
    "🔕",
    "🎵",
    "🎶",
    "🏆",
    "🎯",
    "🎮",
    "🎲",
    "🧩",
    "🔑",
    "🔒",
    "🔓",
  ],
  זמן: [
    "⏰",
    "⏱️",
    "⏲️",
    "🕐",
    "🕑",
    "🕒",
    "🕓",
    "🕔",
    "🕕",
    "🕖",
    "🕗",
    "🕘",
    "🕙",
    "🕚",
    "🕛",
    "📅",
    "📆",
    "🗓️",
  ],
};

export const EmojiPicker = ({
  onSelect,
  triggerSize = "icon",
}: EmojiPickerProps) => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("פרצופים");
  const [open, setOpen] = useState(false);

  const categories = Object.keys(EMOJI_CATEGORIES);

  const filteredEmojis = search
    ? Object.values(EMOJI_CATEGORIES).flat()
    : EMOJI_CATEGORIES[activeCategory] || [];

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size={triggerSize} title="אימוג'י">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start" side="top">
        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="חפש אימוג'י..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pr-8 text-sm"
          />
        </div>

        {/* Category tabs */}
        {!search && (
          <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2 flex-shrink-0"
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        )}

        {/* Emoji grid */}
        <ScrollArea className="h-48">
          <div className="grid grid-cols-8 gap-0.5">
            {filteredEmojis.map((emoji, i) => (
              <button
                key={`${emoji}-${i}`}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-accent rounded transition-colors cursor-pointer"
                onClick={() => handleSelect(emoji)}
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
