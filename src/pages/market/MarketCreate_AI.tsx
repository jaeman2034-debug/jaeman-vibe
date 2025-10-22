// === ?�전 ?�율?�된 AI ?�품 ?�록 ?�이?�라??===
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function MarketCreate_AI() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [desc, setDesc] = useState("AI가 ?��?지�?분석?�여 ?�동?�로 ?�명???�성?�니?? ?�요???�정?�세??");
  const [tags, setTags] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // ???�치 ?�동 ?�집
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ 
            lat: pos.coords.latitude, 
            lng: pos.coords.longitude 
          });
          console.log("?�� ?�치 ?�보 ?�집 ?�료:", pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn("?�치 ?�보 ?�집 ?�패:", err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    }
  }, []);

  // ??AI ?��?지 ?�명 ?�성 (n8n ?�훅 ?�합)
  const generateAIDescription = async (imageUrl: string) => {
    setAiAnalyzing(true);
    try {
      const proxyUrl = import.meta.env.VITE_OPENAI_PROXY_URL;
      
      if (!proxyUrl || proxyUrl.includes('your-n8n-server.com')) {
        // n8n ?�훅???�정?��? ?��? 경우 직접 OpenAI API ?�출
        console.log("n8n ?�훅???�정?��? ?�음, 직접 OpenAI API ?�출");
        await generateAIDescriptionDirect(imageUrl);
        return;
      }

      // n8n ?�훅 ?�출
      const response = await fetch(proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageUrl,
          prompt: "???�품??브랜?? ?�태, ?�도, ?�징???�연?�럽�??�명?�줘. ?�어??30~60???�도, 친근?�고 ?�매???�조�?",
        }),
      });

      if (!response.ok) {
        throw new Error(`n8n ?�훅 ?�류: ${response.status}`);
      }

      const data = await response.json();
      const aiDescription = data?.description?.trim();
      const aiTags = data?.tags || [];
      const aiCategory = data?.category || '';
      
      if (aiDescription) {
        setDesc(aiDescription);
        setTags(aiTags);
        if (aiCategory) setCategory(aiCategory);
        
        // AI가 ?�안???�품명이 ?�다�??�목???�동 ?�력
        const lines = aiDescription.split('\n');
        const firstLine = lines[0];
        if (firstLine && firstLine.length < 50) {
          setTitle(firstLine);
        }
        
        console.log("?�� AI ?�성 ?�시?�그:", aiTags);
        console.log("?���?AI 분류 카테고리:", aiCategory);
      } else {
        setDesc("AI 분석 ?�패 ???�동?�로 ?�력?�주?�요.");
      }

    } catch (error) {
      console.error("n8n ?�훅 ?�류:", error);
      // ?�훅 ?�패 ??직접 OpenAI API ?�출�??�백
      console.log("?�훅 ?�패, 직접 OpenAI API ?�출�??�백");
      await generateAIDescriptionDirect(imageUrl);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // ??직접 OpenAI API ?�출 (?�백)
  const generateAIDescriptionDirect = async (imageUrl: string) => {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OpenAI API ?��? ?�정?��? ?�았?�니??");
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { 
                  type: "text", 
                  text: "???�품??브랜?? ?�태, ?�도, ?�징???�연?�럽�??�명?�줘. ?�어??30~60???�도, 친근?�고 ?�매???�조�?" 
                },
                { 
                  type: "image_url", 
                  image_url: { url: imageUrl } 
                },
              ],
            },
          ],
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API ?�류: ${response.status}`);
      }

      const data = await response.json();
      const aiDescription = data.choices[0]?.message?.content?.trim();
      
      if (aiDescription) {
        setDesc(aiDescription);
        
        // AI가 ?�안???�품명이 ?�다�??�목???�동 ?�력
        const lines = aiDescription.split('\n');
        const firstLine = lines[0];
        if (firstLine && firstLine.length < 50) {
          setTitle(firstLine);
        }
        
        // 직접 API ?�출?�서???�시?�그?� 카테고리 ?�성 ????(?�백 모드)
        console.log("?�� 직접 API ?�출 모드 - ?�시?�그?� 카테고리???�성?��? ?�습?�다");
      } else {
        setDesc("AI 분석 ?�패 ???�동?�로 ?�력?�주?�요.");
      }

    } catch (error) {
      console.error("OpenAI API 직접 ?�출 ?�류:", error);
      setDesc("AI ?�명 ?�성 �??�류 발생. 직접 ?�력?�주?�요.");
    }
  };

  // ???��?지 ?�택 ???�동 AI 분석
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    
    // AI 분석 ?�작
    await generateAIDescription(url);
  };

  // ???�록 처리
  const handleSubmit = async () => {
    if (!imageFile) return alert("?��?지�??�로?�해주세??");
    if (!title || !price || !category) return alert("?�수 ?�보�??�력?�주?�요!");

    setLoading(true);
    try {
      // 1️⃣ ?��?지 ?�로??      const imgRef = ref(storage, `market/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imgRef, imageFile);
      const imageUrl = await getDownloadURL(imgRef);

      // 2️⃣ Firestore ?�록
      await addDoc(collection(db, "market_items"), {
        title,
        price: Number(price),
        category,
        description: desc,
        tags: tags, // ?�� AI ?�성 ?�시?�그 추�?
        imageUrl,
        imageUrls: [imageUrl], // 배열 ?�태로도 ?�??        sellerId: "ai-user", // AI ?�록 ?�용??        location: coords ? {
          latitude: coords.lat,
          longitude: coords.lng
        } : null,
        createdAt: serverTimestamp(),
        status: "active",
        aiGenerated: true,
        aiProcessedAt: serverTimestamp(),
      });

      alert("??AI가 ?�품???�공?�으�??�록?�습?�다!");
      navigate("/market");
      
    } catch (err) {
      console.error(err);
      alert("?�록 �??�류가 발생?�습?�다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">?�� AI ?�동 ?�품 ?�록</h1>
      
      {/* ?�치 ?�보 ?�시 */}
      {coords && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800 text-sm">
            ?�� ?�치 ?�보가 ?�동?�로 ?�집?�었?�니?? {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </p>
        </div>
      )}
      
      <p className="text-gray-600 mb-4">
        ?��?지�??�로?�하�?AI가 ?�동?�로 ?�품 ?�명???�성?�니??
      </p>

      <div className="space-y-4">
        {/* ?�목 */}
        <div>
          <label className="block text-sm font-medium mb-1">?�품�?/label>
          <input
            type="text"
            placeholder="?? ?�이???�어맥스 270"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        {/* 가격과 카테고리 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">가�???</label>
            <input
              type="number"
              placeholder="?? 45000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border p-2 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              카테고리 {aiAnalyzing && <span className="text-blue-500">(AI 분류 �?..)</span>}
            </label>
            <input
              type="text"
              placeholder="?? 축구??
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border p-2 rounded-lg"
            />
            {category && (
              <p className="text-xs text-gray-500 mt-1">
                ?���?AI가 ?�동?�로 분류??카테고리?�니?? ?�요???�정?�세??
              </p>
            )}
          </div>
        </div>

        {/* ?�명 */}
        <div>
          <label className="block text-sm font-medium mb-1">
            ?�품 ?�명 {aiAnalyzing && <span className="text-blue-500">(AI 분석 �?..)</span>}
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={4}
            className="w-full border p-2 rounded-lg"
            placeholder="AI가 ?��?지�?분석?�여 ?�동?�로 ?�명???�성?�니??"
          />
        </div>

        {/* ?�시?�그 */}
        {tags.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">?�� AI ?�성 ?�시?�그</label>
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border">
              {tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              AI가 ?�품??분석?�여 ?�동?�로 ?�성???�시?�그?�니??
            </p>
          </div>
        )}

        {/* ?��?지 ?�로??*/}
        <div>
          <label className="block text-sm font-medium mb-1">?�� ?��?지 ?�로??/label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageSelect}
            className="w-full border p-2 rounded-lg"
          />
          
          {/* ?��?지 미리보기 */}
          {imagePreview && (
            <div className="mt-3">
              <img 
                src={imagePreview} 
                alt="?�품 미리보기" 
                className="w-full max-w-xs h-48 object-cover rounded-lg border"
              />
            </div>
          )}
        </div>

        {/* ?�록 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={loading || !imageFile || !title || !price || !category}
          className={`w-full rounded-xl p-3 font-semibold ${
            loading || !imageFile || !title || !price || !category
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
          }`}
        >
          {loading ? "?�록 �?.." : "?�� AI?� ?�께 ?�품 ?�록?�기"}
        </button>
      </div>
    </div>
  );
}
