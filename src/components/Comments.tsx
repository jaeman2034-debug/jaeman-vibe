import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

type Comment = {
  id: string;
  content: string;
  authorUid: string;
  authorName: string;
  authorIcon?: string;
  imageUrl?: string;
  createdAt: number;
};

export default function Comments({ postId }: { postId: string }) {
  // ?„ì‹œë¡?ë¡œê·¸???íƒœ ê´€ë¦?(?¤ì œë¡œëŠ” useAuth ???¬ìš©)
         const [user] = useState<any>({
           uid: "demo-user",
           displayName: "?ŒìŠ¤???¬ìš©??,
           photoURL: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%2310b981'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-family='system-ui, sans-serif' font-size='10' font-weight='bold'%3EU%3C/text%3E%3C/svg%3E"
         });
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment))
      );
    });
    return () => unsub();
  }, [postId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("ë¡œê·¸?????“ê????‘ì„±?????ˆìŠµ?ˆë‹¤.");
      return;
    }
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      let imageUrl: string | null = null;
      if (image) {
        const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
        const { storage } = await import("../lib/firebase");
        const imgRef = ref(storage, `comments/${postId}/${Date.now()}-${image.name}`);
        await uploadBytes(imgRef, image);
        imageUrl = await getDownloadURL(imgRef);
      }

      await addDoc(collection(db, "posts", postId, "comments"), {
        content: newComment.trim(),
        authorUid: user.uid,
        authorName: user.displayName || "?µëª…",
        authorIcon: user.photoURL || "",
        imageUrl,
        createdAt: Date.now(),
      });

      setNewComment("");
      setImage(null);
    } catch (err) {
      console.error("?“ê? ?‘ì„± ?¤íŒ¨:", err);
      alert("?“ê? ?‘ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (comment: Comment) => {
    if (!user) return;
    if (comment.authorUid !== user.uid) {
      alert("ë³¸ì¸ ?“ê?ë§??? œ?????ˆìŠµ?ˆë‹¤.");
      return;
    }
    if (confirm("?“ê????? œ?˜ì‹œê² ìŠµ?ˆê¹Œ?")) {
      try {
        await deleteDoc(doc(db, "posts", postId, "comments", comment.id));
      } catch (err) {
        console.error("?“ê? ?? œ ?¤íŒ¨:", err);
        alert("?“ê? ?? œ???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
      }
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        ?’¬ ?“ê? ({comments.length}ê°?
      </h2>

      {/* ?“ê? ?‘ì„± ??*/}
      <form onSubmit={handleAdd} className="mb-6">
        <div className="flex gap-3">
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600"
            />
          )}
          <div className="flex-1">
            <textarea
              placeholder="?“ê????…ë ¥?˜ì„¸??.."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
            
            {/* ?´ë?ì§€ ?…ë¡œ??*/}
            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-600 dark:file:text-gray-200"
              />
              {image && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-green-600 dark:text-green-400">
                    ?“ {image.name} ? íƒ??                  </span>
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    ?œê±°
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {newComment.length}/500??              </p>
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  loading || !newComment.trim()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 hover:scale-105"
                } text-white text-sm`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ?‘ì„± ì¤?..
                  </div>
                ) : (
                  "?“ ?“ê? ?±ë¡"
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* ?“ê? ëª©ë¡ */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">?’­</div>
          <p>?„ì§ ?“ê????†ìŠµ?ˆë‹¤.</p>
          <p className="text-sm">ì²?ë²ˆì§¸ ?“ê????‘ì„±?´ë³´?¸ìš”! ??</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start gap-3">
                <img
                  src={comment.authorIcon || "https://placehold.co/40x40?text=U"}
                  alt={comment.authorName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {comment.authorName}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  {comment.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={comment.imageUrl}
                        alt="?“ê? ?´ë?ì§€"
                        className="max-w-xs rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(comment.imageUrl, '_blank')}
                      />
                    </div>
                  )}
                </div>
                {user?.uid === comment.authorUid && (
                  <button
                    onClick={() => handleDelete(comment)}
                    className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline transition-colors"
                  >
                    ?? œ
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
