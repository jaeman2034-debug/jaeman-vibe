import React from "react";

const categories = [
  { name: "?�구", tag: "baseball", icon: "?? },
  { name: "축구", tag: "football", icon: "?? },
  { name: "?�구", tag: "basketball", icon: "??" },
  { name: "배구", tag: "volleyball", icon: "?��" },
  { name: "골프", tag: "golf", icon: "?���? },
  { name: "?�니??, tag: "tennis", icon: "?��" },
  { name: "?�닝", tag: "running", icon: "?��" },
  { name: "?�웃?�어", tag: "outdoor", icon: "?���? },
  { name: "배드민턴", tag: "badminton", icon: "?��" },
  { name: "?�구", tag: "tabletennis", icon: "?��" },
  { name: "?�영", tag: "swimming", icon: "?��" },
  { name: "?�스/?�트?�스", tag: "fitness", icon: "?���? },
  { name: "?��?/?�라?�스", tag: "yoga", icon: "?��" },
  { name: "?�라?�밍", tag: "climbing", icon: "?��" },
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
