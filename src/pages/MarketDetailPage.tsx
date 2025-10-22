import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { ArrowLeft, MapPin, Phone, MessageCircle } from "lucide-react";

type MarketItem = {
  id: string;
  title: string;
  price: number;
  desc?: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  locationName?: string;
  sellerName?: string;
  sellerPhone?: string;
  sellerKakao?: string;
  createdAt?: any;
};

export default function MarketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const [item, setItem] = useState<MarketItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    // ???´ì „ ?°ì´???„ì „ ì´ˆê¸°??    setItem(null);
    setLoading(true);
    
    if (!id) {
      setLoading(false);
      return;
    }

    console.log(`?”„ ?í’ˆ ${id} ?°ì´??ë¡œë”© ?œì‘`);

    const fetchItem = async () => {
      try {
        const docRef = doc(db, "marketItems", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const newItem = {
            id: docSnap.id,
            ...docSnap.data(),
          } as MarketItem;
          
          console.log(`???í’ˆ ${id} ë¡œë”© ?„ë£Œ:`, newItem.title);
          setItem(newItem);
        } else {
          console.log(`???í’ˆ ${id}ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤.`);
          setItem(null);
        }
      } catch (error) {
        console.error(`???í’ˆ ${id} ë¶ˆëŸ¬?¤ê¸° ?¤íŒ¨:`, error);
        setItem(null);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  // ?’¬ ì±„íŒ…ë°??ì„± ë°??´ë™ ?¨ìˆ˜ (ìµœì¢… ?„ë²½ ë²„ì „)
  const handleChatStart = async () => {
    if (!user) {
      alert("ë¡œê·¸?????´ìš©?´ì£¼?¸ìš”!");
      return;
    }

    if (!item) {
      alert("?í’ˆ ?•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ” ì¤‘ì…?ˆë‹¤. ? ì‹œ ???¤ì‹œ ?œë„?´ì£¼?¸ìš”.");
      return;
    }

    setChatLoading(true);
    
    try {
      // ?ë§¤??ID (?¤ì œë¡œëŠ” item.sellerId ?ëŠ” item.createdBy?ì„œ ê°€?¸ì?????
      // ?„ì¬???„ì‹œë¡??í’ˆ IDë¥??ë§¤??IDë¡??¬ìš©
      const sellerId = item.id; // ?¤ì œ êµ¬í˜„ ??item.sellerId ?¬ìš©

      console.log("?” ì±„íŒ…ë°?ê²€???œì‘ - ?¬ìš©??", user.uid, "?ë§¤??", sellerId);

      // ê¸°ì¡´ ì±„íŒ…ë°??•ì¸
      const q = query(
        collection(db, "chatRooms"), 
        where("participants", "array-contains", user.uid)
      );
      const snapshot = await getDocs(q);
      
      let existingRoom = null;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(sellerId)) {
          existingRoom = doc.id;
          console.log("??ê¸°ì¡´ ì±„íŒ…ë°?ë°œê²¬:", doc.id);
        }
      });

      // ë°??†ìœ¼ë©??ˆë¡œ ?ì„±
      let roomId;
      if (existingRoom) {
        roomId = existingRoom;
        console.log("?”„ ê¸°ì¡´ ì±„íŒ…ë°??¬ì‚¬??", roomId);
      } else {
        console.log("?†• ??ì±„íŒ…ë°??ì„± ì¤?..");
        const newChat = await addDoc(collection(db, "chatRooms"), {
          participants: [user.uid, sellerId],
          productId: item.id,
          productTitle: item.title,
          productImage: item.imageUrl,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: null,
          lastMessageAt: serverTimestamp(),
          // ì¶”ê? ?•ë³´
          buyerId: user.uid,
          sellerId: sellerId,
          status: "active", // active, completed, closed
        });
        roomId = newChat.id;
        console.log("????ì±„íŒ…ë°??ì„± ?„ë£Œ:", roomId);
        
        // ì²?ë²ˆì§¸ ë©”ì‹œì§€ ì¶”ê? (?œìŠ¤??ë©”ì‹œì§€)
        await addDoc(collection(db, "chatRooms", roomId, "messages"), {
          senderId: "system",
          text: `${item.title} ?í’ˆ???€??ë¬¸ì˜ê°€ ?œì‘?˜ì—ˆ?µë‹ˆ??`,
          createdAt: serverTimestamp(),
          type: "system"
        });
        console.log("???œìŠ¤??ë©”ì‹œì§€ ì¶”ê? ?„ë£Œ");
      }

      console.log("?? ì±„íŒ…ë°©ìœ¼ë¡??´ë™:", `/chat/${roomId}`);
      console.log("?” roomId ?€??", typeof roomId);
      console.log("?” roomId ê°?", roomId);
      
      if (!roomId) {
        console.error("??roomIdê°€ ?ì„±?˜ì? ?Šì•˜?µë‹ˆ??");
        alert("ì±„íŒ…ë°??ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤. ?¤ì‹œ ?œë„?´ì£¼?¸ìš”.");
        return;
      }
      
      navigate(`/chat/${roomId}`);
      
    } catch (error) {
      console.error("??ì±„íŒ…ë°??ì„± ?¤íŒ¨:", error);
      alert("ì±„íŒ…ë°??ì„± ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤. ?¤ì‹œ ?œë„?´ì£¼?¸ìš”.");
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-slate-500">?í’ˆ ?•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">?í’ˆ??ì°¾ì„ ???†ìŠµ?ˆë‹¤.</p>
        <button
          onClick={() => navigate("/market")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          ë§ˆì¼“?¼ë¡œ ?Œì•„ê°€ê¸?        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ?¤ë” */}
      <header className="sticky top-0 z-50 bg-white shadow-sm flex items-center justify-between px-4 py-3">
        <button
          onClick={() => navigate("/market")}
          className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          ?í’ˆ ëª©ë¡
        </button>
        <h1 className="text-base font-semibold text-gray-800">?í’ˆ ?ì„¸</h1>
        <div className="w-8"></div>
      </header>

      {/* ?´ë?ì§€ ?¹ì…˜ */}
      <section className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="flex justify-center bg-gray-100 p-4">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full max-w-lg object-contain aspect-[4/3]"
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                ?´ë?ì§€ ?†ìŒ
              </div>
            )}
          </div>
          
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {item.title}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {item.locationName || "?„ì¹˜ ?•ë³´ ?†ìŒ"}
            </p>

            <p className="text-2xl font-bold text-green-600 mb-6">
              {item.price.toLocaleString()}??            </p>

            {item.desc && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">?í’ˆ ?¤ëª…</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {item.desc}
                </p>
              </div>
            )}

            {/* ?ë§¤???°ë½ */}
            <div className="space-y-3">
              {item.sellerName && (
                <p className="text-sm text-gray-600">
                  ?ë§¤?? <span className="font-medium">{item.sellerName}</span>
                </p>
              )}
              
              <div className="flex gap-3">
                {item.sellerPhone && (
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors">
                    <Phone className="w-4 h-4" />
                    ?„í™”?˜ê¸°
                  </button>
                )}

                {item.sellerKakao && (
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    ì¹´ì¹´?¤í†¡
                  </button>
                )}
              </div>

              {!item.sellerPhone && !item.sellerKakao && (
                <button 
                  onClick={handleChatStart}
                  disabled={chatLoading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl py-3 font-semibold shadow transition-colors"
                >
                  {chatLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ì±„íŒ…ë°??ì„± ì¤?..
                    </div>
                  ) : (
                    "?’¬ ?ë§¤?ì—ê²??°ë½?˜ê¸°"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
