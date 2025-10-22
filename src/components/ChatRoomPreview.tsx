// ?” ì±„íŒ…ë°?ë¯¸ë¦¬ë³´ê¸° ì»´í¬?ŒíŠ¸ (ê´€ë¦¬ì??
import { useEffect, useState, useRef } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Message = {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: any;
  isAI?: boolean;
  isWelcomeMessage?: boolean;
  isError?: boolean;
};

type ChatRoom = {
  id: string;
  buyerId: string;
  sellerId: string;
  buyerName?: string;
  sellerName?: string;
  productId?: string;
  productTitle?: string;
  productPrice?: number;
  lastMessage?: string;
  lastMessageSender?: string;
  aiStatus?: "active" | "waiting" | "done" | "error";
  createdAt?: any;
  updatedAt?: any;
  isAIEnabled?: boolean;
};

interface ChatRoomPreviewProps {
  room: ChatRoom;
}

export const ChatRoomPreview = ({ room }: ChatRoomPreviewProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!room?.id) return;

    console.log(`?” ì±„íŒ…ë°?ë¯¸ë¦¬ë³´ê¸° ë¡œë“œ: ${room.id}`);

    const messagesRef = collection(db, "chatRooms", room.id, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];

      setMessages(chatMessages);
      setLoading(false);

      // ?ë™ ?¤í¬ë¡?      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }, (error) => {
      console.error("??ë©”ì‹œì§€ ë¡œë“œ ?¤íŒ¨:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [room.id]);

  const getMessageStyle = (message: Message) => {
    if (message.senderId === "yago-bot" || message.isAI) {
      return {
        bg: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
        align: "justify-start",
        icon: "?¤–",
      };
    } else if (message.senderId === room.sellerId) {
      return {
        bg: "bg-green-500 text-white",
        align: "justify-end",
        icon: "?‘¤",
      };
    } else {
      return {
        bg: "bg-blue-500 text-white",
        align: "justify-end",
        icon: "?‘¤",
      };
    }
  };

  const getStatusInfo = () => {
    switch (room.aiStatus) {
      case "active":
        return {
          text: "AI ?‘ë‹µ ì¤?,
          color: "text-purple-600 bg-purple-100",
          icon: "?¤–",
        };
      case "waiting":
        return {
          text: "?ë§¤???‘ë‹µ ?€ê¸?,
          color: "text-yellow-600 bg-yellow-100",
          icon: "??,
        };
      case "done":
        return {
          text: "?„ë£Œ",
          color: "text-green-600 bg-green-100",
          icon: "??,
        };
      case "error":
        return {
          text: "?¤ë¥˜ ë°œìƒ",
          color: "text-red-600 bg-red-100",
          icon: "??,
        };
      default:
        return {
          text: "?íƒœ ë¯¸ì •",
          color: "text-gray-600 bg-gray-100",
          icon: "??,
        };
    }
  };

  const statusInfo = getStatusInfo();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">ë©”ì‹œì§€ë¥?ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* ì±„íŒ…ë°??•ë³´ ?¤ë” */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              ?“¦ {room.productTitle || "?¼ë°˜ ì±„íŒ…"}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>?‘¤ {room.buyerName || "êµ¬ë§¤??}</span>
              <span>??/span>
              <span>?‘¤ {room.sellerName || "?ë§¤??}</span>
              {room.productPrice && (
                <>
                  <span>??/span>
                  <span>?’° {room.productPrice.toLocaleString()}??/span>
                </>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.icon} {statusInfo.text}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              #{room.id.slice(0, 8)}...
            </p>
          </div>
        </div>

        {/* ì±„íŒ…ë°?ë©”í? ?•ë³´ */}
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div>
            <span className="font-medium">?ì„±??</span>{" "}
            {room.createdAt?.toDate
              ? room.createdAt.toDate().toLocaleString()
              : "?•ë³´ ?†ìŒ"}
          </div>
          <div>
            <span className="font-medium">ë§ˆì?ë§??…ë°?´íŠ¸:</span>{" "}
            {room.updatedAt?.toDate
              ? room.updatedAt.toDate().toLocaleString()
              : "?•ë³´ ?†ìŒ"}
          </div>
          <div>
            <span className="font-medium">AI ?œì„±??</span>{" "}
            {room.isAIEnabled ? "???œì„±" : "??ë¹„í™œ??}
          </div>
          <div>
            <span className="font-medium">ë©”ì‹œì§€ ??</span>{" "}
            {messages.length}ê°?          </div>
        </div>
      </div>

      {/* ë©”ì‹œì§€ ëª©ë¡ */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">?’¬</div>
              <p className="text-lg font-medium">?„ì§ ë©”ì‹œì§€ê°€ ?†ìŠµ?ˆë‹¤</p>
              <p className="text-sm">?€?”ê? ?œì‘?˜ë©´ ?¬ê¸°???œì‹œ?©ë‹ˆ??</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const style = getMessageStyle(message);
                
                return (
                  <div key={message.id} className={`flex ${style.align}`}>
                    <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${style.bg}`}>
                      {/* ë©”ì‹œì§€ ?¤ë” */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{style.icon}</span>
                        <span className="text-xs font-medium opacity-80">
                          {message.senderName}
                        </span>
                        {message.isAI && (
                          <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full">
                            AI
                          </span>
                        )}
                        {message.isWelcomeMessage && (
                          <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full">
                            ?˜ì˜
                          </span>
                        )}
                        {message.isError && (
                          <span className="text-xs bg-red-400 bg-opacity-80 px-2 py-0.5 rounded-full">
                            ?¤ë¥˜
                          </span>
                        )}
                      </div>
                      
                      {/* ë©”ì‹œì§€ ?´ìš© */}
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      
                      {/* ë©”ì‹œì§€ ?œê°„ */}
                      <p className="text-xs opacity-70 mt-1">
                        {message.createdAt?.toDate
                          ? message.createdAt.toDate().toLocaleString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                          : "?œê°„ ?•ë³´ ?†ìŒ"}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef}></div>
            </div>
          )}
        </div>
      </div>

      {/* ?˜ë‹¨ ?¡ì…˜ ë°?*/}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">ë§ˆì?ë§?ë©”ì‹œì§€:</span>{" "}
            {room.lastMessage || "ë©”ì‹œì§€ ?†ìŒ"}
          </div>
          
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
              ?“Š ?µê³„ ë³´ê¸°
            </button>
            <button className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
              ?“ ë©”ëª¨ ì¶”ê?
            </button>
            <button className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">
              ?”„ ?íƒœ ?…ë°?´íŠ¸
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
