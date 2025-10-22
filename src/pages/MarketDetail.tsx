// ???�품 ?�세 ?�이지 컴포?�트
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft, MapPin, MessageCircle, Heart } from "lucide-react";

type MarketItem = {
  id: string;
  title: string;
  price: number;
  desc?: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  locationName?: string;
  createdAt?: any;
};

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<MarketItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Firestore?�서 ?�품 ?�이??조회
  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      
      try {
        // marketItems 컬렉?�에???�품 조회
        const docRef = doc(db, "marketItems", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setItem({ id: docSnap.id, ...docSnap.data() } as MarketItem);
        } else {
          console.log("?�품??찾을 ???�습?�다");
        }
      } catch (error) {
        console.error("?�품 조회 ?�패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">?�품 ?�보�?불러?�는 �?..</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">?�품??찾을 ???�어??/h1>
          <p className="text-gray-500 mb-6">?�청?�신 ?�품??존재?��? ?�습?�다.</p>
          <button
            onClick={() => navigate("/market")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            마켓?�로 ?�아가�?          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ?�더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={20} className="mr-2" />
          ?�로가�?        </button>
        <h1 className="text-lg font-semibold">?�품 ?�세</h1>
        <div className="w-8"></div> {/* 균형???�한 �?공간 */}
      </div>

      {/* ?�품 ?��?지 */}
      <div className="bg-white">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-80 object-cover"
          />
        ) : (
          <div className="w-full h-80 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">?��?지 ?�음</span>
          </div>
        )}
      </div>

      {/* ?�품 ?�보 */}
      <div className="bg-white p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h2>
        <div className="text-2xl font-bold text-green-600 mb-4">
          {item.price.toLocaleString()}??        </div>
        
        {item.desc && (
          <div className="text-gray-700 leading-relaxed">
            <h3 className="font-semibold mb-2">?�품 ?�명</h3>
            <p>{item.desc}</p>
          </div>
        )}

        {item.locationName && (
          <div className="flex items-center text-gray-600 mt-4">
            <MapPin size={16} className="mr-2" />
            <span>{item.locationName}</span>
          </div>
        )}
      </div>

      {/* ?�션 버튼??*/}
      <div className="bg-white p-4 space-y-3">
        <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center">
          <MessageCircle size={20} className="mr-2" />
          채팅?�로 문의?�기
        </button>
        
        <div className="flex space-x-3">
          <button className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 flex items-center justify-center">
            <Heart size={20} className="mr-2" />
            관?�상??          </button>
          <button className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50">
            공유?�기
          </button>
        </div>
      </div>

      {/* ?�품 ID (?�버그용) */}
      <div className="p-4 text-xs text-gray-400">
        ?�품 ID: {id}
      </div>
    </div>
  );
}
