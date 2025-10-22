// === ?„ì „ ?ìœ¨??AI ?Œì„± + ?´ë?ì§€ ?±ë¡ ?œìŠ¤??===
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

  // ?“ ?„ì¹˜ ?ë™ ?˜ì§‘
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ 
            lat: pos.coords.latitude, 
            lng: pos.coords.longitude 
          });
          console.log("?“ ?„ì¹˜ ?•ë³´ ?˜ì§‘ ?„ë£Œ:", pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn("?„ì¹˜ ?•ë³´ ?˜ì§‘ ?¤íŒ¨:", err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    }
  }, []);

  // ?™ï¸??Œì„± ?¸ì‹ ì´ˆê¸°??  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("??ë¸Œë¼?°ì????Œì„± ?¸ì‹??ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      console.log("?¤ ?Œì„± ?¸ì‹ ?œì‘");
    };

    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setVoiceText(text);
      console.log("?¤ ?¸ì‹???Œì„±:", text);
    };

    recognition.onerror = (e: any) => {
      console.error("STT ?¤ë¥˜:", e);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log("?¤ ?Œì„± ?¸ì‹ ì¢…ë£Œ");
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  // ?§  AI ë¶„ì„ (?Œì„± + ?´ë?ì§€)
  const generateAIData = async (imageUrl: string | null) => {
    setAiAnalyzing(true);
    try {
      const proxyUrl = import.meta.env.VITE_OPENAI_PROXY_URL;
      
      if (!proxyUrl || proxyUrl.includes('your-n8n-server.com')) {
        // n8n ?¹í›…???¤ì •?˜ì? ?Šì? ê²½ìš° ì§ì ‘ OpenAI API ?¸ì¶œ
        console.log("n8n ?¹í›…???¤ì •?˜ì? ?ŠìŒ, ì§ì ‘ OpenAI API ?¸ì¶œ");
        await generateAIDataDirect(imageUrl);
        return;
      }

      // n8n ?¹í›… ?¸ì¶œ (?Œì„± + ?´ë?ì§€ ?µí•© ë¶„ì„)
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
        throw new Error(`n8n ?¹í›… ?¤ë¥˜: ${response.status}`);
      }

      const data = await response.json();
      const aiDescription = data?.description?.trim();
      const aiTags = data?.tags || [];
      const aiCategory = data?.category || '';
      
      if (aiDescription) {
        setDesc(aiDescription);
        setTags(aiTags);
        if (aiCategory) setCategory(aiCategory);
        
        // AIê°€ ?œì•ˆ???í’ˆëª…ì´ ?ˆë‹¤ë©??œëª©???ë™ ?…ë ¥
        const lines = aiDescription.split('\n');
        const firstLine = lines[0];
        if (firstLine && firstLine.length < 50) {
          setTitle(firstLine);
        }
        
        console.log("?ª„ AI ?ì„± ?´ì‹œ?œê·¸:", aiTags);
        console.log("?·ï¸?AI ë¶„ë¥˜ ì¹´í…Œê³ ë¦¬:", aiCategory);
        console.log("?™ï¸??Œì„± ?ìŠ¤??ë°˜ì˜:", voiceText);
      } else {
        setDesc("AI ë¶„ì„ ?¤íŒ¨ ???˜ë™?¼ë¡œ ?…ë ¥?´ì£¼?¸ìš”.");
      }

    } catch (error) {
      console.error("n8n ?¹í›… ?¤ë¥˜:", error);
      // ?¹í›… ?¤íŒ¨ ??ì§ì ‘ OpenAI API ?¸ì¶œë¡??´ë°±
      console.log("?¹í›… ?¤íŒ¨, ì§ì ‘ OpenAI API ?¸ì¶œë¡??´ë°±");
      await generateAIDataDirect(imageUrl);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // ??ì§ì ‘ OpenAI API ?¸ì¶œ (?´ë°±)
  const generateAIDataDirect = async (imageUrl: string | null) => {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OpenAI API ?¤ê? ?¤ì •?˜ì? ?Šì•˜?µë‹ˆ??");
      }

      // ?Œì„± ?ìŠ¤?¸ì? ?´ë?ì§€ë¥?ê²°í•©?˜ì—¬ ë¶„ì„
      const prompt = voiceText 
        ? `?Œì„±?¼ë¡œ ?…ë ¥???í’ˆ ?¤ëª…: "${voiceText}"\n???´ë?ì§€?€ ?Œì„± ?¤ëª…??ë°”íƒ•?¼ë¡œ ?í’ˆ??ë¶„ì„?´ì£¼?¸ìš”.`
        : "???í’ˆ??ë¸Œëœ?? ?íƒœ, ?©ë„, ?¹ì§•???ì—°?¤ëŸ½ê²??¤ëª…?´ì¤˜. ?¨ì–´??30~60???•ë„, ì¹œê·¼?˜ê³  ?ë§¤???´ì¡°ë¡?";

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
        throw new Error(`OpenAI API ?¤ë¥˜: ${response.status}`);
      }

      const data = await response.json();
      const aiDescription = data.choices[0]?.message?.content?.trim();
      
      if (aiDescription) {
        setDesc(aiDescription);
        
        // AIê°€ ?œì•ˆ???í’ˆëª…ì´ ?ˆë‹¤ë©??œëª©???ë™ ?…ë ¥
        const lines = aiDescription.split('\n');
        const firstLine = lines[0];
        if (firstLine && firstLine.length < 50) {
          setTitle(firstLine);
        }
        
        // ì§ì ‘ API ?¸ì¶œ?ì„œ???´ì‹œ?œê·¸?€ ì¹´í…Œê³ ë¦¬ ?ì„± ????(?´ë°± ëª¨ë“œ)
        console.log("?“ ì§ì ‘ API ?¸ì¶œ ëª¨ë“œ - ?´ì‹œ?œê·¸?€ ì¹´í…Œê³ ë¦¬???ì„±?˜ì? ?ŠìŠµ?ˆë‹¤");
      } else {
        setDesc("AI ë¶„ì„ ?¤íŒ¨ ???˜ë™?¼ë¡œ ?…ë ¥?´ì£¼?¸ìš”.");
      }

    } catch (error) {
      console.error("OpenAI API ì§ì ‘ ?¸ì¶œ ?¤ë¥˜:", error);
      setDesc("AI ?¤ëª… ?ì„± ì¤??¤ë¥˜ ë°œìƒ. ì§ì ‘ ?…ë ¥?´ì£¼?¸ìš”.");
    }
  };

  // ?“¸ ?´ë?ì§€ ? íƒ ??AI ?ë™ ë¶„ì„
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    
    // ?Œì„± ?ìŠ¤?¸ê? ?ˆìœ¼ë©??¨ê»˜ ë¶„ì„, ?†ìœ¼ë©??´ë?ì§€ë§?ë¶„ì„
    await generateAIData(url);
  };

  // ?”¥ Firestore ?€??  const handleSubmit = async () => {
    if (!imageFile) return alert("?´ë?ì§€ë¥??…ë¡œ?œí•´ì£¼ì„¸??");
    if (!desc) return alert("AI ë¶„ì„???„ë£Œ???Œê¹Œì§€ ê¸°ë‹¤?¤ì£¼?¸ìš”.");
    if (!price) return alert("ê°€ê²©ì„ ?…ë ¥?´ì£¼?¸ìš”!");

    setLoading(true);
    try {
      // 1ï¸âƒ£ ?´ë?ì§€ ?…ë¡œ??      const imgRef = ref(storage, `market/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imgRef, imageFile);
      const imageUrl = await getDownloadURL(imgRef);

      // 2ï¸âƒ£ Firestore ?±ë¡
      await addDoc(collection(db, "market_items"), {
        title: title || "AI ?ì„± ?í’ˆ",
        price: Number(price),
        category: category || "ê¸°í?",
        description: desc,
        tags: tags,
        imageUrl,
        imageUrls: [imageUrl],
        voiceText: voiceText, // ?Œì„± ?ìŠ¤?¸ë„ ?€??        sellerId: "ai-voice-user",
        location: coords ? {
          latitude: coords.lat,
          longitude: coords.lng
        } : null,
        createdAt: serverTimestamp(),
        status: "active",
        aiGenerated: true,
        aiProcessedAt: serverTimestamp(),
        voiceEnabled: true, // ?Œì„± ?±ë¡ ?œì‹œ
      });

      alert("??AIê°€ ?Œì„±ê³??´ë?ì§€ë¥?ë¶„ì„?˜ì—¬ ?í’ˆ???±ë¡?ˆìŠµ?ˆë‹¤!");
      navigate("/market");
      
    } catch (err) {
      console.error(err);
      alert("?±ë¡ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">?™ï¸?AI ?Œì„± + ?´ë?ì§€ ?±ë¡</h1>
      
      {/* ?„ì¹˜ ?•ë³´ ?œì‹œ */}
      {coords && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800 text-sm">
            ?“ ?„ì¹˜ ?•ë³´ê°€ ?ë™?¼ë¡œ ?˜ì§‘?˜ì—ˆ?µë‹ˆ?? {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </p>
        </div>
      )}
      
      <p className="text-gray-600 mb-4">
        ?Œì„±?¼ë¡œ ?í’ˆ???¤ëª…?˜ê³  ?´ë?ì§€ë¥??…ë¡œ?œí•˜ë©?AIê°€ ?ë™?¼ë¡œ ë¶„ì„?©ë‹ˆ??
      </p>

      <div className="space-y-4">
        {/* ?Œì„± ?…ë ¥ */}
        <div>
          <label className="block text-sm font-medium mb-1">?™ï¸??Œì„± ?¤ëª…</label>
          <button
            onClick={startListening}
            disabled={isListening}
            className={`w-full p-3 rounded-lg font-semibold ${
              isListening 
                ? "bg-red-500 text-white cursor-not-allowed" 
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            {isListening ? "?¤ ?£ëŠ” ì¤?.." : "?§ ?Œì„± ?¤ëª… ?œì‘"}
          </button>
          
          {voiceText && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-600 mb-1">?¤ ?¸ì‹???´ìš©:</p>
              <p className="font-medium">{voiceText}</p>
            </div>
          )}
        </div>

        {/* ?í’ˆëª?*/}
        <div>
          <label className="block text-sm font-medium mb-1">?í’ˆëª?/label>
          <input
            type="text"
            placeholder="?? ?˜ì´???ì–´ë§¥ìŠ¤ 270"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        {/* ê°€ê²?*/}
        <div>
          <label className="block text-sm font-medium mb-1">ê°€ê²???</label>
          <input
            type="number"
            placeholder="?? 45000"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        {/* ?¤ëª… */}
        <div>
          <label className="block text-sm font-medium mb-1">
            ?í’ˆ ?¤ëª… {aiAnalyzing && <span className="text-blue-500">(AI ë¶„ì„ ì¤?..)</span>}
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={4}
            className="w-full border p-2 rounded-lg"
            placeholder="AIê°€ ?Œì„±ê³??´ë?ì§€ë¥?ë¶„ì„?˜ì—¬ ?ë™?¼ë¡œ ?¤ëª…???ì„±?©ë‹ˆ??"
          />
        </div>

        {/* ì¹´í…Œê³ ë¦¬ */}
        {category && (
          <div>
            <label className="block text-sm font-medium mb-1">?·ï¸?ì¹´í…Œê³ ë¦¬</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border p-2 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              ?·ï¸?AIê°€ ?ë™?¼ë¡œ ë¶„ë¥˜??ì¹´í…Œê³ ë¦¬?…ë‹ˆ?? ?„ìš”???˜ì •?˜ì„¸??
            </p>
          </div>
        )}

        {/* ?´ì‹œ?œê·¸ */}
        {tags.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">?ª„ AI ?ì„± ?´ì‹œ?œê·¸</label>
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
              AIê°€ ?Œì„±ê³??´ë?ì§€ë¥?ë¶„ì„?˜ì—¬ ?ë™?¼ë¡œ ?ì„±???´ì‹œ?œê·¸?…ë‹ˆ??
            </p>
          </div>
        )}

        {/* ?´ë?ì§€ ?…ë¡œ??*/}
        <div>
          <label className="block text-sm font-medium mb-1">?“¸ ?´ë?ì§€ ?…ë¡œ??/label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageSelect}
            className="w-full border p-2 rounded-lg"
          />
          
          {/* ?´ë?ì§€ ë¯¸ë¦¬ë³´ê¸° */}
          {imagePreview && (
            <div className="mt-3">
              <img 
                src={imagePreview} 
                alt="?í’ˆ ë¯¸ë¦¬ë³´ê¸°" 
                className="w-full max-w-xs h-48 object-cover rounded-lg border"
              />
            </div>
          )}
        </div>

        {/* ?±ë¡ ë²„íŠ¼ */}
        <button
          onClick={handleSubmit}
          disabled={loading || !imageFile || !desc || !price}
          className={`w-full rounded-xl p-3 font-semibold ${
            loading || !imageFile || !desc || !price
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90"
          }`}
        >
          {loading ? "?±ë¡ ì¤?.." : "?™ï¸?AI?€ ?¨ê»˜ ?Œì„± ?±ë¡?˜ê¸°"}
        </button>
      </div>
    </div>
  );
}
