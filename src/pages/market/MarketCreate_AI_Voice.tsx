// === ?�전 ?�율??AI ?�성 + ?��?지 ?�록 ?�스??===
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const OPENAI_API_URL = import.meta.env.VITE_OPENAI_PROXY_URL;

export default function MarketCreate_AI_Voice() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [voiceText, setVoiceText] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const recognitionRef = useRef<any>(null);

  // ?�� ?�치 ?�동 ?�집
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

  // ?���??�성 ?�식 초기??  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("??브라?��????�성 ?�식??지?�하지 ?�습?�다.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      console.log("?�� ?�성 ?�식 ?�작");
    };

    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setVoiceText(text);
      console.log("?�� ?�식???�성:", text);
    };

    recognition.onerror = (e: any) => {
      console.error("STT ?�류:", e);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log("?�� ?�성 ?�식 종료");
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  // ?�� AI 분석 (?�성 + ?��?지)
  const generateAIData = async (imageUrl: string | null) => {
    setAiAnalyzing(true);
    try {
      const proxyUrl = import.meta.env.VITE_OPENAI_PROXY_URL;
      
      if (!proxyUrl || proxyUrl.includes('your-n8n-server.com')) {
        // n8n ?�훅???�정?��? ?��? 경우 직접 OpenAI API ?�출
        console.log("n8n ?�훅???�정?��? ?�음, 직접 OpenAI API ?�출");
        await generateAIDataDirect(imageUrl);
        return;
      }

      // n8n ?�훅 ?�출 (?�성 + ?��?지 ?�합 분석)
      const response = await fetch(proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageUrl,
          voiceText: voiceText,
          mode: "describe-tags-category-voice"
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
        console.log("?���??�성 ?�스??반영:", voiceText);
      } else {
        setDesc("AI 분석 ?�패 ???�동?�로 ?�력?�주?�요.");
      }

    } catch (error) {
      console.error("n8n ?�훅 ?�류:", error);
      // ?�훅 ?�패 ??직접 OpenAI API ?�출�??�백
      console.log("?�훅 ?�패, 직접 OpenAI API ?�출�??�백");
      await generateAIDataDirect(imageUrl);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // ??직접 OpenAI API ?�출 (?�백)
  const generateAIDataDirect = async (imageUrl: string | null) => {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OpenAI API ?��? ?�정?��? ?�았?�니??");
      }

      // ?�성 ?�스?��? ?��?지�?결합?�여 분석
      const prompt = voiceText 
        ? `?�성?�로 ?�력???�품 ?�명: "${voiceText}"\n???��?지?� ?�성 ?�명??바탕?�로 ?�품??분석?�주?�요.`
        : "???�품??브랜?? ?�태, ?�도, ?�징???�연?�럽�??�명?�줘. ?�어??30~60???�도, 친근?�고 ?�매???�조�?";

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
                  text: prompt
                },
                ...(imageUrl ? [{
                  type: "image_url",
                  image_url: { url: imageUrl }
                }] : [])
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

  // ?�� ?��?지 ?�택 ??AI ?�동 분석
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    
    // ?�성 ?�스?��? ?�으�??�께 분석, ?�으�??��?지�?분석
    await generateAIData(url);
  };

  // ?�� Firestore ?�??  const handleSubmit = async () => {
    if (!imageFile) return alert("?��?지�??�로?�해주세??");
    if (!desc) return alert("AI 분석???�료???�까지 기다?�주?�요.");
    if (!price) return alert("가격을 ?�력?�주?�요!");

    setLoading(true);
    try {
      // 1️⃣ ?��?지 ?�로??      const imgRef = ref(storage, `market/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imgRef, imageFile);
      const imageUrl = await getDownloadURL(imgRef);

      // 2️⃣ Firestore ?�록
      await addDoc(collection(db, "market_items"), {
        title: title || "AI ?�성 ?�품",
        price: Number(price),
        category: category || "기�?",
        description: desc,
        tags: tags,
        imageUrl,
        imageUrls: [imageUrl],
        voiceText: voiceText, // ?�성 ?�스?�도 ?�??        sellerId: "ai-voice-user",
        location: coords ? {
          latitude: coords.lat,
          longitude: coords.lng
        } : null,
        createdAt: serverTimestamp(),
        status: "active",
        aiGenerated: true,
        aiProcessedAt: serverTimestamp(),
        voiceEnabled: true, // ?�성 ?�록 ?�시
      });

      alert("??AI가 ?�성�??��?지�?분석?�여 ?�품???�록?�습?�다!");
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
      <h1 className="text-2xl font-bold mb-2">?���?AI ?�성 + ?��?지 ?�록</h1>
      
      {/* ?�치 ?�보 ?�시 */}
      {coords && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800 text-sm">
            ?�� ?�치 ?�보가 ?�동?�로 ?�집?�었?�니?? {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </p>
        </div>
      )}
      
      <p className="text-gray-600 mb-4">
        ?�성?�로 ?�품???�명?�고 ?��?지�??�로?�하�?AI가 ?�동?�로 분석?�니??
      </p>

      <div className="space-y-4">
        {/* ?�성 ?�력 */}
        <div>
          <label className="block text-sm font-medium mb-1">?���??�성 ?�명</label>
          <button
            onClick={startListening}
            disabled={isListening}
            className={`w-full p-3 rounded-lg font-semibold ${
              isListening 
                ? "bg-red-500 text-white cursor-not-allowed" 
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            {isListening ? "?�� ?�는 �?.." : "?�� ?�성 ?�명 ?�작"}
          </button>
          
          {voiceText && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-600 mb-1">?�� ?�식???�용:</p>
              <p className="font-medium">{voiceText}</p>
            </div>
          )}
        </div>

        {/* ?�품�?*/}
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

        {/* 가�?*/}
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
            placeholder="AI가 ?�성�??��?지�?분석?�여 ?�동?�로 ?�명???�성?�니??"
          />
        </div>

        {/* 카테고리 */}
        {category && (
          <div>
            <label className="block text-sm font-medium mb-1">?���?카테고리</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border p-2 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              ?���?AI가 ?�동?�로 분류??카테고리?�니?? ?�요???�정?�세??
            </p>
          </div>
        )}

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
              AI가 ?�성�??��?지�?분석?�여 ?�동?�로 ?�성???�시?�그?�니??
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
          disabled={loading || !imageFile || !desc || !price}
          className={`w-full rounded-xl p-3 font-semibold ${
            loading || !imageFile || !desc || !price
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90"
          }`}
        >
          {loading ? "?�록 �?.." : "?���?AI?� ?�께 ?�성 ?�록?�기"}
        </button>
      </div>
    </div>
  );
}
