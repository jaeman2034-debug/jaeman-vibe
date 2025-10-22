import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
// CommentLikeButton?Ä ?∏Îùº??Î≤ÑÌäº?ºÎ°ú ?ÄÏ≤?import { useAuth } from "../hooks/useAuth";

interface BlogCommentsProps {
  blogId: string;
}

export default function BlogComments({ blogId }: BlogCommentsProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const { currentUser } = useAuth();

  useEffect(() => {
    const q = query(
      collection(db, "blogs", blogId, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [blogId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      setSubmitting(true);
      await addDoc(collection(db, "blogs", blogId, "comments"), {
        content: newComment.trim(),
        authorId: currentUser?.uid || null,
        authorName: currentUser?.displayName || "?µÎ™Ö",
        authorPhotoURL: currentUser?.photoURL || null,
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
      });
      setNewComment("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("?ìÍ?????†ú?òÏãúÍ≤†Ïäµ?àÍπå?")) return;
    await deleteDoc(doc(db, "blogs", blogId, "comments", id));
  };

  const handleEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return;
    await updateDoc(doc(db, "blogs", blogId, "comments", id), {
      content: editContent.trim(),
      updatedAt: serverTimestamp(),
    });
    setEditingId(null);
    setEditContent("");
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="font-semibold mb-2">?ìÍ?</h4>
      <ul className="space-y-2 mb-4">
        {comments.map((c) => (
          <li key={c.id} className="border p-3 rounded-xl bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
            {editingId === c.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="border p-2 w-full rounded dark:bg-gray-900 dark:border-gray-700"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(c.id)}
                    className="bg-green-500 text-white px-3 py-1 rounded"
                  >
                    ?Ä??                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-400 text-white px-3 py-1 rounded"
                  >
                    Ï∑®ÏÜå
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                {c.authorPhotoURL ? (
                  <img
                    src={c.authorPhotoURL}
                    alt="?ÑÎ°ú??
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-sm dark:bg-gray-700 dark:text-gray-200">
                    {c.authorName ? c.authorName[0] : "?"}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {c.authorName || "?µÎ™Ö"}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleString() : ""}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mt-1 dark:text-gray-200">{c.content}</p>
                  <div className="mt-2 flex gap-3 items-center text-xs">
                    <button
                      onClick={() => handleEdit(c.id, c.content)}
                      className="text-blue-500"
                    >
                      ?òÏ†ï
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-500"
                    >
                      ??†ú
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!currentUser) return alert("Î°úÍ∑∏???ÑÏöî");
                        const hasLiked = c.likedBy?.includes(currentUser.uid);
                        const refDoc = doc(db, "blogs", blogId, "comments", c.id);
                        await updateDoc(refDoc, {
                          likes: hasLiked ? (c.likes || 0) - 1 : (c.likes || 0) + 1,
                          likedBy: hasLiked
                            ? arrayRemove(currentUser.uid)
                            : arrayUnion(currentUser.uid),
                        });
                      }}
                      className={`${c.likedBy?.includes(currentUser?.uid) ? "text-pink-500" : "text-gray-400"}`}
                    >
                      ?§Ô∏è {c.likes || 0}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="?ìÍ????ÖÎ†•?òÏÑ∏??.."
          className="flex-1 border p-2 rounded dark:bg-gray-900 dark:border-gray-700"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {submitting ? "?ëÏÑ± Ï§?.." : "?ëÏÑ±"}
        </button>
      </form>
    </div>
  );
}


