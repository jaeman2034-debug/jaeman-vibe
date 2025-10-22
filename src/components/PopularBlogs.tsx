import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";

export default function PopularBlogs() {
  const [posts, setPosts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "blogs"), orderBy("likes", "desc"), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  if (posts.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">?�� ?�기 블로�?/h3>
      <ul className="space-y-2">
        {posts.map((post) => (
          <li
            key={post.id}
            className="border p-3 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-gray-50"
            onClick={() => navigate(`/blogs/${post.id}`)}
          >
            <img
              src={post.imageUrl || "/default-placeholder.png"}
              alt="?�네??
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold truncate">{post.title}</span>
                <span className="text-red-500 whitespace-nowrap ml-3">?�️ {post.likes || 0}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                {/* ?� ?�름 ?�시 (?�을 경우�? */}
                {post.teamName && (
                  <p>?�: {post.teamName}</p>
                )}
                {/* ?�성???�시 (?�을 경우�? */}
                {post.authorName && (
                  <p>?�성?? {post.authorName}</p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}


