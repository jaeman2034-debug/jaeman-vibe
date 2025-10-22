// ?§ª ì±„íŒ… ?ŒìŠ¤???°ì´???ì„±ê¸?import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";

export default function ChatTestData() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [creating, setCreating] = useState(false);

  const createTestChat = async () => {
    if (!currentUser) {
      alert("ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??");
      return;
    }

    setCreating(true);
    try {
      // ?ŒìŠ¤?¸ìš© ì±„íŒ…ë°??ì„±
      const chatRef = await addDoc(collection(db, "chats"), {
        productId: "test-product-123",
        productTitle: "?ŒìŠ¤???í’ˆ",
        productImageUrl: "https://via.placeholder.com/150",
        productStatus: "open",
        productPrice: 50000,
        participants: [currentUser.uid, "other-user-123"],
        lastMessage: "?ˆë…•?˜ì„¸?? ?í’ˆ???€??ë¬¸ì˜?œë¦½?ˆë‹¤.",
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      console.log("???ŒìŠ¤??ì±„íŒ…ë°??ì„±??", chatRef.id);

      // ?ŒìŠ¤??ë©”ì‹œì§€ ?ì„±
      await addDoc(collection(db, "chats", chatRef.id, "messages"), {
        from: "other-user-123",
        text: "?ˆë…•?˜ì„¸?? ?í’ˆ???€??ë¬¸ì˜?œë¦½?ˆë‹¤.",
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "chats", chatRef.id, "messages"), {
        from: currentUser.uid,
        text: "?? ?´ë–¤ ë¶€ë¶„ì´ ê¶ê¸ˆ?˜ì‹ ê°€??",
        createdAt: serverTimestamp(),
      });

      alert("?ŒìŠ¤??ì±„íŒ…ë°©ì´ ?ì„±?˜ì—ˆ?µë‹ˆ?? ì±„íŒ… ëª©ë¡?ì„œ ?•ì¸?´ë³´?¸ìš”.");
      navigate("/chats");
    } catch (error) {
      console.error("???ŒìŠ¤??ì±„íŒ…ë°??ì„± ?¤íŒ¨:", error);
      alert("?ŒìŠ¤??ì±„íŒ…ë°??ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    } finally {
      setCreating(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">?”</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??/h2>
          <p className="text-gray-600 mb-6">?ŒìŠ¤???°ì´?°ë? ?ì„±?˜ë ¤ë©?ë¡œê·¸?¸í•´ì£¼ì„¸??</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
          >
            ?ˆìœ¼ë¡??´ë™
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-center mb-6">
            ?§ª ì±„íŒ… ?ŒìŠ¤???°ì´???ì„±ê¸?          </h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">?„ì¬ ë¡œê·¸???¬ìš©??/h3>
            <p className="text-sm text-blue-700">
              UID: {currentUser.uid}
            </p>
            <p className="text-sm text-blue-700">
              ?´ë©”?? {currentUser.email || "?†ìŒ"}
            </p>
          </div>

          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">?“ ?ŒìŠ¤??ì±„íŒ…ë°?/h3>
              <p className="text-sm text-gray-600 mb-4">
                ?„ì¬ ?¬ìš©?ì? ?¤ë¥¸ ?¬ìš©??ê°„ì˜ ?ŒìŠ¤??ì±„íŒ…ë°©ì„ ?ì„±?©ë‹ˆ??
              </p>
              <button
                onClick={createTestChat}
                disabled={creating}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition disabled:opacity-50"
              >
                {creating ? "?ì„± ì¤?.." : "?ŒìŠ¤??ì±„íŒ…ë°??ì„±"}
              </button>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">?”— ë¹ ë¥¸ ë§í¬</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate("/chats")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
                >
                  ?’¬ ì±„íŒ… ëª©ë¡
                </button>
                <button
                  onClick={() => navigate("/chat-debug")}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition"
                >
                  ?”§ ?”ë²„ê·?ëª¨ë“œ
                </button>
                <button
                  onClick={() => navigate("/market")}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
                >
                  ?›’ ë§ˆì¼“
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-300 transition"
                >
                  ?  ??                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
