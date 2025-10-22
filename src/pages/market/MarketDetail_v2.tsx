import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function MarketDetail_v2() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<any>(null);

  useEffect(() => {
    const fetchItem = async () => {
      const ref = doc(db, "marketItems", id!);
      const snap = await getDoc(ref);
      if (snap.exists()) setItem(snap.data());
    };
    fetchItem();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("?•ë§ ?? œ?˜ì‹œê² ìŠµ?ˆê¹Œ?")) return;
    await deleteDoc(doc(db, "marketItems", id!));
    alert("?? œ?˜ì—ˆ?µë‹ˆ??");
    navigate("/market");
  };

  if (!item) return <div className="text-center py-20 text-gray-400">ë¶ˆëŸ¬?¤ëŠ” ì¤?..</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-4 flex justify-center items-center"
        >
          <img
            src={item.imageUrl || "/no-image.png"}
            alt={item.title}
            className="rounded-lg object-contain w-full max-h-[500px]"
          />
        </motion.div>

        {/* Right: Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-between"
        >
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">{item.title}</h1>
            <p className="text-sm text-gray-500 mb-1">{item.category}</p>
            <span className="inline-block bg-green-100 text-green-600 text-sm px-2 py-0.5 rounded-md mb-4">
              {item.status === "selling" ? "?ë§¤ì¤? : "?ë§¤?„ë£Œ"}
            </span>

            <div className="text-green-600 text-2xl font-bold mb-4">
              ??item.price?.toLocaleString()}
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            <div>
              <h2 className="text-gray-800 font-medium mb-2">?í’ˆ ?¤ëª…</h2>
              <p className="text-gray-600 leading-relaxed">{item.desc || "?¤ëª… ?†ìŒ"}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => navigate(`/market/edit/${id}`)}
              className="w-full py-2 border rounded-lg hover:bg-gray-100"
            >
              ?˜ì •
            </button>
            <button
              onClick={handleDelete}
              className="w-full py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
            >
              ?? œ
            </button>
            <button className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              ì±„íŒ…?˜ê¸°(?ˆì‹œ)
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="w-full py-2 text-gray-500 border rounded-lg hover:bg-gray-50"
            >
              ê³µìœ  ë§í¬ ë³µì‚¬
            </button>
          </div>

          <div className="text-gray-400 text-sm mt-6 border-t pt-3">
            ?±ë¡?? {new Date(item.createdAt?.seconds * 1000).toLocaleDateString("ko-KR")}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
