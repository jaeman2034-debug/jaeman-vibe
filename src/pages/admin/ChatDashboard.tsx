// ?”¥ ê´€ë¦¬ì??AI ì±„íŒ… ?€?œë³´??import { useEffect, useState } from "react";
import { onSnapshot, collection, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthProvider";
import { ChatRoomPreview } from "@/components/ChatRoomPreview";

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

type FilterType = "all" | "ai_active" | "seller_waiting" | "completed" | "errors";

export default function ChatDashboard() {
  const { user, isAdmin } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // ?” ê´€ë¦¬ì ê¶Œí•œ ?•ì¸
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="text-6xl mb-4">?”</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">?‘ê·¼ ê¶Œí•œ ?†ìŒ</h2>
          <p className="text-gray-600">???˜ì´ì§€??ê´€ë¦¬ìë§??‘ê·¼?????ˆìŠµ?ˆë‹¤.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    console.log("?” ê´€ë¦¬ì ì±„íŒ… ?€?œë³´??ì´ˆê¸°??..");

    const q = query(
      collection(db, "chatRooms"),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatRooms = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatRoom[];

      console.log(`?“Š ì´?${chatRooms.length}ê°?ì±„íŒ…ë°?ë¡œë“œ ?„ë£Œ`);
      setRooms(chatRooms);
      setLoading(false);
    }, (error) => {
      console.error("??ì±„íŒ…ë°??°ì´??ë¡œë“œ ?¤íŒ¨:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ?„í„°ë§ëœ ì±„íŒ…ë°?ëª©ë¡
  const filteredRooms = rooms.filter((room) => {
    // ê²€?‰ì–´ ?„í„°
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        room.productTitle?.toLowerCase().includes(searchLower) ||
        room.buyerName?.toLowerCase().includes(searchLower) ||
        room.sellerName?.toLowerCase().includes(searchLower) ||
        room.lastMessage?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // ?íƒœ ?„í„°
    switch (filter) {
      case "ai_active":
        return room.aiStatus === "active" && room.isAIEnabled;
      case "seller_waiting":
        return room.aiStatus === "waiting";
      case "completed":
        return room.aiStatus === "done";
      case "errors":
        return room.aiStatus === "error";
      default:
        return true;
    }
  });

  // ?µê³„ ?•ë³´
  const stats = {
    total: rooms.length,
    aiActive: rooms.filter(r => r.aiStatus === "active" && r.isAIEnabled).length,
    sellerWaiting: rooms.filter(r => r.aiStatus === "waiting").length,
    completed: rooms.filter(r => r.aiStatus === "done").length,
    errors: rooms.filter(r => r.aiStatus === "error").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">ì±„íŒ…ë°??°ì´?°ë? ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ?¤ë” */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                ?”¥ AI ì±„íŒ… ê´€ë¦??€?œë³´??              </h1>
              <p className="text-gray-600 mt-1">?¤ì‹œê°?ì±„íŒ… ëª¨ë‹ˆ?°ë§ ë°??íƒœ ê´€ë¦?/p>
            </div>
            
            {/* ?µê³„ */}
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{stats.total}</div>
                <div className="text-gray-500">?„ì²´</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{stats.aiActive}</div>
                <div className="text-gray-500">AI ?œì„±</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">{stats.sellerWaiting}</div>
                <div className="text-gray-500">?ë§¤???€ê¸?/div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{stats.completed}</div>
                <div className="text-gray-500">?„ë£Œ</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{stats.errors}</div>
                <div className="text-gray-500">?¤ë¥˜</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* ì¢Œì¸¡ ëª©ë¡ ?¨ë„ */}
        <div className="w-1/3 bg-white border-r flex flex-col">
          {/* ê²€??ë°??„í„° */}
          <div className="p-4 border-b bg-gray-50">
            <div className="mb-3">
              <input
                type="text"
                placeholder="?í’ˆëª? ?¬ìš©?ëª…?¼ë¡œ ê²€??.."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "?„ì²´", color: "gray" },
                { key: "ai_active", label: "AI ?œì„±", color: "purple" },
                { key: "seller_waiting", label: "?ë§¤???€ê¸?, color: "yellow" },
                { key: "completed", label: "?„ë£Œ", color: "green" },
                { key: "errors", label: "?¤ë¥˜", color: "red" },
              ].map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as FilterType)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filter === key
                      ? `bg-${color}-500 text-white`
                      : `bg-${color}-100 text-${color}-700 hover:bg-${color}-200`
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ì±„íŒ…ë°?ëª©ë¡ */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              <p className="text-sm text-gray-500 mb-2 px-2">
                {filteredRooms.length}ê°?ì±„íŒ…ë°?              </p>
              
              {filteredRooms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">?’¬</div>
                  <p>ì±„íŒ…ë°©ì´ ?†ìŠµ?ˆë‹¤</p>
                </div>
              ) : (
                filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`p-3 border rounded-lg mb-2 cursor-pointer transition-all hover:shadow-md ${
                      selectedRoom?.id === room.id
                        ? "bg-blue-50 border-blue-300 shadow-md"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 text-sm truncate flex-1">
                        ?“¦ {room.productTitle || "?¼ë°˜ ì±„íŒ…"}
                      </h3>
                      <span className="text-xs text-gray-400 ml-2">
                        #{room.id.slice(0, 6)}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2 truncate">
                      ?‘¤ {room.buyerName || "êµ¬ë§¤??} ??{room.sellerName || "?ë§¤??}
                    </p>
                    
                    <p className="text-xs text-gray-500 mb-2 truncate">
                      ?’¬ {room.lastMessage || "ë©”ì‹œì§€ ?†ìŒ"}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-block text-xs px-2 py-1 rounded-full ${
                          room.aiStatus === "active"
                            ? "bg-purple-100 text-purple-700"
                            : room.aiStatus === "waiting"
                            ? "bg-yellow-100 text-yellow-700"
                            : room.aiStatus === "done"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {room.aiStatus === "active"
                          ? "?¤– AI ?‘ë‹µ ì¤?
                          : room.aiStatus === "waiting"
                          ? "???ë§¤???€ê¸?
                          : room.aiStatus === "done"
                          ? "???„ë£Œ"
                          : "???¤ë¥˜"}
                      </span>
                      
                      <span className="text-xs text-gray-400">
                        {room.updatedAt?.toDate
                          ? room.updatedAt.toDate().toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "?œê°„ ?•ë³´ ?†ìŒ"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ?°ì¸¡ ?ì„¸ ?¨ë„ */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <ChatRoomPreview room={selectedRoom} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">?’¬</div>
                <h3 className="text-xl font-semibold mb-2">ì±„íŒ…ë°©ì„ ? íƒ?˜ì„¸??/h3>
                <p className="text-sm">?¼ìª½ ëª©ë¡?ì„œ ì±„íŒ…ë°©ì„ ?´ë¦­?˜ë©´ ?ì„¸ ?´ìš©??ë³????ˆìŠµ?ˆë‹¤.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
