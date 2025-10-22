import { doc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { db } from "../lib/firebase";

interface BlogLikeButtonProps {
  blog: { id: string; likes?: number; likedBy?: string[] };
  size?: "sm" | "md";
}

export default function BlogLikeButton({ blog, size = "md" }: BlogLikeButtonProps) {
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  })() as { uid?: string };

  const hasLiked = Boolean(currentUser?.uid && blog.likedBy?.includes(currentUser.uid));

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.uid) return alert("로그?�이 ?�요?�니??");
    if (!blog?.id) return;

    const ref = doc(db, "blogs", String(blog.id));
    await updateDoc(ref, {
      likes: increment(hasLiked ? -1 : 1),
      likedBy: hasLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
    });
  };

  return (
    <button
      onClick={toggleLike}
      className={`flex items-center gap-1 ${hasLiked ? "text-red-500" : "text-gray-500"} ${size === "sm" ? "text-sm" : "text-base"}`}
      aria-label={hasLiked ? "좋아??취소" : "좋아??}
    >
      <span>?�️</span>
      <span>{blog.likes || 0}</span>
    </button>
  );
}


