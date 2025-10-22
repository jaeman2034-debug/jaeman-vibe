import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, orderBy, query, getDoc, doc, writeBatch, setDoc, limit, getDocs, startAfter } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [startY, setStartY] = useState<number | null>(null);
  const [offsetY, setOffsetY] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [toasts, setToasts] = useState<
    { id: string; message: string; blogId?: string; teamId?: string; thumbnailUrl?: string; type?: string }[]
  >([]);
  const [backupNotifs, setBackupNotifs] = useState<any[]>([]);
  const [highlightIds, setHighlightIds] = useState<string[]>([]);
  const [restoredIds, setRestoredIds] = useState<string[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [skeletonCount, setSkeletonCount] = useState(3);

  useEffect(() => {
    const calcSkeletons = () => {
      const vh = window.innerHeight;
      const perCard = 80; // Ïπ¥Îìú ?íÏù¥(px)
      const count = Math.max(3, Math.ceil(vh / perCard));
      setSkeletonCount(count);
    };
    calcSkeletons();
    window.addEventListener("resize", calcSkeletons);
    return () => window.removeEventListener("resize", calcSkeletons);
  }, []);

  useEffect(() => {
    if (!hasMore || !loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );
    observer.observe(loadMoreRef.current);
    return () => {
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current);
    };
  }, [hasMore, loadMoreRef.current]);

  // Firestore Íµ¨ÎèÖ + Î°úÏª¨?§ÌÜ†Î¶¨Ï? ?ôÍ∏∞??  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);

    const unsub = onSnapshot(userRef, (snap) => {
      const data = snap.data() as any | undefined;
      if (data && data.notifFilter) {
        setFilter(data.notifFilter);
      } else if (typeof window !== "undefined") {
        const saved = localStorage.getItem(`notifFilter_${currentUser.uid}`);
        if (saved) setFilter(saved);
      }
    });

    return () => unsub();
  }, [currentUser]);

  // ?ÑÌÑ∞ Î≥ÄÍ≤???Firestore + Î°úÏª¨?§ÌÜ†Î¶¨Ï????Ä??  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    setDoc(userRef, { notifFilter: filter }, { merge: true }).catch((err) =>
      console.error("notifFilter ?Ä???§Ìå®", err)
    );

    if (typeof window !== "undefined") {
      localStorage.setItem(`notifFilter_${currentUser.uid}`, filter);
    }
  }, [filter, currentUser]);

  const getFilteredNotifs = () => {
    if (filter === "restored") {
      return notifications.filter((n) => restoredIds.includes(n.id));
    }
    if (filter === "all") return notifications;
    return notifications.filter((n) => n.type === filter);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((res) => setTimeout(res, 800));
    setRefreshing(false);
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate(30);
      } catch {}
    }
    let toastData: any = { message: "??ÏµúÏã† ?åÎ¶º?ºÎ°ú Í∞±Ïã†?? };
    if (notifications.length > 0) {
      const latest: any = notifications[0];
      switch (latest?.type) {
        case "comment":
          toastData = { message: "?í¨ ?àÎ°ú???ìÍ? ?åÎ¶º???ÑÏ∞©?àÏñ¥??", blogId: latest.blogId, type: "comment" };
          break;
        case "like":
          toastData = { message: "?§Ô∏è ??Í∏Ä???àÎ°ú??Ï¢ãÏïÑ?îÍ? ?¨Î†∏?µÎãà??", blogId: latest.blogId, type: "like" };
          break;
        case "follow":
          toastData = { message: "‚≠??àÎ°ú???îÎ°ú?åÍ? ?ùÍ≤º?µÎãà??", teamId: latest.teamId, type: "follow" };
          break;
        case "system":
          toastData = { message: "?ôÔ∏è ?àÎ°ú???úÏä§???åÎ¶º???àÏäµ?àÎã§.", type: "system" };
          break;
        default:
          toastData = { message: "??ÏµúÏã† ?åÎ¶º?ºÎ°ú Í∞±Ïã†?? };
      }
    }

    // Î∏îÎ°úÍ∑??∏ÎÑ§??Î∂àÎü¨?§Í∏∞ (?àÏúºÎ©?Ï∂îÍ?)
    if (toastData.blogId) {
      try {
        const snap = await getDoc(doc(db, "blogs", toastData.blogId));
        if (snap.exists()) {
          const data = snap.data();
          if (data.imageUrl) {
            toastData.thumbnailUrl = data.imageUrl;
          }
        }
      } catch (err) {
        console.warn("?∏ÎÑ§??Î°úÎìú ?§Ìå®", err);
      }
    }

    const id = Date.now().toString();
    const newToast = { id, ...toastData };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  };

  useEffect(() => {
    if (open) {
      setIsOpening(true);
      const t = setTimeout(() => setIsOpening(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  const triggerClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    const q = query(
      collection(db, "users", currentUser.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.docs.length > 0) {
        const notifs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setNotifications(notifs as any[]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === 50);
      } else {
        setNotifications([]);
        setHasMore(false);
      }
    });
    return () => unsub();
  }, [currentUser]);

  if (!open) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY !== null) {
      const diff = e.touches[0].clientY - startY;
      if (diff > 0) setOffsetY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (offsetY > 50) {
      triggerClose();
    } else {
      setOffsetY(0);
    }
    setStartY(null);
  };

  return (
    <div
      className={`fixed inset-0 bg-white z-50 flex flex-col transition-all duration-300 ease-out ${
        isClosing
          ? "opacity-0 translate-y-full"
          : isOpening
          ? "opacity-0 translate-y-full"
          : "opacity-100 translate-y-0"
      }`}
      style={{ transform: `translateY(${offsetY}px)` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col-reverse gap-3 items-center w-full pointer-events-none">
          {toasts.length > 3 ? (
            <>
              {toasts.slice(-2).map((toast) => (
                <div
                  key={toast.id}
                  onClick={() => {
                    if (toast.blogId) {
                      window.location.href = `/blogs/${toast.blogId}`;
                    } else if (toast.teamId) {
                      window.location.href = `/teams/${toast.teamId}/blogs`;
                    } else {
                      window.location.href = "/notifications";
                    }
                  }}
                  className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-fadeIn cursor-pointer flex items-center gap-2 w-[90%] max-w-sm pointer-events-auto"
                >
                  {toast.thumbnailUrl ? (
                    <img src={toast.thumbnailUrl} alt="?∏ÎÑ§?? className="w-8 h-8 rounded object-cover" />
                  ) : toast.type === "comment" ? (
                    <span className="text-lg">?í¨</span>
                  ) : toast.type === "like" ? (
                    <span className="text-lg">?§Ô∏è</span>
                  ) : toast.type === "follow" ? (
                    <span className="text-lg">‚≠?/span>
                  ) : toast.type === "system" ? (
                    <span className="text-lg">?ôÔ∏è</span>
                  ) : (
                    <span className="text-lg">?îî</span>
                  )}
                  <span className="truncate">{toast.message}</span>
                </div>
              ))}
              <div
                onClick={async () => {
                  try {
                    if (currentUser) {
                      const batch = writeBatch(db);
                      notifications.forEach((n: any) => {
                        const ref = doc(db, "users", currentUser.uid, "notifications", n.id);
                        batch.update(ref, { isRead: true });
                      });
                      await batch.commit();
                    }

                    // Haptic Feedback
                    if ("vibrate" in navigator) {
                      try { navigator.vibrate(30); } catch {}
                    }

                    // ?ïÏù∏??Toast Ï∂îÍ?
                    const id = Date.now().toString();
                    setToasts((prev) => [
                      ...prev,
                      { id, message: "??Î™®Îëê ?ΩÏùå Ï≤òÎ¶¨??, type: "system" },
                    ]);
                    setTimeout(() => {
                      setToasts((prev) => prev.filter((t) => t.id !== id));
                    }, 2000);
                  } catch (e) {
                    console.warn("Î™®Îëê ?ΩÏùå Ï≤òÎ¶¨ ?§Ìå®", e);
                  } finally {
                    window.location.href = "/notifications";
                  }
                }}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-fadeIn cursor-pointer flex items-center gap-2 w-[90%] max-w-sm pointer-events-auto"
              >
                <span className="text-lg">?îî</span>
                <span>+{toasts.length - 2}Í∞úÏùò ?åÎ¶º</span>
              </div>
            </>
          ) : (
            toasts.map((toast) => (
              <div
                key={toast.id}
                className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-fadeIn flex items-center gap-2 w-[90%] max-w-sm pointer-events-auto"
              >
                {toast.thumbnailUrl ? (
                  <img src={toast.thumbnailUrl} alt="?∏ÎÑ§?? className="w-8 h-8 rounded object-cover" />
                ) : toast.type === "comment" ? (
                  <span className="text-lg">?í¨</span>
                ) : toast.type === "like" ? (
                  <span className="text-lg">?§Ô∏è</span>
                ) : toast.type === "follow" ? (
                  <span className="text-lg">‚≠?/span>
                ) : toast.type === "system" ? (
                  <span className="text-lg">?ôÔ∏è</span>
                ) : toast.type === "undo-delete" ? (
                  <span className="text-lg">?óëÔ∏?/span>
                ) : (
                  <span className="text-lg">?îî</span>
                )}
                <span className="truncate">{toast.message}</span>

                {toast.type === "undo-delete" && backupNotifs.length > 0 && (
                  <button
                    onClick={async () => {
                      if (!currentUser) return;
                      const batch = writeBatch(db);
                      backupNotifs.forEach((n) => {
                        const ref = doc(
                          db,
                          "users",
                          currentUser.uid,
                          "notifications",
                          n.id
                        );
                        batch.set(ref, n); // Î≥µÏõê
                      });
                      await batch.commit();
                      setBackupNotifs([]);
                      setToasts((prev) => prev.filter((t) => t.id !== toast.id));

                      // Haptic Feedback
                      if ("vibrate" in navigator) {
                        try { navigator.vibrate(30); } catch {}
                      }

                      // Î≥µÏõê Toast Î©îÏãúÏßÄ Ï∂îÍ?
                      const id = Date.now().toString();
                      setToasts((prev) => [
                        ...prev,
                        { id, message: "?©Ô∏è ?åÎ¶º??Î≥µÏõê??, type: "system" },
                      ]);
                      setTimeout(() => {
                        setToasts((prev) => prev.filter((t) => t.id !== id));
                      }, 2000);

                      // Î≥µÏõê???åÎ¶º ?òÏù¥?ºÏù¥??+ Î∞∞Ï?
                      setHighlightIds(backupNotifs.map((n) => n.id));
                      setRestoredIds(backupNotifs.map((n) => n.id));
                      setTimeout(() => {
                        setHighlightIds([]);
                        setRestoredIds([]);
                      }, 3000);
                    }}
                    className="ml-auto text-blue-300 hover:text-blue-400 text-xs underline"
                  >
                    ?òÎèåÎ¶¨Í∏∞
                  </button>
                )}

                {toast.type !== "undo-delete" && (
                  <div
                    onClick={() => {
                      if (toast.blogId) {
                        window.location.href = `/blogs/${toast.blogId}`;
                      } else if (toast.teamId) {
                        window.location.href = `/teams/${toast.teamId}/blogs`;
                      } else {
                        window.location.href = "/notifications";
                      }
                    }}
                    className="flex-1 cursor-pointer"
                  />
                )}
              </div>
            ))
          )}
        </div>
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold">?åÎ¶º?ºÌÑ∞</h2>
          {notifications.length > 0 && (
            <>
              <button
                onClick={async () => {
                  if (!currentUser) return;
                  const batch = writeBatch(db);
                  notifications.forEach((n) => {
                    if (!n.isRead) {
                      const ref = doc(
                        db,
                        "users",
                        currentUser.uid,
                        "notifications",
                        n.id
                      );
                      batch.update(ref, { isRead: true });
                    }
                  });
                  await batch.commit();

                  // Haptic Feedback
                  if ("vibrate" in navigator) {
                    try { navigator.vibrate(30); } catch {}
                  }

                  // Toast Î©îÏãúÏßÄ ?úÏãú
                  const id = Date.now().toString();
                  setToasts((prev) => [
                    ...prev,
                    { id, message: "??Î™®Îëê ?ΩÏùå Ï≤òÎ¶¨??, type: "system" },
                  ]);
                  setTimeout(() => {
                    setToasts((prev) => prev.filter((t) => t.id !== id));
                  }, 2000);
                }}
                className="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              >
                Î™®Îëê ?ΩÏùå
              </button>
              <button
                onClick={async () => {
                  if (!currentUser) return;

                  // ??†ú ??Î∞±ÏóÖ
                  setBackupNotifs(notifications);

                  // Firestore?êÏÑú ??†ú
                  const batch = writeBatch(db);
                  notifications.forEach((n) => {
                    const ref = doc(
                      db,
                      "users",
                      currentUser.uid,
                      "notifications",
                      n.id
                    );
                    batch.delete(ref);
                  });
                  await batch.commit();

                  // Haptic Feedback
                  if ("vibrate" in navigator) {
                    try { navigator.vibrate(30); } catch {}
                  }

                  // Toast (Undo Î≤ÑÌäº ?¨Ìï®)
                  const id = Date.now().toString();
                  setToasts((prev) => [
                    ...prev,
                    { id, message: "?óëÔ∏?Î™®Îì† ?åÎ¶º????†ú??(?òÎèåÎ¶¨Í∏∞ Í∞Ä??", type: "undo-delete" },
                  ]);

                  // 5Ï¥???Î∞±ÏóÖ ?êÍ∏∞
                  setTimeout(() => setBackupNotifs([]), 5000);
                }}
                className="text-sm px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
              >
                Î™®Îëê ??†ú
              </button>
            </>
          )}
          <button onClick={onClose} className="text-xl">??/button>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded ${
              filter === "all" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            ?ÑÏ≤¥
          </button>
          <button
            onClick={() => setFilter("comment")}
            className={`px-3 py-1 rounded ${
              filter === "comment" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            ?ìÍ?
          </button>
          <button
            onClick={() => setFilter("like")}
            className={`px-3 py-1 rounded ${
              filter === "like" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Ï¢ãÏïÑ??          </button>
          <button
            onClick={() => setFilter("follow")}
            className={`px-3 py-1 rounded ${
              filter === "follow" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            ?îÎ°ú??          </button>
          <button
            onClick={() => setFilter("system")}
            className={`px-3 py-1 rounded ${
              filter === "system" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            ?úÏä§??          </button>

          {/* Î≥µÏõê???†Í? */}
          <div className="ml-auto flex items-center gap-1">
            <span className="text-xs text-gray-600">
              {filter === "restored" ? "Î≥µÏõê?? : "?ÑÏ≤¥"}
            </span>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={filter === "restored"}
                  onChange={(e) => setFilter(e.target.checked ? "restored" : "all")}
                  className="sr-only"
                />
                <div className="block w-10 h-5 bg-gray-300 rounded-full"></div>
                <div
                  className={`dot absolute left-1 top-0.5 w-4 h-4 rounded-full transition ${
                    filter === "restored" ? "translate-x-5 bg-green-600" : "bg-white"
                  }`}
                ></div>
              </div>
            </label>
          </div>
        </div>
      </div>
      <div
        className="flex-1 overflow-y-auto p-4"
        onTouchStart={(e) => setStartY(e.touches[0].clientY)}
        onTouchMove={(e) => {
          const el = e.currentTarget as HTMLElement;
          if (startY !== null && el.scrollTop === 0) {
            const diff = e.touches[0].clientY - startY;
            if (diff > 0) setPullY(diff);
          }
        }}
        onTouchEnd={() => {
          if (pullY > 60) {
            handleRefresh();
          }
          setPullY(0);
        }}
        style={{ transform: `translateY(${pullY}px)` }}
      >
        {refreshing && (
          <div className="text-center text-sm text-gray-500 mb-2">?îÑ ?àÎ°úÍ≥†Ïπ® Ï§?..</div>
        )}
        {notifications.length === 0 ? (
          <p className="text-gray-500">?åÎ¶º???ÜÏäµ?àÎã§.</p>
        ) : (
          <ul className="space-y-3">
            

            {getFilteredNotifs().map((n) => (
              <li
                key={n.id}
                className={`p-3 rounded-lg border ${
                  filter === "restored" ? "border-green-500" : "border-gray-200"
                } ${
                  highlightIds.includes(n.id)
                    ? "bg-yellow-100"
                    : n.isRead
                    ? "bg-gray-50"
                    : "bg-blue-50"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{n.title}</p>
                    {restoredIds.includes(n.id) && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilter("restored");
                        }}
                        className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded cursor-pointer"
                      >
                        Î≥µÏõê??                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{n.body}</p>
                  <span className="text-xs text-gray-400">
                    {n.createdAt?.toDate?.() ? n.createdAt.toDate().toLocaleString() : ""}
                  </span>
                </div>
              </li>
            ))}

          {hasMore && (
            <div ref={loadMoreRef} className="mt-6 w-full">
              {loadingMore ? (
                <ul className="space-y-3">
                  {(() => {
                    const total = notifications.length;
                    const counts = {
                      comment: notifications.filter((n) => (n as any).type === "comment").length,
                      like: notifications.filter((n) => (n as any).type === "like").length,
                      follow: notifications.filter((n) => (n as any).type === "follow").length,
                    };
                    const ratios = total
                      ? {
                          comment: counts.comment / total,
                          like: counts.like / total,
                          follow: counts.follow / total,
                        }
                      : { comment: 0.6, like: 0.3, follow: 0.1 };
                    const pickType = () => {
                      const r = Math.random();
                      if (r < ratios.comment) return "comment" as const;
                      if (r < ratios.comment + ratios.like) return "like" as const;
                      return "follow" as const;
                    };
                    return Array.from({ length: skeletonCount }).map((_, i) => {
                      const fakeType = pickType();

                      // ?Ä?ÖÎ≥Ñ ?çÏä§??Í∏∏Ïù¥ ?®ÌÑ¥
                      let titleWidth: string;
                      let bodyWidth: string;
                      if (fakeType === "comment") {
                        titleWidth = `${20 + Math.random() * 20}%`; // 20~40%
                        bodyWidth = `${30 + Math.random() * 20}%`; // 30~50%
                      } else if (fakeType === "like") {
                        titleWidth = `${30 + Math.random() * 30}%`; // 30~60%
                        bodyWidth = `${40 + Math.random() * 30}%`; // 40~70%
                      } else {
                        // follow
                        titleWidth = `${50 + Math.random() * 30}%`; // 50~80%
                        bodyWidth = `${60 + Math.random() * 30}%`; // 60~90%
                      }

                      const timeWidth = `${20 + Math.random() * 20}%`;
                      return (
                        <li
                          key={i}
                          className="p-3 rounded-lg border bg-gray-100 dark:bg-gray-800 flex gap-3 items-center"
                        >
                          {fakeType === "comment" && (
                            <div className="w-10 h-10 shimmer-base shimmer-circle flex items-center justify-center text-blue-400">
                              <span role="img" aria-label="comment">?í¨</span>
                            </div>
                          )}
                          {fakeType === "like" && (
                            <div className="w-10 h-10 shimmer-base shimmer-circle flex items-center justify-center text-red-400">
                              <span role="img" aria-label="like">?§Ô∏è</span>
                            </div>
                          )}
                          {fakeType === "follow" && (
                            <div className="w-10 h-10 shimmer-base shimmer-circle flex items-center justify-center text-yellow-400">
                              <span role="img" aria-label="follow">‚≠êÔ∏è</span>
                            </div>
                          )}
                          <div className="flex-1 space-y-2 relative pl-5">
                            <span className="absolute left-0 top-0.5 flex items-center gap-1 text-xs">
                              {fakeType === "comment" && (
                                <>
                                  <span className="text-blue-400">?í¨</span>
                                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                </>
                              )}
                              {fakeType === "like" && (
                                <>
                                  <span className="text-red-400">?§Ô∏è</span>
                                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                </>
                              )}
                              {fakeType === "follow" && (
                                <>
                                  <span className="text-yellow-400">‚≠êÔ∏è</span>
                                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                                </>
                              )}
                            </span>
                            <div className="h-3 shimmer-base shimmer-rounded" style={{ width: titleWidth }}></div>
                            <div className="h-3 shimmer-base shimmer-rounded" style={{ width: bodyWidth }}></div>
                            <div className="h-2 shimmer-base shimmer-rounded" style={{ width: timeWidth }}></div>
                          </div>
                        </li>
                      );
                    });
                  })()}
                </ul>
              ) : (
                <div className="flex justify-center text-gray-500 text-sm">
                  ?§ÌÅ¨Î°§ÌïòÎ©??êÎèô?ºÎ°ú Î∂àÎü¨?µÎãà??                </div>
              )}
            </div>
          )}
          </ul>
        )}
      </div>
    </div>
  );
}
