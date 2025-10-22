import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import NotificationCenter from "./NotificationCenter";

export default function Navbar() {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }
    const qUnread = query(
      collection(db, "users", currentUser.uid, "notifications"),
      where("isRead", "==", false)
    );
    const unsub = onSnapshot(qUnread, (snap) => {
      setUnreadCount(snap.size);
    });
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setRecentNotifs([]);
      return;
    }
    const qRecent = query(
      collection(db, "users", currentUser.uid, "notifications"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(qRecent, (snap) => {
      setRecentNotifs(snap.docs.slice(0, 3).map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (open && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <>
      <nav className="flex justify-between items-center p-4 bg-white shadow relative">
        <Link to="/" className="text-xl font-bold">
          YAGO VIBE
        </Link>
        <div className="flex gap-4 items-center relative">
          <Link to="/blogs">Î∏îÎ°úÍ∑?/Link>
          <Link to="/teams">?Ä</Link>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                if (isMobile) {
                  setNotifOpen(true);
                } else {
                  setOpen((v) => !v);
                }
              }}
              className="relative"
            >
              <span className="text-2xl">?îî</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            {!isMobile && open && (
              <div className="absolute right-0 mt-2 w-64 bg-white border rounded shadow-lg z-50">
                <div className="p-2 border-b font-semibold">ÏµúÍ∑º ?åÎ¶º</div>
                {recentNotifs.length === 0 ? (
                  <p className="p-3 text-sm text-gray-500">?åÎ¶º ?ÜÏùå</p>
                ) : (
                  <ul className="max-h-60 overflow-y-auto">
                    {recentNotifs.map((n) => (
                      <li
                        key={n.id}
                        onClick={async () => {
                          setOpen(false);
                          if (currentUser) {
                            const notifRef = doc(
                              db,
                              "users",
                              currentUser.uid,
                              "notifications",
                              n.id
                            );
                            try { await updateDoc(notifRef, { isRead: true }); } catch {}
                          }
                          if (n.blogId) {
                            window.location.href = `/blogs/${n.blogId}`;
                          } else if (n.teamId) {
                            window.location.href = `/teams/${n.teamId}/blogs`;
                          } else {
                            window.location.href = "/notifications";
                          }
                        }}
                        className={`px-3 py-2 cursor-pointer ${
                          n.isRead ? "bg-white" : "bg-blue-50 hover:bg-blue-100"
                        }`}
                      >
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        <p className="text-xs text-gray-600 truncate">{n.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  to="/notifications"
                  className="block text-center text-blue-600 py-2 text-sm hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  Î™®Îì† ?åÎ¶º Î≥¥Í∏∞ ??                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Î™®Î∞î???åÎ¶º Î™®Îã¨ */}
      {isMobile && (
        <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
      )}
    </>
  );
}
