import React from 'react';

interface CategoryTagProps {
  category: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export default function CategoryTag({ category, color = 'blue' }: CategoryTagProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`inline-block ${colorClasses[color]} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
      {category}
    </span>
  );
}

interface TagListProps {
  tags: string[];
  maxDisplay?: number;
}

export function TagList({ tags, maxDisplay = 3 }: TagListProps) {
  const displayTags = tags.slice(0, maxDisplay);
  const remainingCount = tags.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1">
      {displayTags.map((tag, index) => (
        <span 
          key={index}
          className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md hover:bg-gray-200 transition-colors duration-200"
        >
          #{tag}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
