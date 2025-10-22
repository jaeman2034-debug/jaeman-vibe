import { useState, useEffect } from "react";
import { db, storage, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function UploadPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ??무한 로딩 방�?: 10�????�동 ?�제
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setLoading(false);
        console.warn("?�️ ?�로?��? 지?�되???�동 ?�제?�었?�니??");
        alert("?�️ ?�로?��? 지?�되�??�습?�다. ?�시 ?�도?�주?�요.");
      }, 10000); // 10�???강제 ?�제
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !price || !image) {
      alert("?�수 ??��???�력?�세??");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("로그?�이 ?�요?�니??");
      navigate("/");
      return;
    }

    setLoading(true);
    try {
      console.log("?�� ?�품 ?�로???�작...");
      
      // 1️⃣ ?��?지 ?�로??      const imgRef = ref(storage, `market/${user.uid}_${Date.now()}.jpg`);
      await uploadBytes(imgRef, image);
      const url = await getDownloadURL(imgRef);
      console.log("???��?지 ?�로???�료:", url);

      // 2️⃣ Firestore???�품 ?�록
      await addDoc(collection(db, "marketItems"), {
        title,
        price: Number(price),
        description: desc,
        imageUrl: url,
        fileUrl: url,
        sellerId: user.uid,
        sellerName: user.displayName || "?�명 ?�용??,
        status: "active",
        createdAt: serverTimestamp(),
      });
      console.log("??Firestore ?�품 ?�록 ?�료");

      alert("???�품???�록?�었?�니??");
      navigate("/market");
    } catch (err) {
      console.error("???�록 ?�패:", err);
      alert("???�록 ?�패. ?�시 ?�도?�주?�요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="max-w-2xl mx-auto py-10 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">?�� ?�품 ?�록</h1>
          <p className="text-gray-500">?�매?�고 ?��? ?�포�??�품???�록?�세??/p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ?��?지 ?�로??*/}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ?�품 ?��?지 *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition"
                  >
                    ??                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">?��</div>
                  <p className="text-gray-600 mb-2">?��?지�??�택?�세??/p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                    required
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition"
                  >
                    ?�일 ?�택
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* ?�품 ?�목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ?�품 ?�목 *
            </label>
            <input
              type="text"
              placeholder="?? ?�이??축구??(260mm)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 가�?*/}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ?�매 가�?*
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="50000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <span className="absolute right-3 top-3 text-gray-500">??/span>
            </div>
          </div>

          {/* ?�품 ?�명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ?�품 ?�명
            </label>
            <textarea
              placeholder="?�품???�태, ?�용 기간, 거래 방법 ?�을 ?�세???�어주세??"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ?�내 문구 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              ?�� <strong>?�내:</strong> ?�품 ?�록 ???�른 ?�용?�들??채팅?�로 ?�락?????�습?�다.
            </p>
          </div>

          {/* ?�출 버튼 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/market")}
              className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 rounded-lg text-white font-semibold transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ?�록 �?..
                </span>
              ) : (
                "?�품 ?�록?�기"
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

