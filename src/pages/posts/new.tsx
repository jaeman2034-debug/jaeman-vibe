import { useState } from "react";
import { addDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useNavigate, useParams } from "react-router-dom";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../../lib/firebase";

export default function NewPostPage() {
  const { teamId } = useParams<{ teamId?: string }>();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log("?“ [DEBUG] ê¸€?°ê¸° ?œì‘", { title, content, tags, image });

      // ì¤‘ë³µ ì²´í¬: ê°™ì? ?œëª©??ê¸€???´ë? ?ˆëŠ”ì§€ ?•ì¸
      const existingQuery = query(
        collection(db, "posts"),
        where("title", "==", title),
        where("teamId", "==", teamId || null)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        console.log("? ï¸ [DEBUG] ?´ë? ê°™ì? ?œëª©??ê¸€??ì¡´ì¬?©ë‹ˆ??);
        alert("?´ë? ê°™ì? ?œëª©??ê¸€??ì¡´ì¬?©ë‹ˆ?? ?œëª©??ë³€ê²½í•´ì£¼ì„¸??");
        return;
      }

      let imageUrl: string | null = null;
      if (image) {
        console.log("?“¸ [DEBUG] ?´ë?ì§€ ?…ë¡œ???œë„:", image.name);
        const imgRef = ref(storage, `posts/${Date.now()}-${image.name}`);
        await uploadBytes(imgRef, image);
        imageUrl = await getDownloadURL(imgRef);
        console.log("??[DEBUG] ?´ë?ì§€ ?…ë¡œ???±ê³µ:", imageUrl);
      }

      const docRef = await addDoc(collection(db, "posts"), {
        title,
        content,
        tags: tags.split(",").map((t) => t.trim()),
        imageUrl,
        thumbnailUrl: imageUrl || `https://picsum.photos/400/300?random=${Date.now()}`, // ?¸ë„¤??ì¶”ê?
        teamId: teamId || null, // ?€ ID ?€??(?¼ë°˜ ?¬ìŠ¤?¸ëŠ” null)
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        views: 0,
        authorUid: "demo-admin", // TODO: ?¤ì œ ë¡œê·¸???¬ìš©??uidë¡?êµì²´
        authorName: teamId ? `?€ ${teamId} ê´€ë¦¬ì` : "ê´€ë¦¬ì FC88", // ?€ë³„ë¡œ ?¤ë¥¸ ?‘ì„±?ëª…
               authorIcon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f59e0b'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-family='system-ui, sans-serif' font-size='16' font-weight='bold'%3EFC88%3C/text%3E%3C/svg%3E",
      });

      console.log("??[DEBUG] ê²Œì‹œê¸€ ?ì„± ?±ê³µ:", docRef.id);
      
      // ?€ë³„ë¡œ ?¤ë¥¸ ê²½ë¡œë¡?ë¦¬ë‹¤?´ë ‰??      if (teamId) {
        navigate(`/teams/${teamId}/posts/${docRef.id}`);
      } else {
        navigate(`/posts/${docRef.id}`);
      }
    } catch (err) {
      console.error("??[DEBUG] ê²Œì‹œê¸€ ?‘ì„± ?¤íŒ¨:", err);
      alert("ê²Œì‹œê¸€ ?‘ì„± ?¤íŒ¨: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
            ?ï¸ ??ê¸€ ?‘ì„±
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ?œëª© *
              </label>
              <input
                type="text"
                placeholder="?œëª©???…ë ¥?˜ì„¸??
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ?´ìš© *
              </label>
              <textarea
                placeholder="?´ìš©???…ë ¥?˜ì„¸??
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-40 resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ?œê·¸
              </label>
              <input
                type="text"
                placeholder="?œê·¸ ?…ë ¥ (?¼í‘œë¡?êµ¬ë¶„)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ?? ì¶•êµ¬, FC88, ê³µì??¬í•­
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ?´ë?ì§€ ì²¨ë?
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {image && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  ?“ {image.name} ? íƒ??                </p>
              )}
            </div>

            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={loading || !title.trim() || !content.trim()}
                className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200 ${
                  loading || !title.trim() || !content.trim()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-105"
                } text-white shadow-lg`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ?‘ì„± ì¤?..
                  </div>
                ) : (
                  "?“ ê²Œì‹œê¸€ ?±ë¡"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
