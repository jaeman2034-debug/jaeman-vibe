import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection, query, where, orderBy, limit, onSnapshot
} from "firebase/firestore";

type Post = {
  id: string;
  title: string;
  content: string;
  createdAt?: any;
  pinned?: boolean;
};

const getThumb = (md: string) => {
  const m = md.match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/);
  return m?.[1] || "";
};

const getExcerpt = (md: string) =>
  md.replace(/!\[[^\]]*\]\([^)]+\)/g, "") // 이미지 마크다운 제거
    .replace(/<[^>]+>/g, "")             // 태그 제거
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);

export default function PublicClubBlog() {
  const { clubId } = useParams();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!clubId) return;
    const q = query(
      collection(db, `clubs/${clubId}/blog`),
      where("published", "==", true),
      orderBy("pinned", "desc"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, [clubId]);

  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">클럽 블로그</div>
      </div>

      <div className="max-w-4xl mx-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {posts.map((p) => {
          const thumb = getThumb(p.content || "");
          const excerpt = getExcerpt(p.content || "");
          return (
            <Link
              key={p.id}
              to={`/clubs/${clubId}/blog/${p.id}`}
              className="rounded-xl border hover:shadow-lg transition overflow-hidden"
            >
              {thumb ? (
                <img src={thumb} alt="" className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-2xl">📝</span>
                </div>
              )}
              <div className="p-4">
                <div className="font-semibold line-clamp-2">{p.title}</div>
                <div className="text-sm text-gray-500 mt-1 line-clamp-2">{excerpt}</div>
                {p.pinned && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                    📌 고정
                  </span>
                )}
              </div>
            </Link>
          );
        })}
        {posts.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            아직 게시글이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
