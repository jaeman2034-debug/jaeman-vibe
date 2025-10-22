/**
 * ?ï¸ ?í’ˆ ?˜ì • ?˜ì´ì§€
 * 
 * ?ë§¤?ê? ?ì‹ ???í’ˆ ?•ë³´ë¥??˜ì •?????ˆìŠµ?ˆë‹¤.
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, serverTimestamp, getFirestore } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

const db = getFirestore();
const auth = getAuth();
const storage = getStorage();

export default function MarketEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [sellerKakao, setSellerKakao] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState("");

  // ?¬ìš©???¸ì¦
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        alert("ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??");
        navigate("/market");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // ê¸°ì¡´ ?í’ˆ ë¶ˆëŸ¬?¤ê¸°
  useEffect(() => {
    const fetchItem = async () => {
      if (!id || !userId) return;

      try {
        const ref = doc(db, "marketItems", id);
        const snap = await getDoc(ref);
        
        if (snap.exists()) {
          const data = snap.data();
          
          // ê¶Œí•œ ì²´í¬: ë³¸ì¸ ?í’ˆë§??˜ì • ê°€??          if (data.sellerUid !== userId) {
            alert("ë³¸ì¸ ?í’ˆë§??˜ì •?????ˆìŠµ?ˆë‹¤.");
            navigate("/market");
            return;
          }

          setItem({ id: snap.id, ...data });
          
          // ?¼ì— ê¸°ì¡´ ?°ì´??ì±„ìš°ê¸?          setTitle(data.title || "");
          setPrice(data.price?.toString() || "");
          setDesc(data.desc || "");
          setCategory(data.category || "");
          setSellerKakao(data.sellerKakao || "");
          setCurrentImageUrl(data.imageUrl || "");
          
          console.log("???í’ˆ ?°ì´??ë¡œë“œ ?„ë£Œ:", data.title);
        } else {
          alert("?í’ˆ ?•ë³´ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤.");
          navigate("/market");
        }
      } catch (error) {
        console.error("???í’ˆ ë¶ˆëŸ¬?¤ê¸° ?¤ë¥˜:", error);
        alert("?í’ˆ ?•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
        navigate("/market");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, userId, navigate]);

  // ?˜ì • ?€??  const handleSave = async () => {
    if (!title || !price) {
      alert("?í’ˆëª…ê³¼ ê°€ê²©ì? ?„ìˆ˜?…ë‹ˆ??");
      return;
    }

    if (!userId || !id) return;

    setSaving(true);

    try {
      let imageUrl = currentImageUrl;

      let imagePath = item.imagePath || ""; // ê¸°ì¡´ ê²½ë¡œ ? ì?
      
      // ???´ë?ì§€ê°€ ? íƒ??ê²½ìš° ?…ë¡œ??      if (image) {
        console.log("?“¤ ???´ë?ì§€ ?…ë¡œ??ì¤?..");
        imagePath = `market-images/${Date.now()}_${image.name}`;
        const storageRef = ref(storage, imagePath);
        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);
        console.log("???´ë?ì§€ ?…ë¡œ???„ë£Œ");
        
        // ?—‘ï¸?ê¸°ì¡´ ?´ë?ì§€ ?? œ (???´ë?ì§€ë¡?êµì²´ ??
        if (item.imagePath && item.imagePath !== imagePath) {
          try {
            const oldImageRef = ref(storage, item.imagePath);
            await deleteObject(oldImageRef);
            console.log("??ê¸°ì¡´ ?´ë?ì§€ ?? œ ?„ë£Œ:", item.imagePath);
          } catch (error: any) {
            if (error.code !== "storage/object-not-found") {
              console.warn("? ï¸ ê¸°ì¡´ ?´ë?ì§€ ?? œ ?¤íŒ¨ (ê³„ì† ì§„í–‰):", error);
            }
          }
        }
      }

      // Firestore ?…ë°?´íŠ¸
      await updateDoc(doc(db, "marketItems", id), {
        title,
        price: Number(price),
        desc,
        category,
        sellerKakao: sellerKakao || null,
        imageUrl,
        imagePath, // ?†• Storage ê²½ë¡œ ?…ë°?´íŠ¸
        updatedAt: serverTimestamp(),
      });

      console.log("???í’ˆ ?˜ì • ?„ë£Œ:", id);
      alert("?í’ˆ???˜ì •?˜ì—ˆ?µë‹ˆ??");
      
      // ?ì„¸ ?˜ì´ì§€ë¡??´ë™
      navigate(`/product/${id}`);
    } catch (error) {
      console.error("???˜ì • ?€???¤ë¥˜:", error);
      alert("?˜ì • ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center py-16">
          <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <div className="text-gray-600">?í’ˆ ?•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ” ì¤?..</div>
        </div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* ?¤ë” */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/product/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={20} />
          <span>?ì„¸ ?˜ì´ì§€ë¡??Œì•„ê°€ê¸?/span>
        </button>
        
        <h1 className="text-3xl font-bold text-gray-800">?ï¸ ?í’ˆ ?˜ì •</h1>
        <p className="text-gray-600 mt-2">?í’ˆ ?•ë³´ë¥??˜ì •?????ˆìŠµ?ˆë‹¤</p>
      </div>

      {/* ?˜ì • ??*/}
      <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
        {/* ?í’ˆëª?*/}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            ?í’ˆëª?<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="?? ?˜ì´??ì¶•êµ¬??
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* ê°€ê²?*/}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            ê°€ê²?(?? <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="?? 50000"
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* ì¹´í…Œê³ ë¦¬ */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            ì¹´í…Œê³ ë¦¬
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">? íƒ?˜ì„¸??/option>
            <option value="ì¶•êµ¬">ì¶•êµ¬</option>
            <option value="?¼êµ¬">?¼êµ¬</option>
            <option value="?êµ¬">?êµ¬</option>
            <option value="ë°°êµ¬">ë°°êµ¬</option>
            <option value="ê¸°í?">ê¸°í?</option>
          </select>
        </div>

        {/* ?í’ˆ ?¤ëª… */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            ?í’ˆ ?¤ëª…
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="?í’ˆ???€???¤ëª…???…ë ¥?˜ì„¸??
            rows={6}
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* ì¹´ì¹´?¤í†¡ URL */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            ì¹´ì¹´?¤í†¡ ?¤í”ˆì±„íŒ… URL (? íƒ)
          </label>
          <input
            type="text"
            value={sellerKakao}
            onChange={(e) => setSellerKakao(e.target.value)}
            placeholder="https://open.kakao.com/o/..."
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            ?’¡ ?…ë ¥?˜ì? ?Šìœ¼ë©?YAGO VIBE ?´ë? ì±„íŒ…???¬ìš©?©ë‹ˆ??          </p>
        </div>

        {/* ?„ì¬ ?´ë?ì§€ */}
        {currentImageUrl && (
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              ?„ì¬ ?´ë?ì§€
            </label>
            <img
              src={currentImageUrl}
              alt="?„ì¬ ?í’ˆ ?´ë?ì§€"
              className="w-48 h-48 object-cover rounded-xl border"
            />
          </div>
        )}

        {/* ?´ë?ì§€ ë³€ê²?*/}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            ?´ë?ì§€ ë³€ê²?(? íƒ)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
            className="w-full border rounded-xl px-4 py-3 text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            ?’¡ ???´ë?ì§€ë¥?? íƒ?˜ì? ?Šìœ¼ë©?ê¸°ì¡´ ?´ë?ì§€ê°€ ? ì??©ë‹ˆ??          </p>
        </div>
      </div>

      {/* ë²„íŠ¼ */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={() => navigate(`/product/${id}`)}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          ì·¨ì†Œ
        </button>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>?€??ì¤?..</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>?€??/span>
            </>
          )}
        </button>
      </div>

      {/* ?ˆë‚´ */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          ?’¡ ?„ì¹˜ ?•ë³´?€ AI ?œê·¸???˜ì •?????†ìŠµ?ˆë‹¤. ?„ìš”???í’ˆ???? œ?˜ê³  ?¤ì‹œ ?±ë¡?´ì£¼?¸ìš”.
        </p>
      </div>
    </div>
  );
}
