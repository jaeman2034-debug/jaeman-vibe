import React, { useState } from 'react';
import CategoryTag, { TagList } from './CategoryTag';
import LikeButton from './LikeButton';

interface BlogCardProps {
  blog: {
    id: string;
    title: string;
    content: string;
    authorName: string;
    createdAt: any;
    thumbnailUrl?: string;
    category?: string;
    tags?: string[];
    commentsCount?: number;
    likes?: number;
    views?: number;
  };
  onClick: () => void;
}

export default function BlogCard({ blog, onClick }: BlogCardProps) {
  const [comments, setComments] = useState<string[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [views, setViews] = useState(blog.views || 0);

  const formatDate = (date: any) => {
    if (!date) return '';
    const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return dateObj.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    return content.length > maxLength ? content.slice(0, maxLength) + '...' : content;
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    if (!newComment.trim()) return;
    setComments([...comments, newComment]);
    setNewComment("");
  };

  const handleLike = (liked: boolean) => {
    console.log('Blog liked:', liked);
    // TODO: Firebase에 좋아요 상태 저장
  };

  const handleCardClick = () => {
    setViews(prev => prev + 1); // 조회수 증가
    onClick(); // 원래 클릭 이벤트 실행
  };

  return (
    <div 
      className="mb-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 overflow-hidden"
      onClick={handleCardClick}
    >
      {/* 썸네일 이미지 */}
      {blog.thumbnailUrl && (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={blog.thumbnailUrl} 
            alt={blog.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="p-6">
        {/* 카테고리 태그 */}
        {blog.category && (
          <div className="mb-3">
            <CategoryTag category={blog.category} color="blue" />
          </div>
        )}
        
        {/* 제목 */}
        <h2 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors duration-200 mb-3 line-clamp-2">
          {blog.title}
        </h2>
        
        {/* 본문 미리보기 */}
        <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3">
          {truncateContent(blog.content)}
        </p>
        
        {/* 태그 */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="mb-4">
            <TagList tags={blog.tags} maxDisplay={3} />
          </div>
        )}
        
        {/* 작성자 정보 */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {blog.authorName.charAt(0)}
            </div>
            <span className="font-medium">{blog.authorName}</span>
          </div>
          <span>{formatDate(blog.createdAt)}</span>
        </div>
        
        {/* 통계 정보 */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-lg">💬</span>
              <span>{blog.commentsCount || comments.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg">👀</span>
              <span>{views}</span>
            </div>
          </div>
          <LikeButton 
            initialLikes={blog.likes || 0}
            initialLiked={false}
            onLike={handleLike}
            size="sm"
          />
        </div>

        {/* 댓글 섹션 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(!showComments);
            }}
            className="text-sm text-blue-600 hover:text-blue-800 mb-2"
          >
            {showComments ? '댓글 숨기기' : `댓글 보기 (${comments.length})`}
          </button>
          
          {showComments && (
            <div className="space-y-2">
              {/* 기존 댓글들 */}
              {comments.map((comment, idx) => (
                <div key={idx} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                  - {comment}
                </div>
              ))}
              
              {/* 새 댓글 입력 */}
              <div className="flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder="댓글을 입력하세요..."
                />
                <button
                  onClick={handleAddComment}
                  className="bg-blue-500 text-white rounded px-3 py-1 text-sm hover:bg-blue-600 transition-colors"
                >
                  작성
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
