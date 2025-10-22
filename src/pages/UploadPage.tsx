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

  // ??ë¬´í•œ ë¡œë”© ë°©ì?: 10ì´????ë™ ?´ì œ
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setLoading(false);
        console.warn("? ï¸ ?…ë¡œ?œê? ì§€?°ë˜???ë™ ?´ì œ?˜ì—ˆ?µë‹ˆ??");
        alert("? ï¸ ?…ë¡œ?œê? ì§€?°ë˜ê³??ˆìŠµ?ˆë‹¤. ?¤ì‹œ ?œë„?´ì£¼?¸ìš”.");
      }, 10000); // 10ì´???ê°•ì œ ?´ì œ
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
      alert("?„ìˆ˜ ??ª©???…ë ¥?˜ì„¸??");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??");
      navigate("/");
      return;
    }

    setLoading(true);
    try {
      console.log("?“¤ ?í’ˆ ?…ë¡œ???œì‘...");
      
      // 1ï¸âƒ£ ?´ë?ì§€ ?…ë¡œ??      const imgRef = ref(storage, `market/${user.uid}_${Date.now()}.jpg`);
      await uploadBytes(imgRef, image);
      const url = await getDownloadURL(imgRef);
      console.log("???´ë?ì§€ ?…ë¡œ???„ë£Œ:", url);

      // 2ï¸âƒ£ Firestore???í’ˆ ?±ë¡
      await addDoc(collection(db, "marketItems"), {
        title,
        price: Number(price),
        description: desc,
        imageUrl: url,
        fileUrl: url,
        sellerId: user.uid,
        sellerName: user.displayName || "?µëª… ?¬ìš©??,
        status: "active",
        createdAt: serverTimestamp(),
      });
      console.log("??Firestore ?í’ˆ ?±ë¡ ?„ë£Œ");

      alert("???í’ˆ???±ë¡?˜ì—ˆ?µë‹ˆ??");
      navigate("/market");
    } catch (err) {
      console.error("???±ë¡ ?¤íŒ¨:", err);
      alert("???±ë¡ ?¤íŒ¨. ?¤ì‹œ ?œë„?´ì£¼?¸ìš”.");
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">?“¦ ?í’ˆ ?±ë¡</h1>
          <p className="text-gray-500">?ë§¤?˜ê³  ?¶ì? ?¤í¬ì¸??©í’ˆ???±ë¡?˜ì„¸??/p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ?´ë?ì§€ ?…ë¡œ??*/}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ?í’ˆ ?´ë?ì§€ *
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
                  <div className="text-6xl mb-4">?“·</div>
                  <p className="text-gray-600 mb-2">?´ë?ì§€ë¥?? íƒ?˜ì„¸??/p>
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
                    ?Œì¼ ? íƒ
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* ?í’ˆ ?œëª© */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ?í’ˆ ?œëª© *
            </label>
            <input
              type="text"
              placeholder="?? ?˜ì´??ì¶•êµ¬??(260mm)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* ê°€ê²?*/}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ?ë§¤ ê°€ê²?*
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

          {/* ?í’ˆ ?¤ëª… */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ?í’ˆ ?¤ëª…
            </label>
            <textarea
              placeholder="?í’ˆ???íƒœ, ?¬ìš© ê¸°ê°„, ê±°ë˜ ë°©ë²• ?±ì„ ?ì„¸???ì–´ì£¼ì„¸??"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ?ˆë‚´ ë¬¸êµ¬ */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              ?’¡ <strong>?ˆë‚´:</strong> ?í’ˆ ?±ë¡ ???¤ë¥¸ ?¬ìš©?ë“¤??ì±„íŒ…?¼ë¡œ ?°ë½?????ˆìŠµ?ˆë‹¤.
            </p>
          </div>

          {/* ?œì¶œ ë²„íŠ¼ */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/market")}
              className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              ì·¨ì†Œ
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
                  ?±ë¡ ì¤?..
                </span>
              ) : (
                "?í’ˆ ?±ë¡?˜ê¸°"
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

