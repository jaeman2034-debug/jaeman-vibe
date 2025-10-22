/**
 * ?�� 검???�동?�성 컴포?�트
 * 
 * AI ?�그 기반 ?�동?�성 추천
 * ?�력???�워?�에 맞는 ?�그�??�시간으�?추천?�니??
 */

import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  allTags: string[]; // ?�체 ?�품???�그 목록
  placeholder?: string;
}

export default function SearchAutocomplete({
  value,
  onChange,
  allTags,
  placeholder = "?�� ?�품�? ?�명, ?�그�?검??.."
}: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ?�동?�성 추천 ?�성
  useEffect(() => {
    if (value.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // ?�력???�워?��? ?�치?�는 ?�그 ?�터�?    const filtered = allTags
      .filter((tag) => tag.toLowerCase().includes(value.toLowerCase()))
      .filter((tag, index, self) => self.indexOf(tag) === index) // 중복 ?�거
      .slice(0, 8); // 최�? 8�?
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [value, allTags]);

  // ?��? ?�릭 ???�동?�성 ?�기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (tag: string) => {
    onChange(tag);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    onChange("");
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full border rounded-xl pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ?�동?�성 ?�롭?�운 */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-500 px-2 py-1 mb-1">
              ?�� AI 추천 ?�워??            </div>
            {suggestions.map((tag, index) => (
              <button
                key={index}
                onClick={() => handleSelectSuggestion(tag)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <Search size={14} className="text-gray-400" />
                <span className="text-sm text-gray-700">{tag}</span>
                {allTags.filter(t => t === tag).length > 1 && (
                  <span className="ml-auto text-xs text-gray-400">
                    ({allTags.filter(t => t === tag).length}�?
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

