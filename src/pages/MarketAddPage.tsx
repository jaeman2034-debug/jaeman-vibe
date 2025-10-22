import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { useUploadImage } from "../hooks/useUploadImage";
import MarketItemAIAnalysis from "../components/MarketItemAIAnalysis";

export default function MarketAddPage() {
  const navigate = useNavigate();
  const { uploadImage } = useUploadImage();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [coords, setCoords] = useState({ lat: 37.75, lng: 127.1 });

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      console.log("?? ?´ë?ì§€ ?…ë¡œ???œì‘:", file.name);
      
      // useUploadImage Hook ?¬ìš©
      const downloadURL = await uploadImage(file, "market-images");
      setImageUrl(downloadURL);
      
      console.log("???´ë?ì§€ ?…ë¡œ???„ë£Œ:", downloadURL);
      console.log("?”” Cloud Functionsê°€ ?ë™?¼ë¡œ Firestore??ë°˜ì˜?©ë‹ˆ??");
    } catch (error) {
      console.error("???´ë?ì§€ ?…ë¡œ???¤ë¥˜:", error);
      alert("?´ë?ì§€ ?…ë¡œ??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      handleImageUpload(file);
    }
  };

  const handleAddProduct = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??");
      navigate("/login");
      return;
    }

    if (!title || !price || !description) {
      alert("ëª¨ë“  ?„ë“œë¥??…ë ¥?´ì£¼?¸ìš”.");
      return;
    }

    try {
      const productData = {
        title,
        price: Number(price),
        description,
        imageUrl,
        coords,
        location: {
          lat: coords.lat,
          lng: coords.lng,
          region: "?™ì–‘??
        },
        status: "open",
        sellerId: user.uid, // ??ë°˜ë“œ??ì¶”ê???        createdAt: serverTimestamp(),
      };

      console.log("?” ?í’ˆ ?±ë¡ ?œë„:", {
        sellerUid: user.uid,
        ?€?? typeof user.uid,
        auth_currentUser: auth.currentUser?.uid
      });

      const docRef = await addDoc(collection(db, "marketItems"), productData);
      
      console.log("?’¾ Firestore ?€???°ì´??", {
        sellerId: user.uid,
        status: "open",
        productId: docRef.id
      });

      console.log("???í’ˆ ?±ë¡ ?„ë£Œ!");
      alert("?í’ˆ???±ë¡?˜ì—ˆ?µë‹ˆ??");
      navigate("/market");
    } catch (error) {
      console.error("?í’ˆ ?±ë¡ ?¤ë¥˜:", error);
      alert("?í’ˆ ?±ë¡ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    }
  };

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
            <h1 className="text-xl font-bold text-gray-800">?í’ˆ ?±ë¡</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-6">???í’ˆ ?±ë¡</h2>
          
          <div className="space-y-4">
            {/* ?í’ˆ ?œëª© */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ?í’ˆ ?œëª© *
              </label>
              <input
                type="text"
                placeholder="?í’ˆ ?œëª©???…ë ¥?˜ì„¸??
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* ê°€ê²?*/}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ê°€ê²?(?? *
              </label>
              <input
                type="number"
                placeholder="ê°€ê²©ì„ ?…ë ¥?˜ì„¸??
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* ?í’ˆ ?¤ëª… */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ?í’ˆ ?¤ëª… *
              </label>
              <textarea
                placeholder="?í’ˆ???€???ì„¸???¤ëª…?´ì£¼?¸ìš”"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* ?´ë?ì§€ ?…ë¡œ??*/}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ?í’ˆ ?´ë?ì§€
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {uploading && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-blue-800 font-medium">?“¤ ?´ë?ì§€ ?…ë¡œ??ì¤?..</p>
                  </div>
                </div>
              )}
              {imageUrl && imageFile && (
                <div className="mt-3">
                  <p className="text-green-600 text-sm font-medium mb-2">???´ë?ì§€ ?…ë¡œ???„ë£Œ</p>
                  {/* ?? ?¤ì‹œê°?AI ë¶„ì„ ê²°ê³¼ ?œì‹œ */}
                  <MarketItemAIAnalysis 
                    filename={imageFile.name}
                    imageUrl={imageUrl}
                  />
                </div>
              )}
            </div>

            {/* ?„ì¹˜ ?•ë³´ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ê±°ë˜ ?„ì¹˜
              </label>
              <div className="text-sm text-gray-600">
                <p>?„ë„: {coords.lat}</p>
                <p>ê²½ë„: {coords.lng}</p>
                <p>ì§€?? ?™ì–‘??/p>
              </div>
            </div>

            {/* ?±ë¡ ë²„íŠ¼ */}
            <div className="pt-4">
              <button
                onClick={handleAddProduct}
                disabled={uploading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
              >
                {uploading ? "?…ë¡œ??ì¤?.." : "?“¦ ?í’ˆ ?±ë¡?˜ê¸°"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
