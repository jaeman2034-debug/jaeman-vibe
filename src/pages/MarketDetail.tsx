// ???í’ˆ ?ì„¸ ?˜ì´ì§€ ì»´í¬?ŒíŠ¸
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

  // Firestore?ì„œ ?í’ˆ ?°ì´??ì¡°íšŒ
  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      
      try {
        // marketItems ì»¬ë ‰?˜ì—???í’ˆ ì¡°íšŒ
        const docRef = doc(db, "marketItems", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setItem({ id: docSnap.id, ...docSnap.data() } as MarketItem);
        } else {
          console.log("?í’ˆ??ì°¾ì„ ???†ìŠµ?ˆë‹¤");
        }
      } catch (error) {
        console.error("?í’ˆ ì¡°íšŒ ?¤íŒ¨:", error);
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
          <p className="text-gray-500">?í’ˆ ?•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">?í’ˆ??ì°¾ì„ ???†ì–´??/h1>
          <p className="text-gray-500 mb-6">?”ì²­?˜ì‹  ?í’ˆ??ì¡´ì¬?˜ì? ?ŠìŠµ?ˆë‹¤.</p>
          <button
            onClick={() => navigate("/market")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            ë§ˆì¼“?¼ë¡œ ?Œì•„ê°€ê¸?          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ?¤ë” */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={20} className="mr-2" />
          ?¤ë¡œê°€ê¸?        </button>
        <h1 className="text-lg font-semibold">?í’ˆ ?ì„¸</h1>
        <div className="w-8"></div> {/* ê· í˜•???„í•œ ë¹?ê³µê°„ */}
      </div>

      {/* ?í’ˆ ?´ë?ì§€ */}
      <div className="bg-white">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-80 object-cover"
          />
        ) : (
          <div className="w-full h-80 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">?´ë?ì§€ ?†ìŒ</span>
          </div>
        )}
      </div>

      {/* ?í’ˆ ?•ë³´ */}
      <div className="bg-white p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h2>
        <div className="text-2xl font-bold text-green-600 mb-4">
          {item.price.toLocaleString()}??        </div>
        
        {item.desc && (
          <div className="text-gray-700 leading-relaxed">
            <h3 className="font-semibold mb-2">?í’ˆ ?¤ëª…</h3>
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

      {/* ?¡ì…˜ ë²„íŠ¼??*/}
      <div className="bg-white p-4 space-y-3">
        <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center">
          <MessageCircle size={20} className="mr-2" />
          ì±„íŒ…?¼ë¡œ ë¬¸ì˜?˜ê¸°
        </button>
        
        <div className="flex space-x-3">
          <button className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 flex items-center justify-center">
            <Heart size={20} className="mr-2" />
            ê´€?¬ìƒ??          </button>
          <button className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50">
            ê³µìœ ?˜ê¸°
          </button>
        </div>
      </div>

      {/* ?í’ˆ ID (?”ë²„ê·¸ìš©) */}
      <div className="p-4 text-xs text-gray-400">
        ?í’ˆ ID: {id}
      </div>
    </div>
  );
}
