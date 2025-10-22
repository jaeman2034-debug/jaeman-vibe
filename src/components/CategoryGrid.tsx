import React from "react";

const categories = [
  { name: "?¼êµ¬", tag: "baseball", icon: "?? },
  { name: "ì¶•êµ¬", tag: "football", icon: "?? },
  { name: "?êµ¬", tag: "basketball", icon: "??" },
  { name: "ë°°êµ¬", tag: "volleyball", icon: "?" },
  { name: "ê³¨í”„", tag: "golf", icon: "?Œï¸? },
  { name: "?Œë‹ˆ??, tag: "tennis", icon: "?Ž¾" },
  { name: "?¬ë‹", tag: "running", icon: "?ƒ" },
  { name: "?„ì›ƒ?„ì–´", tag: "outdoor", icon: "?•ï¸? },
  { name: "ë°°ë“œë¯¼í„´", tag: "badminton", icon: "?¸" },
  { name: "?êµ¬", tag: "tabletennis", icon: "?¥…" },
  { name: "?˜ì˜", tag: "swimming", icon: "?Š" },
  { name: "?¬ìŠ¤/?¼íŠ¸?ˆìŠ¤", tag: "fitness", icon: "?‹ï¸? },
  { name: "?”ê?/?„ë¼?ŒìŠ¤", tag: "yoga", icon: "?§˜" },
  { name: "?´ë¼?´ë°", tag: "climbing", icon: "?§—" },
];

interface CategoryGridProps {
  onSelect?: (tag: string) => void;
  selectedTag?: string | null;
}

export default function CategoryGrid({ onSelect, selectedTag }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 p-3">
      {categories.map((c) => {
        const isSelected = selectedTag === c.tag;
        return (
          <button
            key={c.tag}
            onClick={() => onSelect?.(c.tag)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-transform hover:scale-105 ${
              isSelected
                ? "bg-blue-100 border-blue-500 scale-105"
                : "hover:bg-blue-50"
            }`}
          >
            <span className="text-3xl mb-1">{c.icon}</span>
            <span className="text-sm font-medium">{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}
