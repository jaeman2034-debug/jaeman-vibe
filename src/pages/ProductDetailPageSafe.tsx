import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function ProductDetailPageSafe() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ??ë¡œê·¸??ì²´í¬
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
      console.log("?” ë¡œê·¸???íƒœ ë³€ê²?", user ? user.uid : "ë¡œê·¸?„ì›ƒ");
    });
    return () => unsubscribe();
  }, []);

  // ???í’ˆ ?°ì´??ë¶ˆëŸ¬?¤ê¸°
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError("?í’ˆ IDê°€ ?†ìŠµ?ˆë‹¤.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // ???¬ë°”ë¥?ì»¬ë ‰?˜ëª… ?¬ìš©
        const productRef = doc(db, "marketItems", id);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          const data = productSnap.data();
          const productData = { id: productSnap.id, ...data };
          setProduct(productData);
          
          // ??sellerId ?•ì¸ ë°?isOwner ?¤ì •
          const currentUser = auth.currentUser;
          const ownerCheck = currentUser && data.sellerId === currentUser.uid;
          setIsOwner(!!ownerCheck);
          
          console.log("?“¦ ?í’ˆ ë¡œë“œ ?„ë£Œ:", productData.title);
          console.log("?‘¤ ?„ì¬ ?¬ìš©??", currentUser?.uid);
          console.log("?ª ?í’ˆ ?Œìœ ??", data.sellerId);
          console.log("?” ?Œìœ ???•ì¸:", ownerCheck);
        } else {
          setError("?í’ˆ??ì°¾ì„ ???†ìŠµ?ˆë‹¤.");
          console.warn("???í’ˆ ?†ìŒ:", id);
        }
      } catch (error) {
        console.error("???í’ˆ ë¶ˆëŸ¬?¤ê¸° ?¤íŒ¨:", error);
        setError("?í’ˆ??ë¶ˆëŸ¬?¤ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // ???í’ˆ ?? œ
  const handleDelete = async () => {
    if (!isOwner) {
      alert("?? œ ê¶Œí•œ???†ìŠµ?ˆë‹¤.");
      return;
    }

    if (!product) {
      alert("?í’ˆ ?•ë³´ê°€ ?†ìŠµ?ˆë‹¤.");
      return;
    }

    if (!window.confirm("?•ë§ë¡????í’ˆ???? œ?˜ì‹œê² ìŠµ?ˆê¹Œ?")) {
      return;
    }

    try {
      // ???´ë?ì§€ ?? œ (Storage)
      if (product.imagePath) {
        try {
          const imageRef = ref(storage, product.imagePath);
          await deleteObject(imageRef);
          console.log("???´ë?ì§€ ?? œ ?„ë£Œ");
        } catch (imageError) {
          console.warn("? ï¸ ?´ë?ì§€ ?? œ ?¤íŒ¨ (ê³„ì† ì§„í–‰):", imageError);
        }
      }

      // ??Firestore ë¬¸ì„œ ?? œ
      await deleteDoc(doc(db, "marketItems", id!));
      console.log("???í’ˆ ?? œ ?„ë£Œ");

      alert("?í’ˆ???? œ?˜ì—ˆ?µë‹ˆ??");
      navigate("/market");
    } catch (error) {
      console.error("???í’ˆ ?? œ ?¤ë¥˜:", error);
      alert("?í’ˆ ?? œ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    }
  };

  // ???íƒœ ë³€ê²?  const toggleStatus = async () => {
    if (!isOwner) {
      alert("?íƒœ ë³€ê²?ê¶Œí•œ???†ìŠµ?ˆë‹¤.");
      return;
    }

    if (!product) {
      alert("?í’ˆ ?•ë³´ê°€ ?†ìŠµ?ˆë‹¤.");
      return;
    }

    try {
      // ???„ì¬ ?„ë¡œ?íŠ¸ ?íƒœ ì²´ê³„ ?¬ìš©
      const statusCycle = {
        "open": "reserved",
        "reserved": "sold", 
        "sold": "open"
      };

      const currentStatus = product.status || "open";
      const newStatus = statusCycle[currentStatus as keyof typeof statusCycle] || "open";

      await updateDoc(doc(db, "marketItems", id!), { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      setProduct({ ...product, status: newStatus });
      
      const statusText = {
        "open": "?ë§¤ì¤?,
        "reserved": "ê±°ë˜ì¤?,
        "sold": "ê±°ë˜?„ë£Œ"
      };

      alert(`?í’ˆ ?íƒœê°€ '${statusText[newStatus as keyof typeof statusText]}'?¼ë¡œ ë³€ê²½ë˜?ˆìŠµ?ˆë‹¤.`);
      console.log("???íƒœ ë³€ê²??„ë£Œ:", newStatus);
    } catch (error) {
      console.error("???íƒœ ë³€ê²??¤ë¥˜:", error);
      alert("?í’ˆ ?íƒœ ë³€ê²?ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    }
  };

  // ??ë¡œë”© ?íƒœ
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">?í’ˆ ?•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
        </div>
      </div>
    );
  }

  // ???ëŸ¬ ?íƒœ
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">??/div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">{error}</h2>
          <button
            onClick={() => navigate("/market")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
          >
            ë§ˆì¼“?¼ë¡œ ?´ë™
          </button>
        </div>
      </div>
    );
  }

  // ???í’ˆ ?†ìŒ
  if (!product) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">?“¦</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">?í’ˆ??ì°¾ì„ ???†ìŠµ?ˆë‹¤</h2>
          <button
            onClick={() => navigate("/market")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
          >
            ë§ˆì¼“?¼ë¡œ ?´ë™
          </button>
        </div>
      </div>
    );
  }

  // ???íƒœë³??‰ìƒ ë°??ìŠ¤??  const getStatusInfo = (status?: string) => {
    switch (status) {
      case "open":
        return { color: "text-green-600", text: "?ë§¤ì¤?, bgColor: "bg-green-100" };
      case "reserved":
        return { color: "text-yellow-600", text: "ê±°ë˜ì¤?, bgColor: "bg-yellow-100" };
      case "sold":
        return { color: "text-gray-600", text: "ê±°ë˜?„ë£Œ", bgColor: "bg-gray-100" };
      default:
        return { color: "text-blue-600", text: "?íƒœë¶ˆëª…", bgColor: "bg-blue-100" };
    }
  };

  const statusInfo = getStatusInfo(product.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ?¤ë” */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/market")}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              ??ë§ˆì¼“?¼ë¡œ ?Œì•„ê°€ê¸?            </button>
            <h1 className="text-xl font-bold text-gray-800">?í’ˆ ?ì„¸</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* ?´ë?ì§€ */}
          {product.imageUrl && (
            <div className="aspect-video bg-gray-100">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6">
            {/* ?íƒœ ë°°ì? */}
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                ??{statusInfo.text}
              </span>
              <div className="text-sm text-gray-500">
                ?±ë¡?? {product.createdAt?.toDate?.()?.toLocaleDateString("ko-KR") || "? ì§œ ?†ìŒ"}
              </div>
            </div>

            {/* ?œëª© */}
            <h1 className="text-2xl font-bold mb-4">{product.title}</h1>

            {/* ê°€ê²?*/}
            <div className="text-3xl font-bold text-blue-600 mb-4">
              {product.price?.toLocaleString()}??            </div>

            {/* ?¤ëª… */}
            <p className="text-gray-700 mb-6 whitespace-pre-wrap">
              {product.desc || "?¤ëª… ?†ìŒ"}
            </p>

            {/* ??ê´€ë¦¬ì ë©”ë‰´ (ë³¸ì¸ë§?ë³´ì´ê²? */}
            {isOwner ? (
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(`/product/edit/${product.id}`)}
                  className="px-6 py-3 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition"
                >
                  ?ï¸ ?˜ì •?˜ê¸°
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  ?—‘ï¸??? œ?˜ê¸°
                </button>
                <button
                  onClick={toggleStatus}
                  className={`px-6 py-3 text-white rounded-lg transition ${
                    product.status === "open" ? "bg-green-500 hover:bg-green-600" :
                    product.status === "reserved" ? "bg-yellow-500 hover:bg-yellow-600" :
                    "bg-gray-500 hover:bg-gray-600"
                  }`}
                >
                  ?”„ ?íƒœ ë³€ê²?({statusInfo.text})
                </button>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg text-center">
                <p className="text-gray-600 mb-3">? ï¸ ?¼ë°˜ ?¬ìš©??(ê´€ë¦?ê¶Œí•œ ?†ìŒ)</p>
                {userId ? (
                  <button
                    onClick={() => navigate(`/chat/${product.id}`)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
                  >
                    ?’¬ ?ë§¤?ì—ê²??°ë½?˜ê¸°
                  </button>
                ) : (
                  <p className="text-sm text-gray-500">ë¡œê·¸?????°ë½?????ˆìŠµ?ˆë‹¤.</p>
                )}
              </div>
            )}

            {/* ?”ë²„ê¹??•ë³´ */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
              <h3 className="font-semibold text-blue-800 mb-2">?” ?”ë²„ê¹??•ë³´</h3>
              <p><strong>?„ì¬ ë¡œê·¸??UID:</strong> {userId || "ë¡œê·¸???ˆë¨"}</p>
              <p><strong>?í’ˆ sellerId:</strong> {product.sellerId || "?†ìŒ"}</p>
              <p><strong>isOwner:</strong> {isOwner ? "???? : "???„ë‹ˆ??}</p>
              <p><strong>?í’ˆ ID:</strong> {product.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
