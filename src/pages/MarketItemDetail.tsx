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

  // ??채팅�??�성 ?�는 기존 채팅방으�??�동
  const handleContactSeller = async () => {
    if (!user) {
      alert("로그?�이 ?�요?�니??");
      navigate("/login");
      return;
    }

    if (!item?.sellerId) {
      alert("?�매???�보�?불러?????�습?�다.");
      return;
    }

    if (user.uid === item.sellerId) {
      alert("본인???�품?�니??");
      return;
    }

    setCreatingChat(true);
    try {
      // 기존 채팅�??�인
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("buyerId", "==", user.uid),
        where("sellerId", "==", item.sellerId),
        where("productId", "==", id)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // 기존 채팅방이 ?�으�??�당 채팅방으�??�동
        const existingChatId = snapshot.docs[0].id;
        navigate(`/chat/${existingChatId}`);
      } else {
        // ??채팅�??�성
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
      console.error("채팅�??�성 ?�류:", error);
      alert("채팅방을 ?�성?�는 �??�류가 발생?�습?�다.");
    } finally {
      setCreatingChat(false);
    }
  };

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) {
        console.error("??ID가 ?�습?�다!");
        setError("?�품 ID가 ?�습?�다.");
        setLoading(false);
        return;
      }

      console.log("?�� ?�품 조회 ?�작:", {
        id,
        collection: "marketItems",
        path: `marketItems/${id}`
      });

      try {
        const docRef = doc(db, "marketItems", id);
        console.log("?�� Firestore 문서 참조:", docRef.path);
        
        const snap = await getDoc(docRef);
        console.log("?�� Firestore ?�답:", {
          exists: snap.exists(),
          id: snap.id,
          data: snap.data()
        });

        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as Product;
          console.log("???�품 ?�이??로드 ?�공:", data);
          setItem(data);
        } else {
          console.warn("?�️ 문서가 존재?��? ?�습?�다:", id);
          setError(`???�품??찾을 ???�습?�다. (ID: ${id})`);
        }
      } catch (err: any) {
        console.error("?�� Firestore ?�류:", {
          message: err.message,
          code: err.code,
          details: err
        });
        setError(`?�️ ?�이?��? 불러?�는 �??�류가 발생?�습?�다. (${err.code || err.message})`);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        ?�품 ?�보�?불러?�는 �?..
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-600 px-4">
        <div className="text-6xl mb-4">?��</div>
        <div className="text-xl font-semibold mb-2">{error}</div>
        <div className="text-sm text-gray-500 mb-4">
          컬렉?? marketItems / ID: {id}
        </div>
        <button
          onClick={() => window.location.href = '/market'}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          마켓?�로 ?�아가�?        </button>
        <div className="mt-6 text-xs text-gray-400">
          <p>?�� 문제 ?�결 방법:</p>
          <p>1. Firebase Console?�서 marketItems 컬렉???�인</p>
          <p>2. ?�당 ID??문서가 존재?�는지 ?�인</p>
          <p>3. Firestore Rules?�서 ?�기 권한 ?�인</p>
        </div>
      </div>
    );

  if (!item)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        ?�품 ?�보가 ?�습?�다.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-3xl mx-auto p-6">
        {/* ?�품 ?��?지 */}
        <img
          src={item.fileUrl || item.imageUrl}
          alt={item.title}
          className="w-full h-96 object-cover rounded-2xl shadow-lg mb-6"
        />

        {/* ?�품 ?�보 */}
        <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{item.title}</h1>
          
          <p className="text-lg text-gray-700 mb-6 whitespace-pre-line leading-relaxed">
            {item.caption_ko || item.description || item.desc || "?�세 ?�명???�습?�다."}
          </p>

          <div className="flex items-center justify-between mb-6 pb-6 border-b">
            <div>
              <p className="text-sm text-gray-500 mb-1">?�매 가�?/p>
              <p className="text-3xl font-bold text-green-600">
                ?�� {item.price ? `${item.price.toLocaleString()}?? : "가�?미정"}
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
                  {item.status === 'active' ? '???�매�? : 
                   item.status === 'sold' ? '???�매?�료' : 
                   '???�약�?}
                </span>
              </div>
            )}
          </div>

          {/* ?�그 */}
          {item.tags && item.tags.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">관???�그</p>
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

          {/* ?�매???�보 */}
          {item.sellerId && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">?�매??/p>
              <p className="text-gray-800 font-medium">ID: {item.sellerId.substring(0, 8)}...</p>
            </div>
          )}

          {/* ?�치 ?�보 */}
          {item.location && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">?�� 거래 ?�치</p>
              <p className="text-gray-800 font-medium">
                {item.location.region || `?�도: ${item.location.lat?.toFixed(4)}, 경도: ${item.location.lng?.toFixed(4)}`}
              </p>
            </div>
          )}
        </div>

        {/* ?�션 버튼 */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
          {user?.uid === item.sellerId ? (
            // ???�성?�일 ?? ?�정·??�� 버튼
            <>
              <button
                onClick={() => navigate(`/market/edit/${id}`)}
                className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 text-white rounded-xl font-semibold transition-colors shadow-md"
              >
                ?�️ ?�정?�기
              </button>
              <button
                onClick={async () => {
                  if (confirm("?�말 ??��?�시겠습?�까?")) {
                    try {
                      await deleteDoc(doc(db, "marketItems", id as string));
                      alert("?�품????��?�었?�니??");
                      navigate("/market");
                    } catch (error) {
                      console.error("??�� ?�류:", error);
                      alert("??�� �??�류가 발생?�습?�다.");
                    }
                  }
                }}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors shadow-md"
              >
                ?���???��?�기
              </button>
            </>
          ) : (
            // ???�성?��? ?�닐 ?? ?�락?�기 버튼
            <button
              onClick={handleContactSeller}
              disabled={creatingChat}
              className="w-full sm:flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {creatingChat ? "채팅�?준�?�?.." : "?�� ?�매?�에�??�락?�기"}
            </button>
          )}
          
          {/* 마켓?�로 ?�아가�?버튼 */}
          <button
            onClick={() => navigate('/market')}
            className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
          >
            ?�� 마켓?�로
          </button>
        </div>

        {/* 비로그인 or ?�성???�님 ?�내 */}
        {!user && (
          <div className="mt-4 text-center text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
            ?�� 로그?�하�??�매?��? 채팅?????�습?�다.
          </div>
        )}
        {user && user.uid !== item.sellerId && (
          <div className="mt-4 text-center text-xs text-gray-400">
            ???�품?� ?�른 ?�용?��? ?�록?�습?�다.
          </div>
        )}

        {/* ?�버�??�보 (개발?? */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
            <p>?�� Debug Info:</p>
            <p>ID: {item.id}</p>
            <p>Collection: marketItems</p>
            <p>Created: {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
