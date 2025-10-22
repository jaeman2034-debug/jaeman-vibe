// ?�� 채팅�?미리보기 컴포?�트 (관리자??
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

    console.log(`?�� 채팅�?미리보기 로드: ${room.id}`);

    const messagesRef = collection(db, "chatRooms", room.id, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];

      setMessages(chatMessages);
      setLoading(false);

      // ?�동 ?�크�?      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }, (error) => {
      console.error("??메시지 로드 ?�패:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [room.id]);

  const getMessageStyle = (message: Message) => {
    if (message.senderId === "yago-bot" || message.isAI) {
      return {
        bg: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
        align: "justify-start",
        icon: "?��",
      };
    } else if (message.senderId === room.sellerId) {
      return {
        bg: "bg-green-500 text-white",
        align: "justify-end",
        icon: "?��",
      };
    } else {
      return {
        bg: "bg-blue-500 text-white",
        align: "justify-end",
        icon: "?��",
      };
    }
  };

  const getStatusInfo = () => {
    switch (room.aiStatus) {
      case "active":
        return {
          text: "AI ?�답 �?,
          color: "text-purple-600 bg-purple-100",
          icon: "?��",
        };
      case "waiting":
        return {
          text: "?�매???�답 ?��?,
          color: "text-yellow-600 bg-yellow-100",
          icon: "??,
        };
      case "done":
        return {
          text: "?�료",
          color: "text-green-600 bg-green-100",
          icon: "??,
        };
      case "error":
        return {
          text: "?�류 발생",
          color: "text-red-600 bg-red-100",
          icon: "??,
        };
      default:
        return {
          text: "?�태 미정",
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
          <p className="text-gray-600">메시지�?불러?�는 �?..</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* 채팅�??�보 ?�더 */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              ?�� {room.productTitle || "?�반 채팅"}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>?�� {room.buyerName || "구매??}</span>
              <span>??/span>
              <span>?�� {room.sellerName || "?�매??}</span>
              {room.productPrice && (
                <>
                  <span>??/span>
                  <span>?�� {room.productPrice.toLocaleString()}??/span>
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

        {/* 채팅�?메�? ?�보 */}
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div>
            <span className="font-medium">?�성??</span>{" "}
            {room.createdAt?.toDate
              ? room.createdAt.toDate().toLocaleString()
              : "?�보 ?�음"}
          </div>
          <div>
            <span className="font-medium">마�?�??�데?�트:</span>{" "}
            {room.updatedAt?.toDate
              ? room.updatedAt.toDate().toLocaleString()
              : "?�보 ?�음"}
          </div>
          <div>
            <span className="font-medium">AI ?�성??</span>{" "}
            {room.isAIEnabled ? "???�성" : "??비활??}
          </div>
          <div>
            <span className="font-medium">메시지 ??</span>{" "}
            {messages.length}�?          </div>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">?��</div>
              <p className="text-lg font-medium">?�직 메시지가 ?�습?�다</p>
              <p className="text-sm">?�?��? ?�작?�면 ?�기???�시?�니??</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const style = getMessageStyle(message);
                
                return (
                  <div key={message.id} className={`flex ${style.align}`}>
                    <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${style.bg}`}>
                      {/* 메시지 ?�더 */}
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
                            ?�영
                          </span>
                        )}
                        {message.isError && (
                          <span className="text-xs bg-red-400 bg-opacity-80 px-2 py-0.5 rounded-full">
                            ?�류
                          </span>
                        )}
                      </div>
                      
                      {/* 메시지 ?�용 */}
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      
                      {/* 메시지 ?�간 */}
                      <p className="text-xs opacity-70 mt-1">
                        {message.createdAt?.toDate
                          ? message.createdAt.toDate().toLocaleString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                          : "?�간 ?�보 ?�음"}
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

      {/* ?�단 ?�션 �?*/}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">마�?�?메시지:</span>{" "}
            {room.lastMessage || "메시지 ?�음"}
          </div>
          
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
              ?�� ?�계 보기
            </button>
            <button className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
              ?�� 메모 추�?
            </button>
            <button className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">
              ?�� ?�태 ?�데?�트
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
