import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
  startAfter,
  getDoc,
} from "firebase/firestore";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

type Notif = {
  id: string;
  type: "mention" | "comment" | "finance" | "system";
  title: string;
  body: string;
  link?: string;
  createdAt: string;
  read: boolean;
  meta?: {
    memberName?: string;
    annId?: string;
    postId?: string;
  };
};

export default function NotificationsCenter() {
  const nav = useNavigate();
  const [teamId] = useState("soheul-fc60");      // ?�요 ???�큰/컨텍?�트�?치환
  const [memberDocId, setMemberDocId] = useState<string | null>(null);
  const [items, setItems] = useState<Notif[]>([]);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(true);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string>("all");
  const [cursorDoc, setCursorDoc] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // 블로�??�네??가?�오�?(메모?�즈)
  const fetchThumbnail = useCallback(async (blogId: string) => {
    if (!blogId || thumbnails[blogId]) return;
    try {
      const snap = await getDoc(doc(db, "blogs", blogId));
      if (snap.exists()) {
        const data = snap.data() as any;
        if (data?.imageUrl) {
          setThumbnails((prev) => ({ ...prev, [blogId]: data.imageUrl }));
        }
      }
    } catch (error) {
      console.error("?�네??불러?�기 ?�패:", error);
    }
  }, [thumbnails]);

  // ?�재 ?�용????멤버 문서 ?�색(문서 id가 uid??구조가 가??좋음)
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { 
        setMemberDocId(null); 
        setItems([]); 
        return; 
      }
      
      // 멤버 문서 id = uid �??�계?�다�?
      setMemberDocId(user.uid);

      // 만약 id가 uid가 ?�니?�면, ?�음�?같이 ?�색:
      // const mCol = collection(db, "teams", teamId, "members");
      // const mSnap = await getDocs(query(mCol, where("uid", "==", user.uid)));
      // if (!mSnap.empty) setMemberDocId(mSnap.docs[0].id);
    });
    return () => unsub();
  }, [teamId]);

  // ?�시�?구독 (최신 20�?
  useEffect(() => {
    if (!memberDocId) return;
    
    try {
      const base = collection(db, "teams", teamId, "members", memberDocId, "notifications");
      const q = onlyUnread
        ? query(base, where("read", "==", false), orderBy("createdAt", "desc"), limit(20))
        : query(base, orderBy("createdAt", "desc"), limit(20));

      const unsub = onSnapshot(q, 
        (snap) => {
          const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Notif[];
          setItems(docs);
          setCursorDoc(snap.docs.at(-1) ?? null);
        },
        (error) => {
          console.error("?�림 구독 ?�류:", error);
          // ?�류 발생 ??�?배열�??�정
          setItems([]);
          setCursorDoc(null);
        }
      );

      return () => unsub();
    } catch (error) {
      console.error("?�림 구독 초기???�류:", error);
      setItems([]);
      setCursorDoc(null);
    }
  }, [memberDocId, onlyUnread, teamId]);

  // 반응?? 모바???��? 감�?
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const openLink = (n: Notif) => {
    if (n.link) {
      nav(n.link);
      // 링크 ?�릭 ???�동?�로 ?�음 처리
      markAsRead(n);
    }
  };

  const markAsRead = async (n: Notif) => {
    if (!memberDocId || n.read) return;
    
    try {
      const ref = doc(db, "teams", teamId, "members", memberDocId, "notifications", n.id);
      await updateDoc(ref, { read: true });
    } catch (error) {
      console.error("?�음 처리 ?�패:", error);
    }
  };

  const markAllRead = async () => {
    if (!memberDocId) return;
    
    try {
      const base = collection(db, "teams", teamId, "members", memberDocId, "notifications");
      // 최신 100�??�도 ?�괄 처리 (?�요 ???�라?�드?�션?�로 offload)
      const snap = await getDocs(query(base, where("read", "==", false), limit(100)));
      await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { read: true })));
    } catch (error) {
      console.error("모두 ?�음 처리 ?�패:", error);
    }
  };

  const loadMore = async () => {
    if (!memberDocId || !cursorDoc || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const base = collection(db, "teams", teamId, "members", memberDocId, "notifications");
      const q = onlyUnread
        ? query(base, where("read", "==", false), orderBy("createdAt", "desc"), startAfter(cursorDoc), limit(20))
        : query(base, orderBy("createdAt", "desc"), startAfter(cursorDoc), limit(20));
      
      const snap = await getDocs(q);
      const more = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Notif[];
      setItems((prev) => [...prev, ...more]);
      setCursorDoc(snap.docs.at(-1) ?? null);
    } catch (error) {
      console.error("??보기 로드 ?�패:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "mention": return "?��";
      case "comment": return "?��";
      case "finance": return "?��";
      case "system": return "?�️";
      default: return "?��";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "mention": return "bg-blue-50 border-blue-200";
      case "comment": return "bg-green-50 border-green-200";
      case "finance": return "bg-yellow-50 border-yellow-200";
      case "system": return "bg-gray-50 border-gray-200";
      default: return "bg-white border-gray-200";
    }
  };

  if (!memberDocId) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold mb-4">?�림?�터</h1>
          <p className="text-gray-600">로그?�이 ?�요?�니??</p>
        </div>
      </div>
    );
  }

  // 모바?? ?�?�크�?모달
  if (isMobile) {
    return (
      open && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-bold">?�림?�터</h2>
            <button onClick={() => setOpen(false)} className="text-xl">??/button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">?�림???�습?�다.</div>
            ) : (
              <ul className="space-y-3">
                {items
                  .filter((n) => (filter === "all" ? true : n.type === filter))
                  .map((n) => (
                    <li
                      key={n.id}
                      className={`p-4 border rounded-lg cursor-pointer ${n.read ? "bg-white" : "bg-amber-50"}`}
                      onClick={() => openLink(n)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-gray-800 truncate">{n.title}</div>
                        <div className="text-xs text-gray-500 ml-2 whitespace-nowrap">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="text-sm text-gray-600 line-clamp-2">{n.body}</div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-800">
              ?�� ?�림?�터
            </h1>
          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm"
            >
              <option value="all">?�체</option>
              <option value="comment">?��?</option>
              <option value="like">좋아??/option>
              <option value="follow">?�로??/option>
              <option value="mention">멘션</option>
              <option value="finance">?�계</option>
              <option value="system">?�스??/option>
            </select>
            <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg">
              <span className="font-bold text-lg">{unreadCount}</span>
              <span className="text-sm ml-1">미확??/span>
            </div>
            <button 
              onClick={() => setOnlyUnread((v) => !v)} 
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-all duration-200 hover:scale-105"
            >
              {onlyUnread ? "?�체 보기" : "미확?�만"}
            </button>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead} 
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium transition-all duration-200 hover:scale-105 shadow-md"
              >
                모두 ?�음 처리
              </button>
            )}
            {items.length > 0 && (
              <button
                onClick={async () => {
                  try {
                    const base = collection(db, "teams", teamId, "members", memberDocId as string, "notifications");
                    const snap = await getDocs(query(base, limit(100)));
                    await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { __toDelete: true })));
                    // ?�제 ??�� ?�행
                    await Promise.all(snap.docs.map((d) => d.ref.delete()));
                  } catch (error) {
                    console.error("모두 ??�� ?�패:", error);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-all duration-200 hover:scale-105 shadow-md"
              >
                모두 ??��
              </button>
            )}
          </div>
          </div>

          {items.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">?��</div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            {onlyUnread ? "미확???�림???�습?�다" : "?�림???�습?�다"}
          </h2>
          <p className="text-gray-500">
            {onlyUnread ? "모든 ?�림???�인?�습?�다!" : "?�로???�림???�면 ?�기???�시?�니??"}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items
            .filter((n) => (filter === "all" ? true : n.type === filter))
            .map((n) => {
              let icon = "?��";
              let iconBg = "bg-gray-100";
              let iconColor = "text-gray-600";
              
              if (n.type === "comment") {
                icon = "?��";
                iconBg = "bg-blue-100";
                iconColor = "text-blue-600";
              }
              if (n.type === "like") {
                icon = "?�️";
                iconBg = "bg-red-100";
                iconColor = "text-red-600";
              }
              if (n.type === "follow") {
                icon = "�?;
                iconBg = "bg-yellow-100";
                iconColor = "text-yellow-600";
              }
              if (n.type === "mention") {
                icon = "?��";
                iconBg = "bg-purple-100";
                iconColor = "text-purple-600";
              }
              if (n.type === "finance") {
                icon = "?��";
                iconBg = "bg-green-100";
                iconColor = "text-green-600";
              }
              if (n.type === "system") {
                icon = "?�️";
                iconBg = "bg-gray-100";
                iconColor = "text-gray-600";
              }

              return (
                <li
                  key={n.id}
                  className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] flex items-center gap-4 ${n.read ? "bg-white border-gray-200" : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"} ${getNotificationColor(n.type)}`}
                  onClick={() => openLink(n)}
                >
                  <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <span className="text-xl">{icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 truncate">{n.title}</h3>
                        {!n.read && (
                          <div className="w-2 h-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 whitespace-pre-line mb-3 leading-relaxed">
                      {n.body}
                    </p>

                    {n.link && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 mb-2">
                        <span>?��</span>
                        <span>?�릭?�여 ?�동</span>
                      </div>
                    )}

                    {!n.read && (
                      <div className="flex justify-end">
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            markAsRead(n); 
                          }}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-medium transition-all duration-200 hover:scale-105 shadow-sm"
                        >
                          ?�음 ?�시
                        </button>
                      </div>
                    )}
                  </div>
                  {n?.meta?.postId || (n as any).blogId ? (
                    (() => {
                      const blogId = (n as any).blogId || n?.meta?.postId;
                      return (
                        <div
                          className="w-12 h-12 rounded overflow-hidden flex-shrink-0 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (blogId) {
                              window.location.href = `/blogs/${blogId}`;
                            }
                          }}
                        >
                          {(() => {
                            if (blogId) fetchThumbnail(blogId);
                            const url = blogId ? thumbnails[blogId] : undefined;
                            if (url) {
                              return (
                                <img src={url} alt="?�네?? className="w-full h-full object-cover hover:opacity-90" />
                              );
                            }
                            // 종류�??�모지 기반 fallback
                            return (
                              <div className={`w-full h-full ${iconBg} flex items-center justify-center`}>
                                <span className="text-lg">{icon}</span>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })()
                  ) : null}
                </li>
              );
            })}
        </ul>
      )}

          {cursorDoc && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200 hover:scale-105 shadow-md"
                disabled={loadingMore}
              >
                {loadingMore ? "불러?�는 �?.." : "??보기"}
              </button>
            </div>
          )}

          {!cursorDoc && items.length > 0 && (
            <div className="text-center mt-8 text-gray-500 text-sm bg-gray-50 py-4 rounded-lg">
              ???�상 불러???�림???�습?�다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
