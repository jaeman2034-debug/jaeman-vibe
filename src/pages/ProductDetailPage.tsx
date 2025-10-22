// ??/src/pages/ProductDetailPage.tsx (Emotion-Adaptive TTS ?�성??
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Loader2, Volume2, Play, Pause, RotateCcw, Settings, RefreshCw, Clock, Heart, Zap, Moon, Briefcase, Smile } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState<string>("alloy");
  const [selectedTone, setSelectedTone] = useState<string>("neutral");
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<{
    aiSummary: boolean;
    audioUrl: boolean;
    lastGenerated?: Date;
  }>({ aiSummary: false, audioUrl: false });

  // ?�� ?�성 ?�션 (6가지 OpenAI TTS ?�성)
  const voiceOptions = [
    { value: "alloy", label: "?�� Alloy (기본)", description: "?�연?�러??중성 ?�성", icon: "?��" },
    { value: "echo", label: "?�� Echo", description: "?�뜻???�성 ?�성", icon: "?��" },
    { value: "fable", label: "?�� Fable", description: "?�아???�성 ?�성", icon: "?��" },
    { value: "onyx", label: "?�� Onyx", description: "깊�? ?�성 ?�성", icon: "?��" },
    { value: "nova", label: "?�� Nova", description: "밝�? ?�성 ?�성", icon: "?��" },
    { value: "shimmer", label: "??Shimmer", description: "부?�러???�성 ?�성", icon: "?? },
  ];

  // ?�� 감정?????�션 (5가지 감정 ?��???
  const toneOptions = [
    { 
      value: "neutral", 
      label: "?�� ?�반??, 
      description: "?�연?�럽�?명확??말투", 
      icon: "?��",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200"
    },
    { 
      value: "energetic", 
      label: "???�기�?, 
      description: "?�기 ?�고 빠른 ?�도", 
      icon: "??,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    },
    { 
      value: "calm", 
      label: "?�� 차분??, 
      description: "?�긋?�고 부?�러????, 
      icon: "?��",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    { 
      value: "professional", 
      label: "?�� ?�문??, 
      description: "?�뢰�??�는 ?�스 ?�커 ??, 
      icon: "?��",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    },
    { 
      value: "cheerful", 
      label: "?�� ?�쾌??, 
      description: "밝고 친근???�야�???, 
      icon: "?��",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
  ];

  // ???�품 로드 (캐시 체크 ?�함)
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) {
          setError("?�못???�근?�니??");
          setLoading(false);
          return;
        }
        
        const docRef = doc(db, "marketItems", id);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          const data = snap.data();
          setProduct({ id: snap.id, ...data });
          
          // ??캐시 ?�태 체크 �?즉시 로드
          const hasAiSummary = !!data.aiSummary;
          const hasAudioUrl = !!data.audioUrl;
          const lastGenerated = data.aiGeneratedAt?.toDate?.();
          
          setCacheStatus({
            aiSummary: hasAiSummary,
            audioUrl: hasAudioUrl,
            lastGenerated: lastGenerated
          });
          
          // 캐시???�이??즉시 로드
          if (hasAiSummary) {
            setAiSummary(data.aiSummary);
            console.log("??AI ?�명 캐시 ?�용:", data.aiSummary.substring(0, 50) + "...");
          }
          
          if (hasAudioUrl) {
            setAudioUrl(data.audioUrl);
            console.log("???�성 ?�일 캐시 ?�용:", data.audioUrl);
          }
          
          if (data.aiVoice) {
            setSelectedVoice(data.aiVoice);
          }
          
          if (data.aiTone) {
            setSelectedTone(data.aiTone);
          }
          
        } else {
          setError("?�품??찾을 ???�습?�다.");
        }
      } catch (err) {
        console.error("?�품 로드 ?�류:", err);
        setError("?�이??로드 �??�류가 발생?�습?�다.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);

  // ?�� AI ?�명 ?�성 (캐싱 체크)
  const generateAiSummary = async () => {
    if (!product) return;
    
    // ???��? ?�약문이 ?�다�?캐시 ?�용
    if (product.aiSummary && cacheStatus.aiSummary) {
      setAiSummary(product.aiSummary);
      console.log("??AI ?�명 캐시 ?�용 - API ?�출 ?�략");
      return;
    }

    setSummarizing(true);
    try {
      console.log("?�� AI ?�명 ?�성 ?�작 (?�로 ?�성):", product.title);
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `?�는 ?�품??매력?�으�??�개?�는 ?�문가?? 
              짧고 ?�득???�는 ?�명???�줘.
              ?�성?�로 ?�기???�합?�게 ?�연?�러??문장?�로 구성?�줘.
              ?�모지�??�절???�용?�서 친근?�게 만들?�줘.`,
            },
            {
              role: "user",
              content: `?�품�? ${product.title || "?�목 ?�음"}
가�? ${product.price ? product.price.toLocaleString() : "가�?미정"}??카테고리: ${product.category || "기�?"}
?�명: ${product.desc || product.description || "?�명 ?�음"}
?�태: ${product.status || "?�매�?}`,
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API ?�류: ${response.status}`);
      }

      const data = await response.json();
      const summary = data?.choices?.[0]?.message?.content || "AI ?�명 ?�성 ?�패";
      
      setAiSummary(summary);
      
      // Firestore??AI ?�명 ?�??(캐시)
      await updateDoc(doc(db, "marketItems", id!), {
        aiSummary: summary,
        aiGeneratedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // 캐시 ?�태 ?�데?�트
      setCacheStatus(prev => ({ ...prev, aiSummary: true }));
      
      console.log("??AI ?�명 ?�성 �?캐시 ?�???�료");
      
    } catch (err) {
      console.error("??AI ?�명 ?�류:", err);
      setAiSummary("AI ?�명 ?�성 �??�류가 발생?�습?�다. ?�시 ???�시 ?�도?�주?�요.");
    } finally {
      setSummarizing(false);
    }
  };

  // ?�� Emotion-Adaptive TTS ?�성 (캐싱 체크)
  const generateTTS = async () => {
    if (!aiSummary) {
      alert("먼�? AI ?�명???�성?�주?�요!");
      return;
    }

    // ???��? 같�? ?�의 mp3가 ?�으�?캐시 ?�용
    const currentToneKey = `${selectedVoice}_${selectedTone}`;
    if (audioUrl && cacheStatus.audioUrl && product.aiTone === selectedTone && product.aiVoice === selectedVoice) {
      console.log("???�성 ?�일 캐시 ?�용 - TTS API ?�출 ?�략");
      
      // 즉시 ?�생
      try {
        const audio = new Audio(audioUrl);
        setAudioElement(audio);
        
        audio.onended = () => setIsPlaying(false);
        audio.onpause = () => setIsPlaying(false);
        audio.onplay = () => setIsPlaying(true);
        
        await audio.play();
        setIsPlaying(true);
        console.log("??캐시???�성 ?�일 즉시 ?�생");
      } catch (err) {
        console.error("?�성 ?�생 ?�류:", err);
        alert("?�성 ?�생 �??�류가 발생?�습?�다.");
      }
      return;
    }

    setSpeaking(true);
    try {
      console.log("?�� Emotion-Adaptive TTS ?�성 ?�성 ?�작:", selectedVoice, selectedTone);
      
      // ?�� 감정?????�정
      const toneConfig: Record<string, string> = {
        neutral: "?�연?�럽�?명확??말투�??�어�? ?�범?�고 ?�정???�도�?말해�?",
        energetic: "?�기차고 ?�기 ?�게, ?�간 빠른 ?�도�??�어�? ?�너지가 ?�치???�으�?말해�?",
        calm: "?�긋?�고 부?�럽�? ?�정??목소리로 ?�어�? 차분?�고 ?�화로운 ?�으�?말해�?",
        professional: "명확?�고 ?�뢰�??�게, ?�스 ?�커처럼 말해�? ?�문?�이�?권위 ?�는 ?�으�?말해�?",
        cheerful: "밝고 ?�쾌?�게, 친근???�으�??�야기하??말해�? 즐겁�??�음???�는 ?�으�?말해�?",
      };

      const toneInstruction = toneConfig[selectedTone] || toneConfig.neutral;
      
      const ttsEndpoint = import.meta.env.VITE_TTS_ENDPOINT || 
        `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/makeTTS`;
      
      const response = await fetch(`${ttsEndpoint}/makeTTS`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          text: `${toneInstruction}\n\n?�음 ?�품 ?�명???�어�?\n\n${aiSummary}`,
          filename: `product_${id}_${selectedVoice}_${selectedTone}.mp3`,
          voice: selectedVoice,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API ?�류: ${response.status}`);
      }

      const data = await response.json();
      
      if (data?.url) {
        setAudioUrl(data.url);
        
        // Firestore???�성 URL ?�??(캐시)
        await updateDoc(doc(db, "marketItems", id!), {
          audioUrl: data.url,
          aiVoice: selectedVoice,
          aiTone: selectedTone,
          ttsGeneratedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // 캐시 ?�태 ?�데?�트
        setCacheStatus(prev => ({ ...prev, audioUrl: true }));
        
        console.log("??Emotion-Adaptive TTS ?�성 ?�성 �?캐시 ?�???�료:", data.url);
        
        // ?�동 ?�생
        try {
          const audio = new Audio(data.url);
          setAudioElement(audio);
          
          audio.onended = () => setIsPlaying(false);
          audio.onpause = () => setIsPlaying(false);
          audio.onplay = () => setIsPlaying(true);
          
          await audio.play();
          setIsPlaying(true);
          console.log("???�로 ?�성??감정???�성 ?�일 ?�동 ?�생");
        } catch (playErr) {
          console.error("?�동 ?�생 ?�류:", playErr);
        }
        
      } else {
        alert("TTS 변???�패: " + (data.error || "?????�는 ?�류"));
      }
    } catch (err) {
      console.error("??Emotion-Adaptive TTS ?�류:", err);
      alert("감정???�성 ?�성 �??�류가 발생?�습?�다. ?�시 ???�시 ?�도?�주?�요.");
    } finally {
      setSpeaking(false);
    }
  };

  // ?�� 캐시 강제 갱신
  const refreshCache = async () => {
    if (!product) return;
    
    const confirmRefresh = window.confirm(
      "캐시�?강제�?갱신?�시겠습?�까?\n" +
      "기존 AI ?�명�??�성 ?�일???�로??것으�?교체?�니??"
    );
    
    if (!confirmRefresh) return;
    
    try {
      // AI ?�명 강제 ?�생??      setSummarizing(true);
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `?�는 ?�품??매력?�으�??�개?�는 ?�문가?? 
              ?�전�??�른 ?�로??관?�으�??�명?�줘.
              짧고 ?�득???�는 ?�명???�줘.`,
            },
            {
              role: "user",
              content: `?�품�? ${product.title || "?�목 ?�음"}
가�? ${product.price ? product.price.toLocaleString() : "가�?미정"}??카테고리: ${product.category || "기�?"}
?�명: ${product.desc || product.description || "?�명 ?�음"}
?�태: ${product.status || "?�매�?}`,
            },
          ],
          max_tokens: 300,
          temperature: 0.8, // ??창의?�으�?        }),
      });

      const data = await response.json();
      const newSummary = data?.choices?.[0]?.message?.content || "AI ?�명 ?�성 ?�패";
      
      setAiSummary(newSummary);
      
      // Firestore ?�데?�트
      await updateDoc(doc(db, "marketItems", id!), {
        aiSummary: newSummary,
        aiGeneratedAt: serverTimestamp(),
        audioUrl: "", // ?�성 ?�일 초기??        ttsGeneratedAt: null,
        updatedAt: serverTimestamp()
      });
      
      // 캐시 ?�태 ?�데?�트
      setCacheStatus({
        aiSummary: true,
        audioUrl: false, // ?�성 ?�일?� ?�로 ?�성 ?�요
        lastGenerated: new Date()
      });
      
      setAudioUrl(""); // ?�성 URL 초기??      setAudioElement(null);
      setIsPlaying(false);
      
      console.log("??캐시 강제 갱신 ?�료");
      alert("AI ?�명???�로 ?�성?�었?�니?? 감정???�성???�로 ?�성?�시겠습?�까?");
      
    } catch (err) {
      console.error("??캐시 갱신 ?�류:", err);
      alert("캐시 갱신 �??�류가 발생?�습?�다.");
    } finally {
      setSummarizing(false);
    }
  };

  // ?�� ?�디???�생 ?�어
  const toggleAudio = async () => {
    if (!audioUrl) return;
    
    try {
      if (!audioElement) {
        const audio = new Audio(audioUrl);
        setAudioElement(audio);
        
        audio.onended = () => setIsPlaying(false);
        audio.onpause = () => setIsPlaying(false);
        audio.onplay = () => setIsPlaying(true);
        
        await audio.play();
        setIsPlaying(true);
      } else {
        if (isPlaying) {
          audioElement.pause();
          setIsPlaying(false);
        } else {
          await audioElement.play();
          setIsPlaying(true);
        }
      }
    } catch (err) {
      console.error("?�디???�생 ?�류:", err);
      alert("?�디???�생 �??�류가 발생?�습?�다.");
    }
  };

  // ?�� ?�성 ?�생 ?��?
  const stopAudio = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsPlaying(false);
    }
  };

  // 캐시 만료 체크 (7??
  const isCacheExpired = () => {
    if (!cacheStatus.lastGenerated) return false;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return cacheStatus.lastGenerated < sevenDaysAgo;
  };

  // 로딩 ?�태
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">?�품 ?�보�?불러?�는 �?..</p>
        </div>
      </div>
    );
  }

  // ?�러 ?�태
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">?�️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">?�류 발생</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => navigate("/market")} className="mr-2">
            ??마켓?�로 ?�아가�?          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            ?�� ?�로고침
          </Button>
        </div>
      </div>
    );
  }

  // ?�품???�는 경우
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">?��</div>
          <h2 className="text-2xl font-bold text-gray-600 mb-2">?�품??찾을 ???�습?�다</h2>
          <Button onClick={() => navigate("/market")}>
            ??마켓?�로 ?�아가�?          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ?�더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => navigate("/market")}
              className="flex items-center"
            >
              ??마켓?�로 ?�아가�?            </Button>
            <h1 className="text-xl font-bold text-gray-800">?�� AI 감정??Presenter</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ?�품 기본 ?�보 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          {/* ?��?지 */}
          {product.imageUrl && (
            <div className="aspect-video bg-gray-100">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/noimage.png";
                }}
              />
            </div>
          )}

          <div className="p-6">
            {/* ?�태 배�? */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                  {product.category || "기�?"}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  product.status === "sold" ? "bg-gray-100 text-gray-700" :
                  product.status === "reserved" ? "bg-yellow-100 text-yellow-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {product.status === "sold" ? "?�매?�료" :
                   product.status === "reserved" ? "거래�? : "?�매�?}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                ?�록?? {product.createdAt?.toDate?.()?.toLocaleDateString("ko-KR") || "?�짜 ?�음"}
              </div>
            </div>

            {/* ?�목 */}
            <h1 className="text-3xl font-bold mb-4">{product.title}</h1>

            {/* 가�?*/}
            <div className="text-4xl font-bold text-green-600 mb-6">
              {product.price ? product.price.toLocaleString() : "가�?미정"}??            </div>

            {/* 기본 ?�명 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">?�� 기본 ?�명</h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {product.desc || product.description || "?�명???�습?�다."}
              </p>
            </div>
          </div>
        </div>

        {/* 캐시 ?�태 ?�시 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Settings className="mr-2 h-5 w-5 text-blue-600" />
                ?���?캐시 ?�태
              </h2>
              <Button
                onClick={refreshCache}
                variant="outline"
                size="sm"
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                캐시 갱신
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border ${
                cacheStatus.aiSummary ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">AI ?�명</h3>
                    <p className="text-sm text-gray-600">
                      {cacheStatus.aiSummary ? "??캐시?? : "???�음"}
                    </p>
                  </div>
                  <div className="text-2xl">
                    {cacheStatus.aiSummary ? "?��" : "??}
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${
                cacheStatus.audioUrl ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">감정???�성</h3>
                    <p className="text-sm text-gray-600">
                      {cacheStatus.audioUrl ? "??캐시?? : "???�음"}
                    </p>
                    {product.aiTone && product.aiVoice && (
                      <p className="text-xs text-gray-500 mt-1">
                        {toneOptions.find(t => t.value === product.aiTone)?.icon} {product.aiTone} + {voiceOptions.find(v => v.value === product.aiVoice)?.icon} {product.aiVoice}
                      </p>
                    )}
                  </div>
                  <div className="text-2xl">
                    {cacheStatus.audioUrl ? "?��" : "??}
                  </div>
                </div>
              </div>
            </div>

            {cacheStatus.lastGenerated && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center text-sm text-blue-700">
                  <Clock className="mr-2 h-4 w-4" />
                  <span className="font-medium">마�?�??�성:</span>
                  <span className="ml-2">
                    {cacheStatus.lastGenerated.toLocaleString("ko-KR")}
                  </span>
                  {isCacheExpired() && (
                    <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                      만료??(7??경과)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI ?�명 �?감정???�성 ?�성 ?�션 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center">
                ?�� AI 감정??Presenter
              </h2>
              <div className="text-sm text-gray-500">
                {cacheStatus.aiSummary ? "캐시??AI ?�명 ?�용" : "?�로??AI ?�명 ?�성"}
              </div>
            </div>

            {/* AI ?�명 ?�성 버튼 */}
            <div className="mb-6">
              <Button 
                onClick={generateAiSummary} 
                disabled={summarizing}
                className={`${
                  cacheStatus.aiSummary 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                size="lg"
              >
                {summarizing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    AI ?�명 ?�성 �?..
                  </>
                ) : cacheStatus.aiSummary ? (
                  "?�� 캐시??AI ?�명 ?�용"
                ) : (
                  "?�� AI ?�명 ?�성?�기"
                )}
              </Button>
            </div>

            {/* AI ?�명�?*/}
            {aiSummary && (
              <div className="mb-6">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold mb-3 text-gray-800">?�� AI가 ?�성???�품 ?�개</h3>
                  <p className="text-gray-800 whitespace-pre-line leading-relaxed">
                    {aiSummary}
                  </p>
                </div>
              </div>
            )}

            {/* 감정???�성 ?�성 ?�션 */}
            {aiSummary && (
              <div className="border-t pt-6">
                <div className="flex items-center gap-4 mb-6">
                  <h3 className="text-lg font-semibold">?�� 감정???�성 ?�정</h3>
                </div>

                {/* ?�성 ?�택 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ?�� ?�성 ?�택
                  </label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="?�성 ?�택" />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceOptions.map((voice) => (
                        <SelectItem key={voice.value} value={voice.value}>
                          <div className="flex items-center">
                            <span className="mr-2">{voice.icon}</span>
                            <div>
                              <div className="font-medium">{voice.label}</div>
                              <div className="text-xs text-gray-500">{voice.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 감정?????�택 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ?�� 감정?????�택
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {toneOptions.map((tone) => (
                      <div
                        key={tone.value}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedTone === tone.value
                            ? `${tone.bgColor} ${tone.borderColor} border-2`
                            : "bg-white border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedTone(tone.value)}
                      >
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{tone.icon}</span>
                          <div>
                            <div className={`font-medium ${tone.color}`}>{tone.label}</div>
                            <div className="text-xs text-gray-500">{tone.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ?�재 ?�정 ?�시 */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">?�재 ?�정:</span>
                      <span className="flex items-center gap-2">
                        {voiceOptions.find(v => v.value === selectedVoice)?.icon}
                        <span className="font-medium">{voiceOptions.find(v => v.value === selectedVoice)?.label}</span>
                      </span>
                      <span className="text-gray-400">+</span>
                      <span className="flex items-center gap-2">
                        {toneOptions.find(t => t.value === selectedTone)?.icon}
                        <span className="font-medium">{toneOptions.find(t => t.value === selectedTone)?.label}</span>
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {cacheStatus.audioUrl && product.aiTone === selectedTone && product.aiVoice === selectedVoice ? "캐시?? : "?�로 ?�성"}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mb-4">
                  {/* 감정???�성 ?�성 버튼 */}
                  <Button
                    onClick={generateTTS}
                    disabled={speaking}
                    className={`${
                      cacheStatus.audioUrl && product.aiTone === selectedTone && product.aiVoice === selectedVoice
                        ? "bg-green-600 hover:bg-green-700" 
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                  >
                    {speaking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        감정???�성 ?�성 �?..
                      </>
                    ) : cacheStatus.audioUrl && product.aiTone === selectedTone && product.aiVoice === selectedVoice ? (
                      <>
                        <Volume2 className="mr-2 h-4 w-4" />
                        캐시???�성 ?�생
                      </>
                    ) : (
                      <>
                        <Volume2 className="mr-2 h-4 w-4" />
                        감정???�성 ?�성?�기
                      </>
                    )}
                  </Button>

                  {/* ?�생 컨트�?*/}
                  {audioUrl && (
                    <>
                      <Button
                        onClick={toggleAudio}
                        variant="outline"
                        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            ?�시?��?
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            ?�생
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={stopAudio}
                        variant="outline"
                        size="sm"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        ?��?
                      </Button>
                    </>
                  )}
                </div>

                {/* ?�디???�레?�어 */}
                {audioUrl && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">감정???�성 ?�일 ?�생</span>
                      {cacheStatus.audioUrl && product.aiTone === selectedTone && product.aiVoice === selectedVoice && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          캐시??                        </span>
                      )}
                    </div>
                    <audio 
                      controls 
                      className="w-full h-12"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                    >
                      <source src={audioUrl} type="audio/mpeg" />
                      브라?��?가 ?�디???�생??지?�하지 ?�습?�다.
                    </audio>
                    <div className="mt-2 text-xs text-gray-500">
                      ?�� ?�재 ?�정: {voiceOptions.find(v => v.value === selectedVoice)?.label} + {toneOptions.find(t => t.value === selectedTone)?.label}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI ?�보 */}
            {(aiSummary || audioUrl) && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium mb-2">?�� AI ?�성 ?�보</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                  {aiSummary && (
                    <div>
                      <span className="font-medium">?�명 ?�성:</span>{" "}
                      {product.aiGeneratedAt ? 
                        new Date(product.aiGeneratedAt.seconds * 1000).toLocaleString("ko-KR") : 
                        "방금 ?�성??}
                      {cacheStatus.aiSummary && (
                        <span className="ml-2 px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                          캐시
                        </span>
                      )}
                    </div>
                  )}
                  {audioUrl && (
                    <div>
                      <span className="font-medium">?�성 ?�성:</span>{" "}
                      {product.ttsGeneratedAt ? 
                        new Date(product.ttsGeneratedAt.seconds * 1000).toLocaleString("ko-KR") : 
                        "방금 ?�성??}
                      {cacheStatus.audioUrl && (
                        <span className="ml-2 px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                          캐시
                        </span>
                      )}
                    </div>
                  )}
                  {audioUrl && (
                    <div>
                      <span className="font-medium">?�성 ?�정:</span>{" "}
                      {voiceOptions.find(v => v.value === selectedVoice)?.label} + {toneOptions.find(t => t.value === selectedTone)?.label}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">모델:</span> GPT-4o-mini + OpenAI TTS (감정??
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 감정??TTS ?�스???�명 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">?�� 감정??TTS ?�스???�징</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <Zap className="mr-2 h-4 w-4 text-orange-500" />
                ???�기�???              </h4>
              <p className="text-sm text-gray-600">
                ?�기 ?�고 빠른 ?�도�??�너지가 ?�치???�성?�로 변?�됩?�다.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <Moon className="mr-2 h-4 w-4 text-blue-500" />
                ?�� 차분????              </h4>
              <p className="text-sm text-gray-600">
                ?�긋?�고 부?�러???�으�??�화로운 ?�성?�로 변?�됩?�다.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <Briefcase className="mr-2 h-4 w-4 text-purple-500" />
                ?�� ?�문????              </h4>
              <p className="text-sm text-gray-600">
                ?�스 ?�커처럼 ?�뢰�??�고 권위 ?�는 ?�성?�로 변?�됩?�다.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <Smile className="mr-2 h-4 w-4 text-green-500" />
                ?�� ?�쾌????              </h4>
              <p className="text-sm text-gray-600">
                밝고 친근???�으�?즐겁�??�음???�는 ?�성?�로 변?�됩?�다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
