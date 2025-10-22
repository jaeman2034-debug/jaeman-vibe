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
      console.log("?? ?��?지 ?�로???�작:", file.name);
      
      // useUploadImage Hook ?�용
      const downloadURL = await uploadImage(file, "market-images");
      setImageUrl(downloadURL);
      
      console.log("???��?지 ?�로???�료:", downloadURL);
      console.log("?�� Cloud Functions가 ?�동?�로 Firestore??반영?�니??");
    } catch (error) {
      console.error("???��?지 ?�로???�류:", error);
      alert("?��?지 ?�로??�??�류가 발생?�습?�다.");
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
      alert("로그?�이 ?�요?�니??");
      navigate("/login");
      return;
    }

    if (!title || !price || !description) {
      alert("모든 ?�드�??�력?�주?�요.");
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
          region: "?�양??
        },
        status: "open",
        sellerId: user.uid, // ??반드??추�???        createdAt: serverTimestamp(),
      };

      console.log("?�� ?�품 ?�록 ?�도:", {
        sellerUid: user.uid,
        ?�?? typeof user.uid,
        auth_currentUser: auth.currentUser?.uid
      });

      const docRef = await addDoc(collection(db, "marketItems"), productData);
      
      console.log("?�� Firestore ?�???�이??", {
        sellerId: user.uid,
        status: "open",
        productId: docRef.id
      });

      console.log("???�품 ?�록 ?�료!");
      alert("?�품???�록?�었?�니??");
      navigate("/market");
    } catch (error) {
      console.error("?�품 ?�록 ?�류:", error);
      alert("?�품 ?�록 �??�류가 발생?�습?�다.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ?�더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/market")}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              ??마켓?�로 ?�아가�?            </button>
            <h1 className="text-xl font-bold text-gray-800">?�품 ?�록</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-6">???�품 ?�록</h2>
          
          <div className="space-y-4">
            {/* ?�품 ?�목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ?�품 ?�목 *
              </label>
              <input
                type="text"
                placeholder="?�품 ?�목???�력?�세??
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 가�?*/}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                가�?(?? *
              </label>
              <input
                type="number"
                placeholder="가격을 ?�력?�세??
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* ?�품 ?�명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ?�품 ?�명 *
              </label>
              <textarea
                placeholder="?�품???�???�세???�명?�주?�요"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* ?��?지 ?�로??*/}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ?�품 ?��?지
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
                    <p className="text-blue-800 font-medium">?�� ?��?지 ?�로??�?..</p>
                  </div>
                </div>
              )}
              {imageUrl && imageFile && (
                <div className="mt-3">
                  <p className="text-green-600 text-sm font-medium mb-2">???��?지 ?�로???�료</p>
                  {/* ?? ?�시�?AI 분석 결과 ?�시 */}
                  <MarketItemAIAnalysis 
                    filename={imageFile.name}
                    imageUrl={imageUrl}
                  />
                </div>
              )}
            </div>

            {/* ?�치 ?�보 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                거래 ?�치
              </label>
              <div className="text-sm text-gray-600">
                <p>?�도: {coords.lat}</p>
                <p>경도: {coords.lng}</p>
                <p>지?? ?�양??/p>
              </div>
            </div>

            {/* ?�록 버튼 */}
            <div className="pt-4">
              <button
                onClick={handleAddProduct}
                disabled={uploading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
              >
                {uploading ? "?�로??�?.." : "?�� ?�품 ?�록?�기"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
