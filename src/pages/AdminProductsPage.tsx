import { useEffect, useState } from "react";
import { collection, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function AdminProductsPage() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  // ??Firestore ?¤ì‹œê°?êµ¬ë…
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "marketItems"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(data);
    });
    return () => unsubscribe();
  }, []);

  // ??ê´€ë¦¬ì ê³„ì •ë§??‘ê·¼ (ê°œë°œ??- ?¤ì œ ?´ì˜???´ë©”??ë³€ê²??„ìš”)
  useEffect(() => {
    if (!currentUser) return;
    // ê°œë°œ?? ëª¨ë“  ?¬ìš©???‘ê·¼ ?ˆìš© (?¤ì œ ?´ì˜???„ë˜ ì£¼ì„ ?´ì œ)
    // if (currentUser.email !== "admin@yagovibe.com") {
    //   alert("ê´€ë¦¬ìë§??‘ê·¼?????ˆìŠµ?ˆë‹¤.");
    //   navigate("/");
    // }
  }, [currentUser]);

  // ???íƒœ ë³€ê²?  const handleStatusChange = async (id, currentStatus) => {
    const next =
      currentStatus === "open"
        ? "reserved"
        : currentStatus === "reserved"
        ? "sold"
        : "open";
    try {
      await updateDoc(doc(db, "marketItems", id), { status: next });
      alert(`?”„ ?íƒœê°€ '${next}' ?¼ë¡œ ë³€ê²½ë˜?ˆìŠµ?ˆë‹¤.`);
    } catch (err) {
      console.error("???íƒœ ë³€ê²??¤ë¥˜:", err);
    }
  };

  // ???í’ˆ ?? œ
  const handleDelete = async (id) => {
    if (!window.confirm("?•ë§ ?? œ?˜ì‹œê² ìŠµ?ˆê¹Œ?")) return;
    try {
      await deleteDoc(doc(db, "marketItems", id));
      alert("?—‘ï¸??? œ ?„ë£Œ");
    } catch (err) {
      console.error("???? œ ?¤ë¥˜:", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-6">?™ï¸ ê´€ë¦¬ì ?í’ˆ ?€?œë³´??/h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 border rounded-lg shadow-sm bg-white hover:shadow-md transition"
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-48 object-cover rounded-lg mb-3"
            />
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="text-gray-500 mb-1">?’° {item.price?.toLocaleString()}??/p>
            <p className="text-sm text-gray-400 mb-2">
              ?ë§¤?? {item.sellerId?.slice(0, 8) || "?†ìŒ"}??            </p>

            <div className="flex justify-between items-center mb-2">
              <span
                className={`text-sm font-semibold ${
                  item.status === "open"
                    ? "text-green-500"
                    : item.status === "reserved"
                    ? "text-yellow-500"
                    : "text-gray-500"
                }`}
              >
                {item.status === "open"
                  ? "?Ÿ¢ ?ë§¤ì¤?
                  : item.status === "reserved"
                  ? "?Ÿ¡ ê±°ë˜ì¤?
                  : "??ê±°ë˜?„ë£Œ"}
              </span>
              <button
                onClick={() => handleStatusChange(item.id, item.status)}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-400"
              >
                ?íƒœ ë³€ê²?              </button>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => navigate(`/product/${item.id}`)}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-100"
              >
                ?ì„¸ë³´ê¸°
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-400"
              >
                ?? œ
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-center text-gray-400 mt-10">?±ë¡???í’ˆ???†ìŠµ?ˆë‹¤.</p>
      )}
    </div>
  );
}
