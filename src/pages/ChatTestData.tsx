// ?�� 채팅 ?�스???�이???�성�?import { useEffect, useState } from "react";
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
      alert("로그?�이 ?�요?�니??");
      return;
    }

    setCreating(true);
    try {
      // ?�스?�용 채팅�??�성
      const chatRef = await addDoc(collection(db, "chats"), {
        productId: "test-product-123",
        productTitle: "?�스???�품",
        productImageUrl: "https://via.placeholder.com/150",
        productStatus: "open",
        productPrice: 50000,
        participants: [currentUser.uid, "other-user-123"],
        lastMessage: "?�녕?�세?? ?�품???�??문의?�립?�다.",
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      console.log("???�스??채팅�??�성??", chatRef.id);

      // ?�스??메시지 ?�성
      await addDoc(collection(db, "chats", chatRef.id, "messages"), {
        from: "other-user-123",
        text: "?�녕?�세?? ?�품???�??문의?�립?�다.",
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "chats", chatRef.id, "messages"), {
        from: currentUser.uid,
        text: "?? ?�떤 부분이 궁금?�신가??",
        createdAt: serverTimestamp(),
      });

      alert("?�스??채팅방이 ?�성?�었?�니?? 채팅 목록?�서 ?�인?�보?�요.");
      navigate("/chats");
    } catch (error) {
      console.error("???�스??채팅�??�성 ?�패:", error);
      alert("?�스??채팅�??�성???�패?�습?�다.");
    } finally {
      setCreating(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">?��</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">로그?�이 ?�요?�니??/h2>
          <p className="text-gray-600 mb-6">?�스???�이?��? ?�성?�려�?로그?�해주세??</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
          >
            ?�으�??�동
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
            ?�� 채팅 ?�스???�이???�성�?          </h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">?�재 로그???�용??/h3>
            <p className="text-sm text-blue-700">
              UID: {currentUser.uid}
            </p>
            <p className="text-sm text-blue-700">
              ?�메?? {currentUser.email || "?�음"}
            </p>
          </div>

          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">?�� ?�스??채팅�?/h3>
              <p className="text-sm text-gray-600 mb-4">
                ?�재 ?�용?��? ?�른 ?�용??간의 ?�스??채팅방을 ?�성?�니??
              </p>
              <button
                onClick={createTestChat}
                disabled={creating}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition disabled:opacity-50"
              >
                {creating ? "?�성 �?.." : "?�스??채팅�??�성"}
              </button>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">?�� 빠른 링크</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate("/chats")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
                >
                  ?�� 채팅 목록
                </button>
                <button
                  onClick={() => navigate("/chat-debug")}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition"
                >
                  ?�� ?�버�?모드
                </button>
                <button
                  onClick={() => navigate("/market")}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
                >
                  ?�� 마켓
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-300 transition"
                >
                  ?�� ??                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
