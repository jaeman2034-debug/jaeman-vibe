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
    // ???�전 ?�이???�전 초기??    setItem(null);
    setLoading(true);
    
    if (!id) {
      setLoading(false);
      return;
    }

    console.log(`?�� ?�품 ${id} ?�이??로딩 ?�작`);

    const fetchItem = async () => {
      try {
        const docRef = doc(db, "marketItems", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const newItem = {
            id: docSnap.id,
            ...docSnap.data(),
          } as MarketItem;
          
          console.log(`???�품 ${id} 로딩 ?�료:`, newItem.title);
          setItem(newItem);
        } else {
          console.log(`???�품 ${id}�?찾을 ???�습?�다.`);
          setItem(null);
        }
      } catch (error) {
        console.error(`???�품 ${id} 불러?�기 ?�패:`, error);
        setItem(null);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  // ?�� 채팅�??�성 �??�동 ?�수 (최종 ?�벽 버전)
  const handleChatStart = async () => {
    if (!user) {
      alert("로그?????�용?�주?�요!");
      return;
    }

    if (!item) {
      alert("?�품 ?�보�?불러?�는 중입?�다. ?�시 ???�시 ?�도?�주?�요.");
      return;
    }

    setChatLoading(true);
    
    try {
      // ?�매??ID (?�제로는 item.sellerId ?�는 item.createdBy?�서 가?��?????
      // ?�재???�시�??�품 ID�??�매??ID�??�용
      const sellerId = item.id; // ?�제 구현 ??item.sellerId ?�용

      console.log("?�� 채팅�?검???�작 - ?�용??", user.uid, "?�매??", sellerId);

      // 기존 채팅�??�인
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
          console.log("??기존 채팅�?발견:", doc.id);
        }
      });

      // �??�으�??�로 ?�성
      let roomId;
      if (existingRoom) {
        roomId = existingRoom;
        console.log("?�� 기존 채팅�??�사??", roomId);
      } else {
        console.log("?�� ??채팅�??�성 �?..");
        const newChat = await addDoc(collection(db, "chatRooms"), {
          participants: [user.uid, sellerId],
          productId: item.id,
          productTitle: item.title,
          productImage: item.imageUrl,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: null,
          lastMessageAt: serverTimestamp(),
          // 추�? ?�보
          buyerId: user.uid,
          sellerId: sellerId,
          status: "active", // active, completed, closed
        });
        roomId = newChat.id;
        console.log("????채팅�??�성 ?�료:", roomId);
        
        // �?번째 메시지 추�? (?�스??메시지)
        await addDoc(collection(db, "chatRooms", roomId, "messages"), {
          senderId: "system",
          text: `${item.title} ?�품???�??문의가 ?�작?�었?�니??`,
          createdAt: serverTimestamp(),
          type: "system"
        });
        console.log("???�스??메시지 추�? ?�료");
      }

      console.log("?? 채팅방으�??�동:", `/chat/${roomId}`);
      console.log("?�� roomId ?�??", typeof roomId);
      console.log("?�� roomId �?", roomId);
      
      if (!roomId) {
        console.error("??roomId가 ?�성?��? ?�았?�니??");
        alert("채팅�??�성???�패?�습?�다. ?�시 ?�도?�주?�요.");
        return;
      }
      
      navigate(`/chat/${roomId}`);
      
    } catch (error) {
      console.error("??채팅�??�성 ?�패:", error);
      alert("채팅�??�성 �??�류가 발생?�습?�다. ?�시 ?�도?�주?�요.");
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-slate-500">?�품 ?�보�?불러?�는 �?..</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">?�품??찾을 ???�습?�다.</p>
        <button
          onClick={() => navigate("/market")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          마켓?�로 ?�아가�?        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ?�더 */}
      <header className="sticky top-0 z-50 bg-white shadow-sm flex items-center justify-between px-4 py-3">
        <button
          onClick={() => navigate("/market")}
          className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          ?�품 목록
        </button>
        <h1 className="text-base font-semibold text-gray-800">?�품 ?�세</h1>
        <div className="w-8"></div>
      </header>

      {/* ?��?지 ?�션 */}
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
                ?��?지 ?�음
              </div>
            )}
          </div>
          
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {item.title}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {item.locationName || "?�치 ?�보 ?�음"}
            </p>

            <p className="text-2xl font-bold text-green-600 mb-6">
              {item.price.toLocaleString()}??            </p>

            {item.desc && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">?�품 ?�명</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {item.desc}
                </p>
              </div>
            )}

            {/* ?�매???�락 */}
            <div className="space-y-3">
              {item.sellerName && (
                <p className="text-sm text-gray-600">
                  ?�매?? <span className="font-medium">{item.sellerName}</span>
                </p>
              )}
              
              <div className="flex gap-3">
                {item.sellerPhone && (
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors">
                    <Phone className="w-4 h-4" />
                    ?�화?�기
                  </button>
                )}

                {item.sellerKakao && (
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    카카?�톡
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
                      채팅�??�성 �?..
                    </div>
                  ) : (
                    "?�� ?�매?�에�??�락?�기"
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
