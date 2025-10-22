import { doc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { db } from "../lib/firebase";

interface CommentLikeButtonProps {
  blogId: string;
  comment: { id: string; likes?: number; likedBy?: string[] };
}

export default function CommentLikeButton({ blogId, comment }: CommentLikeButtonProps) {
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  })() as { uid?: string };

  const hasLiked = Boolean(currentUser?.uid && comment.likedBy?.includes(currentUser.uid));

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.uid) return alert("로그?�이 ?�요?�니??");
    if (!blogId || !comment?.id) return;

    const ref = doc(db, "blogs", String(blogId), "comments", String(comment.id));
    await updateDoc(ref, {
      likes: increment(hasLiked ? -1 : 1),
      likedBy: hasLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
    });
  };

  return (
    <button
      onClick={toggleLike}
      className={`text-xs ${hasLiked ? "text-pink-500" : "text-gray-400"}`}
      aria-label={hasLiked ? "좋아??취소" : "좋아??}
    >
      ?�️ {comment.likes || 0}
    </button>
  );
}


