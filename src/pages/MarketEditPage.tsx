/**
 * ?�️ ?�품 ?�정 ?�이지
 * 
 * ?�매?��? ?�신???�품 ?�보�??�정?????�습?�다.
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

  // ?�용???�증
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        alert("로그?�이 ?�요?�니??");
        navigate("/market");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 기존 ?�품 불러?�기
  useEffect(() => {
    const fetchItem = async () => {
      if (!id || !userId) return;

      try {
        const ref = doc(db, "marketItems", id);
        const snap = await getDoc(ref);
        
        if (snap.exists()) {
          const data = snap.data();
          
          // 권한 체크: 본인 ?�품�??�정 가??          if (data.sellerUid !== userId) {
            alert("본인 ?�품�??�정?????�습?�다.");
            navigate("/market");
            return;
          }

          setItem({ id: snap.id, ...data });
          
          // ?�에 기존 ?�이??채우�?          setTitle(data.title || "");
          setPrice(data.price?.toString() || "");
          setDesc(data.desc || "");
          setCategory(data.category || "");
          setSellerKakao(data.sellerKakao || "");
          setCurrentImageUrl(data.imageUrl || "");
          
          console.log("???�품 ?�이??로드 ?�료:", data.title);
        } else {
          alert("?�품 ?�보�?찾을 ???�습?�다.");
          navigate("/market");
        }
      } catch (error) {
        console.error("???�품 불러?�기 ?�류:", error);
        alert("?�품 ?�보�?불러?�는 �??�류가 발생?�습?�다.");
        navigate("/market");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, userId, navigate]);

  // ?�정 ?�??  const handleSave = async () => {
    if (!title || !price) {
      alert("?�품명과 가격�? ?�수?�니??");
      return;
    }

    if (!userId || !id) return;

    setSaving(true);

    try {
      let imageUrl = currentImageUrl;

      let imagePath = item.imagePath || ""; // 기존 경로 ?��?
      
      // ???��?지가 ?�택??경우 ?�로??      if (image) {
        console.log("?�� ???��?지 ?�로??�?..");
        imagePath = `market-images/${Date.now()}_${image.name}`;
        const storageRef = ref(storage, imagePath);
        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);
        console.log("???��?지 ?�로???�료");
        
        // ?���?기존 ?��?지 ??�� (???��?지�?교체 ??
        if (item.imagePath && item.imagePath !== imagePath) {
          try {
            const oldImageRef = ref(storage, item.imagePath);
            await deleteObject(oldImageRef);
            console.log("??기존 ?��?지 ??�� ?�료:", item.imagePath);
          } catch (error: any) {
            if (error.code !== "storage/object-not-found") {
              console.warn("?�️ 기존 ?��?지 ??�� ?�패 (계속 진행):", error);
            }
          }
        }
      }

      // Firestore ?�데?�트
      await updateDoc(doc(db, "marketItems", id), {
        title,
        price: Number(price),
        desc,
        category,
        sellerKakao: sellerKakao || null,
        imageUrl,
        imagePath, // ?�� Storage 경로 ?�데?�트
        updatedAt: serverTimestamp(),
      });

      console.log("???�품 ?�정 ?�료:", id);
      alert("?�품???�정?�었?�니??");
      
      // ?�세 ?�이지�??�동
      navigate(`/product/${id}`);
    } catch (error) {
      console.error("???�정 ?�???�류:", error);
      alert("?�정 �??�류가 발생?�습?�다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center py-16">
          <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <div className="text-gray-600">?�품 ?�보�?불러?�는 �?..</div>
        </div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* ?�더 */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/product/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={20} />
          <span>?�세 ?�이지�??�아가�?/span>
        </button>
        
        <h1 className="text-3xl font-bold text-gray-800">?�️ ?�품 ?�정</h1>
        <p className="text-gray-600 mt-2">?�품 ?�보�??�정?????�습?�다</p>
      </div>

      {/* ?�정 ??*/}
      <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
        {/* ?�품�?*/}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            ?�품�?<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="?? ?�이??축구??
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 가�?*/}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            가�?(?? <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="?? 50000"
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 카테고리 */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            카테고리
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">?�택?�세??/option>
            <option value="축구">축구</option>
            <option value="?�구">?�구</option>
            <option value="?�구">?�구</option>
            <option value="배구">배구</option>
            <option value="기�?">기�?</option>
          </select>
        </div>

        {/* ?�품 ?�명 */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            ?�품 ?�명
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="?�품???�???�명???�력?�세??
            rows={6}
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 카카?�톡 URL */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            카카?�톡 ?�픈채팅 URL (?�택)
          </label>
          <input
            type="text"
            value={sellerKakao}
            onChange={(e) => setSellerKakao(e.target.value)}
            placeholder="https://open.kakao.com/o/..."
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            ?�� ?�력?��? ?�으�?YAGO VIBE ?��? 채팅???�용?�니??          </p>
        </div>

        {/* ?�재 ?��?지 */}
        {currentImageUrl && (
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              ?�재 ?��?지
            </label>
            <img
              src={currentImageUrl}
              alt="?�재 ?�품 ?��?지"
              className="w-48 h-48 object-cover rounded-xl border"
            />
          </div>
        )}

        {/* ?��?지 변�?*/}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            ?��?지 변�?(?�택)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
            className="w-full border rounded-xl px-4 py-3 text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            ?�� ???��?지�??�택?��? ?�으�?기존 ?��?지가 ?��??�니??          </p>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={() => navigate(`/product/${id}`)}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          취소
        </button>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>?�??�?..</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>?�??/span>
            </>
          )}
        </button>
      </div>

      {/* ?�내 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          ?�� ?�치 ?�보?� AI ?�그???�정?????�습?�다. ?�요???�품????��?�고 ?�시 ?�록?�주?�요.
        </p>
      </div>
    </div>
  );
}
