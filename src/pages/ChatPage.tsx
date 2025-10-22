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

  // ?ë™ ?¤í¬ë¡?  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ì±„íŒ…ë°??•ë³´ ë¡œë“œ
  useEffect(() => {
    if (!chatId) {
      console.error("??chatId ?Œë¼ë¯¸í„°ê°€ ?†ìŠµ?ˆë‹¤");
      setLoading(false);
      return;
    }

    console.log("?” ì±„íŒ…ë°??•ë³´ ë¡œë“œ ?œì‘:", chatId);

    const loadChatRoom = async () => {
      try {
        const chatDoc = await getDoc(doc(db, "chats", chatId));
        if (chatDoc.exists()) {
          console.log("??ì±„íŒ…ë°??•ë³´ ë¡œë“œ ?„ë£Œ:", chatDoc.data());
          setChatRoom(chatDoc.data() as ChatRoom);
        } else {
          console.warn("? ï¸ ì±„íŒ…ë°©ì„ ì°¾ì„ ???†ìŠµ?ˆë‹¤:", chatId);
          alert("ì±„íŒ…ë°©ì„ ì°¾ì„ ???†ìŠµ?ˆë‹¤.");
          navigate("/market");
        }
        setLoading(false);
      } catch (error) {
        console.error("??ì±„íŒ…ë°?ë¡œë“œ ?¤ë¥˜:", error);
        alert("ì±„íŒ…ë°??•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
        setLoading(false);
      }
    };

    loadChatRoom();
  }, [chatId, navigate]);

  // ë©”ì‹œì§€ ?¤ì‹œê°?êµ¬ë…
  useEffect(() => {
    if (!chatId) return;

    console.log("?” ë©”ì‹œì§€ ?¤ì‹œê°?êµ¬ë… ?œì‘:", chatId);

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
        console.log("??ë©”ì‹œì§€ ?˜ì‹ :", msgs.length, "ê°?);
        setMessages(msgs);
      },
      (error) => {
        console.error("??ë©”ì‹œì§€ êµ¬ë… ?¤ë¥˜:", error);
      }
    );

    return () => {
      console.log("?”Œ ë©”ì‹œì§€ êµ¬ë… ?´ì œ");
      unsub();
    };
  }, [chatId]);

  // ë©”ì‹œì§€ ?„ì†¡
  const handleSend = async () => {
    if (!input.trim() || !chatId) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??");
      navigate("/login");
      return;
    }

    try {
      console.log("?“¤ ë©”ì‹œì§€ ?„ì†¡ ì¤?", input);

      // ë©”ì‹œì§€ ì¶”ê?
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: currentUser.uid,
        senderEmail: currentUser.email || "?µëª…",
        text: input.trim(),
        createdAt: serverTimestamp(),
      });

      // ì±„íŒ…ë°?lastMessage ?…ë°?´íŠ¸
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: input.trim(),
        lastMessageAt: serverTimestamp(),
      });

      console.log("??ë©”ì‹œì§€ ?„ì†¡ ?„ë£Œ");
      setInput("");
    } catch (error: any) {
      console.error("??ë©”ì‹œì§€ ?„ì†¡ ?¤ë¥˜:", error);
      
      if (error.code === "permission-denied") {
        alert("ë©”ì‹œì§€ ?„ì†¡ ê¶Œí•œ???†ìŠµ?ˆë‹¤.");
      } else {
        alert("ë©”ì‹œì§€ ?„ì†¡ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
      }
    }
  };

  // Enter ?¤ë¡œ ?„ì†¡
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
          ì±„íŒ…ë°©ì„ ë¶ˆëŸ¬?¤ëŠ” ì¤‘ì…?ˆë‹¤...
        </p>
      </div>
    );
  }

  if (!chatRoom) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">ì±„íŒ…ë°©ì„ ì°¾ì„ ???†ìŠµ?ˆë‹¤.</p>
          <button
            onClick={() => navigate("/market")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ë§ˆì¼“?¼ë¡œ ?Œì•„ê°€ê¸?          </button>
        </div>
      </div>
    );
  }

  const currentUserId = auth.currentUser?.uid;
  const isUserMode = currentUserId === chatRoom.buyerId ? "êµ¬ë§¤?? : "?ë§¤??;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ì±„íŒ… ?¤ë” */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/market")}
            className="text-gray-600 hover:text-gray-800"
          >
            ???¤ë¡œ
          </button>
          <div className="flex-1 text-center">
            <h2 className="font-bold text-lg text-gray-800">
              {chatRoom.productTitle}
            </h2>
            <p className="text-sm text-gray-500">
              {isUserMode} ëª¨ë“œ | ??chatRoom.productPrice?.toLocaleString()}
            </p>
          </div>
          <div className="w-16"></div>
        </div>
      </div>

      {/* ?í’ˆ ?•ë³´ ì¹´ë“œ */}
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

      {/* ë©”ì‹œì§€ ëª©ë¡ */}
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">
              ì²?ë©”ì‹œì§€ë¥?ë³´ë‚´ë³´ì„¸?? ?’¬
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
                  // ?§  ì§€?¥í˜• AI ?ë§¤ ë¹„ì„œ (ì´ˆë¡??ì¤‘ì•™ ?•ë ¬)
                  <div className="max-w-[85%] bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 px-4 py-3 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">?§ </span>
                      <p className="text-xs font-bold text-green-700">ì§€?¥í˜• AI ?ë§¤ ë¹„ì„œ</p>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-800">{m.text}</p>
                    <div className="mt-3 pt-2 border-t border-green-200">
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <span>?’¡</span>
                        <span>?ë§¤?ë³„ ?™ìŠµ ?°ì´??ê¸°ë°˜ ?µë?</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        ?ë§¤?ë‹˜ê»˜ì„œ ê³?ì§ì ‘ ?µë??˜ì‹¤ ?ˆì •?…ë‹ˆ??                      </p>
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
                  // ?¤– AI ?ë™?‘ë‹µ ë©”ì‹œì§€ (ì¤‘ì•™ ?•ë ¬)
                  <div className="max-w-[80%] bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 px-4 py-3 rounded-2xl shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">?¤–</span>
                      <p className="text-xs font-semibold text-purple-700">AI ?ë™?‘ë‹µ</p>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-800 italic">{m.text}</p>
                    <p className="text-xs text-purple-500 mt-2">
                      ?’¡ ?ë§¤?ë‹˜ê»˜ì„œ ê³??µë??˜ì‹¤ ?ˆì •?…ë‹ˆ??                    </p>
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
                  // ?¼ë°˜ ?¬ìš©??ë©”ì‹œì§€
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

      {/* ë©”ì‹œì§€ ?…ë ¥ */}
      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="ë©”ì‹œì§€ë¥??…ë ¥?˜ì„¸??.."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-full shadow-md transition-all"
          >
            ë³´ë‚´ê¸?          </button>
        </div>
      </div>
    </div>
  );
}
