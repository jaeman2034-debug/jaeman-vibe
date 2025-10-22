import React, { useState } from 'react';

interface LikeButtonProps {
  initialLikes: number;
  initialLiked: boolean;
  onLike: (liked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function LikeButton({ 
  initialLikes, 
  initialLiked, 
  onLike, 
  size = 'md' 
}: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);

  const handleClick = () => {
    const newLiked = !liked;
    const newLikes = newLiked ? likes + 1 : likes - 1;
    
    setLiked(newLiked);
    setLikes(newLikes);
    onLike(newLiked);
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  return (
    <button
      onClick={handleClick}
      className={`
        ${sizeClasses[size]}
        flex items-center gap-2 rounded-lg transition-all duration-200
        ${liked 
          ? 'bg-red-100 text-red-600 border border-red-200 hover:bg-red-200' 
          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
        }
      `}
    >
      <span className={`transition-transform duration-200 ${liked ? 'scale-110' : ''}`}>
        {liked ? '❤️' : '🤍'}
      </span>
      <span className="font-medium">{likes}</span>
    </button>
  );
}
