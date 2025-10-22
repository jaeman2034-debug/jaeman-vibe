import { useState } from "react";

interface PostCardProps {
  id: string;
  title: string;
  content: string;
  initialLikes?: number;
  initialViews?: number;
}

export default function PostCard({
  id,
  title,
  content,
  initialLikes = 0,
  initialViews = 0,
}: PostCardProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [views, setViews] = useState(initialViews);
  const [comments, setComments] = useState<string[]>([]);
  const [newComment, setNewComment] = useState("");

  const handleLike = () => setLikes((prev) => prev + 1);
  const handleView = () => setViews((prev) => prev + 1);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments([...comments, newComment]);
    setNewComment("");
  };

  return (
    <div className="bg-white shadow rounded-2xl p-4 mb-4 max-w-lg">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-700 mb-3">{content}</p>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
        <button
          onClick={handleLike}
          className="hover:text-red-500 transition"
        >
          ❤️ {likes}
        </button>
        <button
          onClick={handleView}
          className="hover:text-blue-500 transition"
        >
          👀 {views}
        </button>
      </div>

      <div className="border-t pt-2">
        <h3 className="text-sm font-semibold mb-2">댓글</h3>
        <div className="space-y-1 mb-2">
          {comments.map((c, idx) => (
            <p key={idx} className="text-gray-800 text-sm">- {c}</p>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 border rounded px-2 py-1 text-sm"
            placeholder="댓글을 입력하세요..."
          />
          <button
            onClick={handleAddComment}
            className="bg-blue-500 text-white rounded px-3 py-1 text-sm"
          >
            작성
          </button>
        </div>
      </div>
    </div>
  );
}
