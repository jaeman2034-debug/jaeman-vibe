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
      console.log("?�� [DEBUG] 글?�기 ?�작", { title, content, tags, image });

      // 중복 체크: 같�? ?�목??글???��? ?�는지 ?�인
      const existingQuery = query(
        collection(db, "posts"),
        where("title", "==", title),
        where("teamId", "==", teamId || null)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        console.log("?�️ [DEBUG] ?��? 같�? ?�목??글??존재?�니??);
        alert("?��? 같�? ?�목??글??존재?�니?? ?�목??변경해주세??");
        return;
      }

      let imageUrl: string | null = null;
      if (image) {
        console.log("?�� [DEBUG] ?��?지 ?�로???�도:", image.name);
        const imgRef = ref(storage, `posts/${Date.now()}-${image.name}`);
        await uploadBytes(imgRef, image);
        imageUrl = await getDownloadURL(imgRef);
        console.log("??[DEBUG] ?��?지 ?�로???�공:", imageUrl);
      }

      const docRef = await addDoc(collection(db, "posts"), {
        title,
        content,
        tags: tags.split(",").map((t) => t.trim()),
        imageUrl,
        thumbnailUrl: imageUrl || `https://picsum.photos/400/300?random=${Date.now()}`, // ?�네??추�?
        teamId: teamId || null, // ?� ID ?�??(?�반 ?�스?�는 null)
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        views: 0,
        authorUid: "demo-admin", // TODO: ?�제 로그???�용??uid�?교체
        authorName: teamId ? `?� ${teamId} 관리자` : "관리자 FC88", // ?�별로 ?�른 ?�성?�명
               authorIcon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f59e0b'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-family='system-ui, sans-serif' font-size='16' font-weight='bold'%3EFC88%3C/text%3E%3C/svg%3E",
      });

      console.log("??[DEBUG] 게시글 ?�성 ?�공:", docRef.id);
      
      // ?�별로 ?�른 경로�?리다?�렉??      if (teamId) {
        navigate(`/teams/${teamId}/posts/${docRef.id}`);
      } else {
        navigate(`/posts/${docRef.id}`);
      }
    } catch (err) {
      console.error("??[DEBUG] 게시글 ?�성 ?�패:", err);
      alert("게시글 ?�성 ?�패: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
            ?�️ ??글 ?�성
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ?�목 *
              </label>
              <input
                type="text"
                placeholder="?�목???�력?�세??
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ?�용 *
              </label>
              <textarea
                placeholder="?�용???�력?�세??
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-40 resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ?�그
              </label>
              <input
                type="text"
                placeholder="?�그 ?�력 (?�표�?구분)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ?? 축구, FC88, 공�??�항
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ?��?지 첨�?
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {image && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  ?�� {image.name} ?�택??                </p>
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
                    ?�성 �?..
                  </div>
                ) : (
                  "?�� 게시글 ?�록"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
