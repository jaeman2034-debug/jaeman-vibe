import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, deleteDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

interface Product {
  id: string;
  title?: string;
  caption_ko?: string;
  fileUrl?: string;
  price?: number;
  tags?: string[];
  sellerId?: string;
}

export default function MarketItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [item, setItem] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingChat, setCreatingChat] = useState(false);

  // ??ì±„íŒ…ë°??ì„± ?ëŠ” ê¸°ì¡´ ì±„íŒ…ë°©ìœ¼ë¡??´ë™
  const handleContactSeller = async () => {
    if (!user) {
      alert("ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??");
      navigate("/login");
      return;
    }

    if (!item?.sellerId) {
      alert("?ë§¤???•ë³´ë¥?ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.");
      return;
    }

    if (user.uid === item.sellerId) {
      alert("ë³¸ì¸???í’ˆ?…ë‹ˆ??");
      return;
    }

    setCreatingChat(true);
    try {
      // ê¸°ì¡´ ì±„íŒ…ë°??•ì¸
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("buyerId", "==", user.uid),
        where("sellerId", "==", item.sellerId),
        where("productId", "==", id)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // ê¸°ì¡´ ì±„íŒ…ë°©ì´ ?ˆìœ¼ë©??´ë‹¹ ì±„íŒ…ë°©ìœ¼ë¡??´ë™
        const existingChatId = snapshot.docs[0].id;
        navigate(`/chat/${existingChatId}`);
      } else {
        // ??ì±„íŒ…ë°??ì„±
        const newChatRef = await addDoc(collection(db, "chats"), {
          buyerId: user.uid,
          sellerId: item.sellerId,
          productId: id,
          productTitle: item.title,
          productImageUrl: item.fileUrl || item.imageUrl,
          productPrice: item.price,
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp(),
        });
        navigate(`/chat/${newChatRef.id}`);
      }
    } catch (error) {
      console.error("ì±„íŒ…ë°??ì„± ?¤ë¥˜:", error);
      alert("ì±„íŒ…ë°©ì„ ?ì„±?˜ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    } finally {
      setCreatingChat(false);
    }
  };

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) {
        console.error("??IDê°€ ?†ìŠµ?ˆë‹¤!");
        setError("?í’ˆ IDê°€ ?†ìŠµ?ˆë‹¤.");
        setLoading(false);
        return;
      }

      console.log("?” ?í’ˆ ì¡°íšŒ ?œì‘:", {
        id,
        collection: "marketItems",
        path: `marketItems/${id}`
      });

      try {
        const docRef = doc(db, "marketItems", id);
        console.log("?“„ Firestore ë¬¸ì„œ ì°¸ì¡°:", docRef.path);
        
        const snap = await getDoc(docRef);
        console.log("?“Š Firestore ?‘ë‹µ:", {
          exists: snap.exists(),
          id: snap.id,
          data: snap.data()
        });

        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as Product;
          console.log("???í’ˆ ?°ì´??ë¡œë“œ ?±ê³µ:", data);
          setItem(data);
        } else {
          console.warn("? ï¸ ë¬¸ì„œê°€ ì¡´ì¬?˜ì? ?ŠìŠµ?ˆë‹¤:", id);
          setError(`???í’ˆ??ì°¾ì„ ???†ìŠµ?ˆë‹¤. (ID: ${id})`);
        }
      } catch (err: any) {
        console.error("?”¥ Firestore ?¤ë¥˜:", {
          message: err.message,
          code: err.code,
          details: err
        });
        setError(`? ï¸ ?°ì´?°ë? ë¶ˆëŸ¬?¤ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤. (${err.code || err.message})`);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        ?í’ˆ ?•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ” ì¤?..
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-600 px-4">
        <div className="text-6xl mb-4">?”</div>
        <div className="text-xl font-semibold mb-2">{error}</div>
        <div className="text-sm text-gray-500 mb-4">
          ì»¬ë ‰?? marketItems / ID: {id}
        </div>
        <button
          onClick={() => window.location.href = '/market'}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          ë§ˆì¼“?¼ë¡œ ?Œì•„ê°€ê¸?        </button>
        <div className="mt-6 text-xs text-gray-400">
          <p>?’¡ ë¬¸ì œ ?´ê²° ë°©ë²•:</p>
          <p>1. Firebase Console?ì„œ marketItems ì»¬ë ‰???•ì¸</p>
          <p>2. ?´ë‹¹ ID??ë¬¸ì„œê°€ ì¡´ì¬?˜ëŠ”ì§€ ?•ì¸</p>
          <p>3. Firestore Rules?ì„œ ?½ê¸° ê¶Œí•œ ?•ì¸</p>
        </div>
      </div>
    );

  if (!item)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        ?í’ˆ ?•ë³´ê°€ ?†ìŠµ?ˆë‹¤.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-3xl mx-auto p-6">
        {/* ?í’ˆ ?´ë?ì§€ */}
        <img
          src={item.fileUrl || item.imageUrl}
          alt={item.title}
          className="w-full h-96 object-cover rounded-2xl shadow-lg mb-6"
        />

        {/* ?í’ˆ ?•ë³´ */}
        <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{item.title}</h1>
          
          <p className="text-lg text-gray-700 mb-6 whitespace-pre-line leading-relaxed">
            {item.caption_ko || item.description || item.desc || "?ì„¸ ?¤ëª…???†ìŠµ?ˆë‹¤."}
          </p>

          <div className="flex items-center justify-between mb-6 pb-6 border-b">
            <div>
              <p className="text-sm text-gray-500 mb-1">?ë§¤ ê°€ê²?/p>
              <p className="text-3xl font-bold text-green-600">
                ?’° {item.price ? `${item.price.toLocaleString()}?? : "ê°€ê²?ë¯¸ì •"}
              </p>
            </div>
            {item.status && (
              <div>
                <span className={`
                  px-4 py-2 rounded-full text-sm font-semibold
                  ${item.status === 'active' ? 'bg-green-100 text-green-700' : 
                    item.status === 'sold' ? 'bg-gray-100 text-gray-500' : 
                    'bg-yellow-100 text-yellow-700'}
                `}>
                  {item.status === 'active' ? '???ë§¤ì¤? : 
                   item.status === 'sold' ? '???ë§¤?„ë£Œ' : 
                   '???ˆì•½ì¤?}
                </span>
              </div>
            )}
          </div>

          {/* ?œê·¸ */}
          {item.tags && item.tags.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">ê´€???œê·¸</p>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ?ë§¤???•ë³´ */}
          {item.sellerId && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">?ë§¤??/p>
              <p className="text-gray-800 font-medium">ID: {item.sellerId.substring(0, 8)}...</p>
            </div>
          )}

          {/* ?„ì¹˜ ?•ë³´ */}
          {item.location && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">?“ ê±°ë˜ ?„ì¹˜</p>
              <p className="text-gray-800 font-medium">
                {item.location.region || `?„ë„: ${item.location.lat?.toFixed(4)}, ê²½ë„: ${item.location.lng?.toFixed(4)}`}
              </p>
            </div>
          )}
        </div>

        {/* ?¡ì…˜ ë²„íŠ¼ */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
          {user?.uid === item.sellerId ? (
            // ???‘ì„±?ì¼ ?? ?˜ì •Â·?? œ ë²„íŠ¼
            <>
              <button
                onClick={() => navigate(`/market/edit/${id}`)}
                className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 text-white rounded-xl font-semibold transition-colors shadow-md"
              >
                ?ï¸ ?˜ì •?˜ê¸°
              </button>
              <button
                onClick={async () => {
                  if (confirm("?•ë§ ?? œ?˜ì‹œê² ìŠµ?ˆê¹Œ?")) {
                    try {
                      await deleteDoc(doc(db, "marketItems", id as string));
                      alert("?í’ˆ???? œ?˜ì—ˆ?µë‹ˆ??");
                      navigate("/market");
                    } catch (error) {
                      console.error("?? œ ?¤ë¥˜:", error);
                      alert("?? œ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
                    }
                  }
                }}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors shadow-md"
              >
                ?—‘ï¸??? œ?˜ê¸°
              </button>
            </>
          ) : (
            // ???‘ì„±?ê? ?„ë‹ ?? ?°ë½?˜ê¸° ë²„íŠ¼
            <button
              onClick={handleContactSeller}
              disabled={creatingChat}
              className="w-full sm:flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {creatingChat ? "ì±„íŒ…ë°?ì¤€ë¹?ì¤?.." : "?’¬ ?ë§¤?ì—ê²??°ë½?˜ê¸°"}
            </button>
          )}
          
          {/* ë§ˆì¼“?¼ë¡œ ?Œì•„ê°€ê¸?ë²„íŠ¼ */}
          <button
            onClick={() => navigate('/market')}
            className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
          >
            ?ª ë§ˆì¼“?¼ë¡œ
          </button>
        </div>

        {/* ë¹„ë¡œê·¸ì¸ or ?‘ì„±???„ë‹˜ ?ˆë‚´ */}
        {!user && (
          <div className="mt-4 text-center text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
            ?’¡ ë¡œê·¸?¸í•˜ë©??ë§¤?ì? ì±„íŒ…?????ˆìŠµ?ˆë‹¤.
          </div>
        )}
        {user && user.uid !== item.sellerId && (
          <div className="mt-4 text-center text-xs text-gray-400">
            ???í’ˆ?€ ?¤ë¥¸ ?¬ìš©?ê? ?±ë¡?ˆìŠµ?ˆë‹¤.
          </div>
        )}

        {/* ?”ë²„ê·??•ë³´ (ê°œë°œ?? */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
            <p>?” Debug Info:</p>
            <p>ID: {item.id}</p>
            <p>Collection: marketItems</p>
            <p>Created: {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
