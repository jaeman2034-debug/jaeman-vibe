import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";

interface Message {
  id: string;
  senderId: string;
  senderEmail?: string;
  text: string;
  createdAt: any;
}

interface ChatRoom {
  buyerId: string;
  sellerId: string;
  productId: string;
  productTitle?: string;
  productImageUrl?: string;
  productPrice?: number;
  lastMessage?: string;
  lastMessageAt?: any;
  createdAt?: any;
}

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ?�동 ?�크�?  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 채팅�??�보 로드
  useEffect(() => {
    if (!chatId) {
      console.error("??chatId ?�라미터가 ?�습?�다");
      setLoading(false);
      return;
    }

    console.log("?�� 채팅�??�보 로드 ?�작:", chatId);

    const loadChatRoom = async () => {
      try {
        const chatDoc = await getDoc(doc(db, "chats", chatId));
        if (chatDoc.exists()) {
          console.log("??채팅�??�보 로드 ?�료:", chatDoc.data());
          setChatRoom(chatDoc.data() as ChatRoom);
        } else {
          console.warn("?�️ 채팅방을 찾을 ???�습?�다:", chatId);
          alert("채팅방을 찾을 ???�습?�다.");
          navigate("/market");
        }
        setLoading(false);
      } catch (error) {
        console.error("??채팅�?로드 ?�류:", error);
        alert("채팅�??�보�?불러?�는 �??�류가 발생?�습?�다.");
        setLoading(false);
      }
    };

    loadChatRoom();
  }, [chatId, navigate]);

  // 메시지 ?�시�?구독
  useEffect(() => {
    if (!chatId) return;

    console.log("?�� 메시지 ?�시�?구독 ?�작:", chatId);

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const msgs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Message, "id">),
        }));
        console.log("??메시지 ?�신:", msgs.length, "�?);
        setMessages(msgs);
      },
      (error) => {
        console.error("??메시지 구독 ?�류:", error);
      }
    );

    return () => {
      console.log("?�� 메시지 구독 ?�제");
      unsub();
    };
  }, [chatId]);

  // 메시지 ?�송
  const handleSend = async () => {
    if (!input.trim() || !chatId) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("로그?�이 ?�요?�니??");
      navigate("/login");
      return;
    }

    try {
      console.log("?�� 메시지 ?�송 �?", input);

      // 메시지 추�?
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: currentUser.uid,
        senderEmail: currentUser.email || "?�명",
        text: input.trim(),
        createdAt: serverTimestamp(),
      });

      // 채팅�?lastMessage ?�데?�트
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: input.trim(),
        lastMessageAt: serverTimestamp(),
      });

      console.log("??메시지 ?�송 ?�료");
      setInput("");
    } catch (error: any) {
      console.error("??메시지 ?�송 ?�류:", error);
      
      if (error.code === "permission-denied") {
        alert("메시지 ?�송 권한???�습?�다.");
      } else {
        alert("메시지 ?�송 �??�류가 발생?�습?�다.");
      }
    }
  };

  // Enter ?�로 ?�송
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 text-lg animate-pulse">
          채팅방을 불러?�는 중입?�다...
        </p>
      </div>
    );
  }

  if (!chatRoom) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">채팅방을 찾을 ???�습?�다.</p>
          <button
            onClick={() => navigate("/market")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            마켓?�로 ?�아가�?          </button>
        </div>
      </div>
    );
  }

  const currentUserId = auth.currentUser?.uid;
  const isUserMode = currentUserId === chatRoom.buyerId ? "구매?? : "?�매??;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 채팅 ?�더 */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/market")}
            className="text-gray-600 hover:text-gray-800"
          >
            ???�로
          </button>
          <div className="flex-1 text-center">
            <h2 className="font-bold text-lg text-gray-800">
              {chatRoom.productTitle}
            </h2>
            <p className="text-sm text-gray-500">
              {isUserMode} 모드 | ??chatRoom.productPrice?.toLocaleString()}
            </p>
          </div>
          <div className="w-16"></div>
        </div>
      </div>

      {/* ?�품 ?�보 카드 */}
      {chatRoom.productImageUrl && (
        <div className="bg-blue-50 border-b border-blue-100 p-3">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <img
              src={chatRoom.productImageUrl}
              alt={chatRoom.productTitle}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{chatRoom.productTitle}</p>
              <p className="text-sm text-gray-600">
                ??chatRoom.productPrice?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">
              �?메시지�?보내보세?? ?��
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMyMessage = m.senderId === currentUserId;
            const isAIMessage = m.senderId === "AI_Assistant";
            const isSmartAI = m.senderId === "AI_ShopBot";
            
            return (
              <div
                key={m.id}
                className={`mb-4 flex ${
                  isAIMessage || isSmartAI ? "justify-center" : 
                  isMyMessage ? "justify-end" : "justify-start"
                }`}
              >
                {isSmartAI ? (
                  // ?�� 지?�형 AI ?�매 비서 (초록??중앙 ?�렬)
                  <div className="max-w-[85%] bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 px-4 py-3 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">?��</span>
                      <p className="text-xs font-bold text-green-700">지?�형 AI ?�매 비서</p>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-800">{m.text}</p>
                    <div className="mt-3 pt-2 border-t border-green-200">
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <span>?��</span>
                        <span>?�매?�별 ?�습 ?�이??기반 ?��?</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        ?�매?�님께서 �?직접 ?��??�실 ?�정?�니??                      </p>
                    </div>
                    {m.createdAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        {m.createdAt.toDate?.().toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }) || ""}
                      </p>
                    )}
                  </div>
                ) : isAIMessage ? (
                  // ?�� AI ?�동?�답 메시지 (중앙 ?�렬)
                  <div className="max-w-[80%] bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 px-4 py-3 rounded-2xl shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">?��</span>
                      <p className="text-xs font-semibold text-purple-700">AI ?�동?�답</p>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-800 italic">{m.text}</p>
                    <p className="text-xs text-purple-500 mt-2">
                      ?�� ?�매?�님께서 �??��??�실 ?�정?�니??                    </p>
                    {m.createdAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        {m.createdAt.toDate?.().toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }) || ""}
                      </p>
                    )}
                  </div>
                ) : (
                  // ?�반 ?�용??메시지
                  <div
                    className={`px-4 py-3 rounded-2xl max-w-[70%] shadow-sm ${
                      isMyMessage
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-gray-800 border border-gray-200"
                    }`}
                  >
                    {!isMyMessage && m.senderEmail && (
                      <p className="text-xs text-gray-500 mb-1">{m.senderEmail}</p>
                    )}
                    <p className="text-sm leading-relaxed">{m.text}</p>
                    {m.createdAt && (
                      <p
                        className={`text-xs mt-1 ${
                          isMyMessage ? "text-indigo-200" : "text-gray-400"
                        }`}
                      >
                        {m.createdAt.toDate?.().toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }) || ""}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 메시지 ?�력 */}
      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지�??�력?�세??.."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-full shadow-md transition-all"
          >
            보내�?          </button>
        </div>
      </div>
    </div>
  );
}
