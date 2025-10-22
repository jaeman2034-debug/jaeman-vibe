// ??/src/pages/ProductDetailPage.tsx (Emotion-Adaptive TTS ?„ì„±??
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

  // ?™ ?Œì„± ?µì…˜ (6ê°€ì§€ OpenAI TTS ?Œì„±)
  const voiceOptions = [
    { value: "alloy", label: "?™ Alloy (ê¸°ë³¸)", description: "?ì—°?¤ëŸ¬??ì¤‘ì„± ?Œì„±", icon: "?™" },
    { value: "echo", label: "?”Š Echo", description: "?°ëœ»???¨ì„± ?Œì„±", icon: "?”Š" },
    { value: "fable", label: "?“– Fable", description: "?°ì•„???¬ì„± ?Œì„±", icon: "?“–" },
    { value: "onyx", label: "?–¤ Onyx", description: "ê¹Šì? ?¨ì„± ?Œì„±", icon: "?–¤" },
    { value: "nova", label: "?’¡ Nova", description: "ë°ì? ?¨ì„± ?Œì„±", icon: "?’¡" },
    { value: "shimmer", label: "??Shimmer", description: "ë¶€?œëŸ¬???¬ì„± ?Œì„±", icon: "?? },
  ];

  // ?š ê°ì •?????µì…˜ (5ê°€ì§€ ê°ì • ?¤í???
  const toneOptions = [
    { 
      value: "neutral", 
      label: "?™ ?¼ë°˜??, 
      description: "?ì—°?¤ëŸ½ê³?ëª…í™•??ë§íˆ¬", 
      icon: "?™",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200"
    },
    { 
      value: "energetic", 
      label: "???œê¸°ì°?, 
      description: "?ê¸° ?ˆê³  ë¹ ë¥¸ ?ë„", 
      icon: "??,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    },
    { 
      value: "calm", 
      label: "?Œ™ ì°¨ë¶„??, 
      description: "?ê¸‹?˜ê³  ë¶€?œëŸ¬????, 
      icon: "?Œ™",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    { 
      value: "professional", 
      label: "?’¼ ?„ë¬¸??, 
      description: "? ë¢°ê°??ˆëŠ” ?´ìŠ¤ ?µì»¤ ??, 
      icon: "?’¼",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    },
    { 
      value: "cheerful", 
      label: "?˜Š ? ì¾Œ??, 
      description: "ë°ê³  ì¹œê·¼???´ì•¼ê¸???, 
      icon: "?˜Š",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
  ];

  // ???í’ˆ ë¡œë“œ (ìºì‹œ ì²´í¬ ?¬í•¨)
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) {
          setError("?˜ëª»???‘ê·¼?…ë‹ˆ??");
          setLoading(false);
          return;
        }
        
        const docRef = doc(db, "marketItems", id);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          const data = snap.data();
          setProduct({ id: snap.id, ...data });
          
          // ??ìºì‹œ ?íƒœ ì²´í¬ ë°?ì¦‰ì‹œ ë¡œë“œ
          const hasAiSummary = !!data.aiSummary;
          const hasAudioUrl = !!data.audioUrl;
          const lastGenerated = data.aiGeneratedAt?.toDate?.();
          
          setCacheStatus({
            aiSummary: hasAiSummary,
            audioUrl: hasAudioUrl,
            lastGenerated: lastGenerated
          });
          
          // ìºì‹œ???°ì´??ì¦‰ì‹œ ë¡œë“œ
          if (hasAiSummary) {
            setAiSummary(data.aiSummary);
            console.log("??AI ?¤ëª… ìºì‹œ ?¬ìš©:", data.aiSummary.substring(0, 50) + "...");
          }
          
          if (hasAudioUrl) {
            setAudioUrl(data.audioUrl);
            console.log("???Œì„± ?Œì¼ ìºì‹œ ?¬ìš©:", data.audioUrl);
          }
          
          if (data.aiVoice) {
            setSelectedVoice(data.aiVoice);
          }
          
          if (data.aiTone) {
            setSelectedTone(data.aiTone);
          }
          
        } else {
          setError("?í’ˆ??ì°¾ì„ ???†ìŠµ?ˆë‹¤.");
        }
      } catch (err) {
        console.error("?í’ˆ ë¡œë“œ ?¤ë¥˜:", err);
        setError("?°ì´??ë¡œë“œ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);

  // ?§  AI ?¤ëª… ?ì„± (ìºì‹± ì²´í¬)
  const generateAiSummary = async () => {
    if (!product) return;
    
    // ???´ë? ?”ì•½ë¬¸ì´ ?ˆë‹¤ë©?ìºì‹œ ?¬ìš©
    if (product.aiSummary && cacheStatus.aiSummary) {
      setAiSummary(product.aiSummary);
      console.log("??AI ?¤ëª… ìºì‹œ ?¬ìš© - API ?¸ì¶œ ?ëµ");
      return;
    }

    setSummarizing(true);
    try {
      console.log("?¤– AI ?¤ëª… ?ì„± ?œì‘ (?ˆë¡œ ?ì„±):", product.title);
      
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
              content: `?ˆëŠ” ?í’ˆ??ë§¤ë ¥?ìœ¼ë¡??Œê°œ?˜ëŠ” ?„ë¬¸ê°€?? 
              ì§§ê³  ?¤ë“???ˆëŠ” ?¤ëª…???¨ì¤˜.
              ?Œì„±?¼ë¡œ ?½ê¸°???í•©?˜ê²Œ ?ì—°?¤ëŸ¬??ë¬¸ì¥?¼ë¡œ êµ¬ì„±?´ì¤˜.
              ?´ëª¨ì§€ë¥??ì ˆ???¬ìš©?´ì„œ ì¹œê·¼?˜ê²Œ ë§Œë“¤?´ì¤˜.`,
            },
            {
              role: "user",
              content: `?í’ˆëª? ${product.title || "?œëª© ?†ìŒ"}
ê°€ê²? ${product.price ? product.price.toLocaleString() : "ê°€ê²?ë¯¸ì •"}??ì¹´í…Œê³ ë¦¬: ${product.category || "ê¸°í?"}
?¤ëª…: ${product.desc || product.description || "?¤ëª… ?†ìŒ"}
?íƒœ: ${product.status || "?ë§¤ì¤?}`,
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API ?¤ë¥˜: ${response.status}`);
      }

      const data = await response.json();
      const summary = data?.choices?.[0]?.message?.content || "AI ?¤ëª… ?ì„± ?¤íŒ¨";
      
      setAiSummary(summary);
      
      // Firestore??AI ?¤ëª… ?€??(ìºì‹œ)
      await updateDoc(doc(db, "marketItems", id!), {
        aiSummary: summary,
        aiGeneratedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // ìºì‹œ ?íƒœ ?…ë°?´íŠ¸
      setCacheStatus(prev => ({ ...prev, aiSummary: true }));
      
      console.log("??AI ?¤ëª… ?ì„± ë°?ìºì‹œ ?€???„ë£Œ");
      
    } catch (err) {
      console.error("??AI ?¤ëª… ?¤ë¥˜:", err);
      setAiSummary("AI ?¤ëª… ?ì„± ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤. ? ì‹œ ???¤ì‹œ ?œë„?´ì£¼?¸ìš”.");
    } finally {
      setSummarizing(false);
    }
  };

  // ?™ Emotion-Adaptive TTS ?ì„± (ìºì‹± ì²´í¬)
  const generateTTS = async () => {
    if (!aiSummary) {
      alert("ë¨¼ì? AI ?¤ëª…???ì„±?´ì£¼?¸ìš”!");
      return;
    }

    // ???´ë? ê°™ì? ?¤ì˜ mp3ê°€ ?ˆìœ¼ë©?ìºì‹œ ?¬ìš©
    const currentToneKey = `${selectedVoice}_${selectedTone}`;
    if (audioUrl && cacheStatus.audioUrl && product.aiTone === selectedTone && product.aiVoice === selectedVoice) {
      console.log("???Œì„± ?Œì¼ ìºì‹œ ?¬ìš© - TTS API ?¸ì¶œ ?ëµ");
      
      // ì¦‰ì‹œ ?¬ìƒ
      try {
        const audio = new Audio(audioUrl);
        setAudioElement(audio);
        
        audio.onended = () => setIsPlaying(false);
        audio.onpause = () => setIsPlaying(false);
        audio.onplay = () => setIsPlaying(true);
        
        await audio.play();
        setIsPlaying(true);
        console.log("??ìºì‹œ???Œì„± ?Œì¼ ì¦‰ì‹œ ?¬ìƒ");
      } catch (err) {
        console.error("?Œì„± ?¬ìƒ ?¤ë¥˜:", err);
        alert("?Œì„± ?¬ìƒ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
      }
      return;
    }

    setSpeaking(true);
    try {
      console.log("?™ Emotion-Adaptive TTS ?Œì„± ?ì„± ?œì‘:", selectedVoice, selectedTone);
      
      // ?š ê°ì •?????¤ì •
      const toneConfig: Record<string, string> = {
        neutral: "?ì—°?¤ëŸ½ê³?ëª…í™•??ë§íˆ¬ë¡??½ì–´ì¤? ?‰ë²”?˜ê³  ?ˆì •???ë„ë¡?ë§í•´ì¤?",
        energetic: "?œê¸°ì°¨ê³  ?ê¸° ?ˆê²Œ, ?½ê°„ ë¹ ë¥¸ ?ë„ë¡??½ì–´ì¤? ?ë„ˆì§€ê°€ ?˜ì¹˜???¤ìœ¼ë¡?ë§í•´ì¤?",
        calm: "?ê¸‹?˜ê³  ë¶€?œëŸ½ê²? ?ˆì •??ëª©ì†Œë¦¬ë¡œ ?½ì–´ì¤? ì°¨ë¶„?˜ê³  ?‰í™”ë¡œìš´ ?¤ìœ¼ë¡?ë§í•´ì¤?",
        professional: "ëª…í™•?˜ê³  ? ë¢°ê°??ˆê²Œ, ?´ìŠ¤ ?µì»¤ì²˜ëŸ¼ ë§í•´ì¤? ?„ë¬¸?ì´ê³?ê¶Œìœ„ ?ˆëŠ” ?¤ìœ¼ë¡?ë§í•´ì¤?",
        cheerful: "ë°ê³  ? ì¾Œ?˜ê²Œ, ì¹œê·¼???¤ìœ¼ë¡??´ì•¼ê¸°í•˜??ë§í•´ì¤? ì¦ê²ê³??ƒìŒ???˜ëŠ” ?¤ìœ¼ë¡?ë§í•´ì¤?",
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
          text: `${toneInstruction}\n\n?¤ìŒ ?í’ˆ ?¤ëª…???½ì–´ì¤?\n\n${aiSummary}`,
          filename: `product_${id}_${selectedVoice}_${selectedTone}.mp3`,
          voice: selectedVoice,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API ?¤ë¥˜: ${response.status}`);
      }

      const data = await response.json();
      
      if (data?.url) {
        setAudioUrl(data.url);
        
        // Firestore???Œì„± URL ?€??(ìºì‹œ)
        await updateDoc(doc(db, "marketItems", id!), {
          audioUrl: data.url,
          aiVoice: selectedVoice,
          aiTone: selectedTone,
          ttsGeneratedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // ìºì‹œ ?íƒœ ?…ë°?´íŠ¸
        setCacheStatus(prev => ({ ...prev, audioUrl: true }));
        
        console.log("??Emotion-Adaptive TTS ?Œì„± ?ì„± ë°?ìºì‹œ ?€???„ë£Œ:", data.url);
        
        // ?ë™ ?¬ìƒ
        try {
          const audio = new Audio(data.url);
          setAudioElement(audio);
          
          audio.onended = () => setIsPlaying(false);
          audio.onpause = () => setIsPlaying(false);
          audio.onplay = () => setIsPlaying(true);
          
          await audio.play();
          setIsPlaying(true);
          console.log("???ˆë¡œ ?ì„±??ê°ì •???Œì„± ?Œì¼ ?ë™ ?¬ìƒ");
        } catch (playErr) {
          console.error("?ë™ ?¬ìƒ ?¤ë¥˜:", playErr);
        }
        
      } else {
        alert("TTS ë³€???¤íŒ¨: " + (data.error || "?????†ëŠ” ?¤ë¥˜"));
      }
    } catch (err) {
      console.error("??Emotion-Adaptive TTS ?¤ë¥˜:", err);
      alert("ê°ì •???Œì„± ?ì„± ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤. ? ì‹œ ???¤ì‹œ ?œë„?´ì£¼?¸ìš”.");
    } finally {
      setSpeaking(false);
    }
  };

  // ?”„ ìºì‹œ ê°•ì œ ê°±ì‹ 
  const refreshCache = async () => {
    if (!product) return;
    
    const confirmRefresh = window.confirm(
      "ìºì‹œë¥?ê°•ì œë¡?ê°±ì‹ ?˜ì‹œê² ìŠµ?ˆê¹Œ?\n" +
      "ê¸°ì¡´ AI ?¤ëª…ê³??Œì„± ?Œì¼???ˆë¡œ??ê²ƒìœ¼ë¡?êµì²´?©ë‹ˆ??"
    );
    
    if (!confirmRefresh) return;
    
    try {
      // AI ?¤ëª… ê°•ì œ ?¬ìƒ??      setSummarizing(true);
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
              content: `?ˆëŠ” ?í’ˆ??ë§¤ë ¥?ìœ¼ë¡??Œê°œ?˜ëŠ” ?„ë¬¸ê°€?? 
              ?´ì „ê³??¤ë¥¸ ?ˆë¡œ??ê´€?ìœ¼ë¡??¤ëª…?´ì¤˜.
              ì§§ê³  ?¤ë“???ˆëŠ” ?¤ëª…???¨ì¤˜.`,
            },
            {
              role: "user",
              content: `?í’ˆëª? ${product.title || "?œëª© ?†ìŒ"}
ê°€ê²? ${product.price ? product.price.toLocaleString() : "ê°€ê²?ë¯¸ì •"}??ì¹´í…Œê³ ë¦¬: ${product.category || "ê¸°í?"}
?¤ëª…: ${product.desc || product.description || "?¤ëª… ?†ìŒ"}
?íƒœ: ${product.status || "?ë§¤ì¤?}`,
            },
          ],
          max_tokens: 300,
          temperature: 0.8, // ??ì°½ì˜?ìœ¼ë¡?        }),
      });

      const data = await response.json();
      const newSummary = data?.choices?.[0]?.message?.content || "AI ?¤ëª… ?ì„± ?¤íŒ¨";
      
      setAiSummary(newSummary);
      
      // Firestore ?…ë°?´íŠ¸
      await updateDoc(doc(db, "marketItems", id!), {
        aiSummary: newSummary,
        aiGeneratedAt: serverTimestamp(),
        audioUrl: "", // ?Œì„± ?Œì¼ ì´ˆê¸°??        ttsGeneratedAt: null,
        updatedAt: serverTimestamp()
      });
      
      // ìºì‹œ ?íƒœ ?…ë°?´íŠ¸
      setCacheStatus({
        aiSummary: true,
        audioUrl: false, // ?Œì„± ?Œì¼?€ ?ˆë¡œ ?ì„± ?„ìš”
        lastGenerated: new Date()
      });
      
      setAudioUrl(""); // ?Œì„± URL ì´ˆê¸°??      setAudioElement(null);
      setIsPlaying(false);
      
      console.log("??ìºì‹œ ê°•ì œ ê°±ì‹  ?„ë£Œ");
      alert("AI ?¤ëª…???ˆë¡œ ?ì„±?˜ì—ˆ?µë‹ˆ?? ê°ì •???Œì„±???ˆë¡œ ?ì„±?˜ì‹œê² ìŠµ?ˆê¹Œ?");
      
    } catch (err) {
      console.error("??ìºì‹œ ê°±ì‹  ?¤ë¥˜:", err);
      alert("ìºì‹œ ê°±ì‹  ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    } finally {
      setSummarizing(false);
    }
  };

  // ?§ ?¤ë””???¬ìƒ ?œì–´
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
      console.error("?¤ë””???¬ìƒ ?¤ë¥˜:", err);
      alert("?¤ë””???¬ìƒ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    }
  };

  // ?”„ ?Œì„± ?¬ìƒ ?•ì?
  const stopAudio = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsPlaying(false);
    }
  };

  // ìºì‹œ ë§Œë£Œ ì²´í¬ (7??
  const isCacheExpired = () => {
    if (!cacheStatus.lastGenerated) return false;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return cacheStatus.lastGenerated < sevenDaysAgo;
  };

  // ë¡œë”© ?íƒœ
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">?í’ˆ ?•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
        </div>
      </div>
    );
  }

  // ?ëŸ¬ ?íƒœ
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">? ï¸</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">?¤ë¥˜ ë°œìƒ</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => navigate("/market")} className="mr-2">
            ??ë§ˆì¼“?¼ë¡œ ?Œì•„ê°€ê¸?          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            ?”„ ?ˆë¡œê³ ì¹¨
          </Button>
        </div>
      </div>
    );
  }

  // ?í’ˆ???†ëŠ” ê²½ìš°
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">?“¦</div>
          <h2 className="text-2xl font-bold text-gray-600 mb-2">?í’ˆ??ì°¾ì„ ???†ìŠµ?ˆë‹¤</h2>
          <Button onClick={() => navigate("/market")}>
            ??ë§ˆì¼“?¼ë¡œ ?Œì•„ê°€ê¸?          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ?¤ë” */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => navigate("/market")}
              className="flex items-center"
            >
              ??ë§ˆì¼“?¼ë¡œ ?Œì•„ê°€ê¸?            </Button>
            <h1 className="text-xl font-bold text-gray-800">?™ AI ê°ì •??Presenter</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ?í’ˆ ê¸°ë³¸ ?•ë³´ */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          {/* ?´ë?ì§€ */}
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
            {/* ?íƒœ ë°°ì? */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                  {product.category || "ê¸°í?"}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  product.status === "sold" ? "bg-gray-100 text-gray-700" :
                  product.status === "reserved" ? "bg-yellow-100 text-yellow-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {product.status === "sold" ? "?ë§¤?„ë£Œ" :
                   product.status === "reserved" ? "ê±°ë˜ì¤? : "?ë§¤ì¤?}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                ?±ë¡?? {product.createdAt?.toDate?.()?.toLocaleDateString("ko-KR") || "? ì§œ ?†ìŒ"}
              </div>
            </div>

            {/* ?œëª© */}
            <h1 className="text-3xl font-bold mb-4">{product.title}</h1>

            {/* ê°€ê²?*/}
            <div className="text-4xl font-bold text-green-600 mb-6">
              {product.price ? product.price.toLocaleString() : "ê°€ê²?ë¯¸ì •"}??            </div>

            {/* ê¸°ë³¸ ?¤ëª… */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">?“ ê¸°ë³¸ ?¤ëª…</h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {product.desc || product.description || "?¤ëª…???†ìŠµ?ˆë‹¤."}
              </p>
            </div>
          </div>
        </div>

        {/* ìºì‹œ ?íƒœ ?œì‹œ */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Settings className="mr-2 h-5 w-5 text-blue-600" />
                ?—„ï¸?ìºì‹œ ?íƒœ
              </h2>
              <Button
                onClick={refreshCache}
                variant="outline"
                size="sm"
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                ìºì‹œ ê°±ì‹ 
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border ${
                cacheStatus.aiSummary ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">AI ?¤ëª…</h3>
                    <p className="text-sm text-gray-600">
                      {cacheStatus.aiSummary ? "??ìºì‹œ?? : "???†ìŒ"}
                    </p>
                  </div>
                  <div className="text-2xl">
                    {cacheStatus.aiSummary ? "?§ " : "??}
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${
                cacheStatus.audioUrl ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">ê°ì •???Œì„±</h3>
                    <p className="text-sm text-gray-600">
                      {cacheStatus.audioUrl ? "??ìºì‹œ?? : "???†ìŒ"}
                    </p>
                    {product.aiTone && product.aiVoice && (
                      <p className="text-xs text-gray-500 mt-1">
                        {toneOptions.find(t => t.value === product.aiTone)?.icon} {product.aiTone} + {voiceOptions.find(v => v.value === product.aiVoice)?.icon} {product.aiVoice}
                      </p>
                    )}
                  </div>
                  <div className="text-2xl">
                    {cacheStatus.audioUrl ? "?§" : "??}
                  </div>
                </div>
              </div>
            </div>

            {cacheStatus.lastGenerated && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center text-sm text-blue-700">
                  <Clock className="mr-2 h-4 w-4" />
                  <span className="font-medium">ë§ˆì?ë§??ì„±:</span>
                  <span className="ml-2">
                    {cacheStatus.lastGenerated.toLocaleString("ko-KR")}
                  </span>
                  {isCacheExpired() && (
                    <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                      ë§Œë£Œ??(7??ê²½ê³¼)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI ?¤ëª… ë°?ê°ì •???Œì„± ?ì„± ?¹ì…˜ */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center">
                ?™ AI ê°ì •??Presenter
              </h2>
              <div className="text-sm text-gray-500">
                {cacheStatus.aiSummary ? "ìºì‹œ??AI ?¤ëª… ?¬ìš©" : "?ˆë¡œ??AI ?¤ëª… ?ì„±"}
              </div>
            </div>

            {/* AI ?¤ëª… ?ì„± ë²„íŠ¼ */}
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
                    AI ?¤ëª… ?ì„± ì¤?..
                  </>
                ) : cacheStatus.aiSummary ? (
                  "?§  ìºì‹œ??AI ?¤ëª… ?¬ìš©"
                ) : (
                  "?¤– AI ?¤ëª… ?ì„±?˜ê¸°"
                )}
              </Button>
            </div>

            {/* AI ?¤ëª…ë¬?*/}
            {aiSummary && (
              <div className="mb-6">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold mb-3 text-gray-800">?§  AIê°€ ?‘ì„±???í’ˆ ?Œê°œ</h3>
                  <p className="text-gray-800 whitespace-pre-line leading-relaxed">
                    {aiSummary}
                  </p>
                </div>
              </div>
            )}

            {/* ê°ì •???Œì„± ?ì„± ?¹ì…˜ */}
            {aiSummary && (
              <div className="border-t pt-6">
                <div className="flex items-center gap-4 mb-6">
                  <h3 className="text-lg font-semibold">?š ê°ì •???Œì„± ?¤ì •</h3>
                </div>

                {/* ?Œì„± ? íƒ */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ?™ ?Œì„± ? íƒ
                  </label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="?Œì„± ? íƒ" />
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

                {/* ê°ì •????? íƒ */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ?š ê°ì •????? íƒ
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

                {/* ?„ì¬ ?¤ì • ?œì‹œ */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">?„ì¬ ?¤ì •:</span>
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
                      {cacheStatus.audioUrl && product.aiTone === selectedTone && product.aiVoice === selectedVoice ? "ìºì‹œ?? : "?ˆë¡œ ?ì„±"}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mb-4">
                  {/* ê°ì •???Œì„± ?ì„± ë²„íŠ¼ */}
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
                        ê°ì •???Œì„± ?ì„± ì¤?..
                      </>
                    ) : cacheStatus.audioUrl && product.aiTone === selectedTone && product.aiVoice === selectedVoice ? (
                      <>
                        <Volume2 className="mr-2 h-4 w-4" />
                        ìºì‹œ???Œì„± ?¬ìƒ
                      </>
                    ) : (
                      <>
                        <Volume2 className="mr-2 h-4 w-4" />
                        ê°ì •???Œì„± ?ì„±?˜ê¸°
                      </>
                    )}
                  </Button>

                  {/* ?¬ìƒ ì»¨íŠ¸ë¡?*/}
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
                            ?¼ì‹œ?•ì?
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            ?¬ìƒ
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={stopAudio}
                        variant="outline"
                        size="sm"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        ?•ì?
                      </Button>
                    </>
                  )}
                </div>

                {/* ?¤ë””???Œë ˆ?´ì–´ */}
                {audioUrl && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">ê°ì •???Œì„± ?Œì¼ ?¬ìƒ</span>
                      {cacheStatus.audioUrl && product.aiTone === selectedTone && product.aiVoice === selectedVoice && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          ìºì‹œ??                        </span>
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
                      ë¸Œë¼?°ì?ê°€ ?¤ë””???¬ìƒ??ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤.
                    </audio>
                    <div className="mt-2 text-xs text-gray-500">
                      ?§ ?„ì¬ ?¤ì •: {voiceOptions.find(v => v.value === selectedVoice)?.label} + {toneOptions.find(t => t.value === selectedTone)?.label}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI ?•ë³´ */}
            {(aiSummary || audioUrl) && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium mb-2">?“Š AI ?ì„± ?•ë³´</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                  {aiSummary && (
                    <div>
                      <span className="font-medium">?¤ëª… ?ì„±:</span>{" "}
                      {product.aiGeneratedAt ? 
                        new Date(product.aiGeneratedAt.seconds * 1000).toLocaleString("ko-KR") : 
                        "ë°©ê¸ˆ ?ì„±??}
                      {cacheStatus.aiSummary && (
                        <span className="ml-2 px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                          ìºì‹œ
                        </span>
                      )}
                    </div>
                  )}
                  {audioUrl && (
                    <div>
                      <span className="font-medium">?Œì„± ?ì„±:</span>{" "}
                      {product.ttsGeneratedAt ? 
                        new Date(product.ttsGeneratedAt.seconds * 1000).toLocaleString("ko-KR") : 
                        "ë°©ê¸ˆ ?ì„±??}
                      {cacheStatus.audioUrl && (
                        <span className="ml-2 px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                          ìºì‹œ
                        </span>
                      )}
                    </div>
                  )}
                  {audioUrl && (
                    <div>
                      <span className="font-medium">?Œì„± ?¤ì •:</span>{" "}
                      {voiceOptions.find(v => v.value === selectedVoice)?.label} + {toneOptions.find(t => t.value === selectedTone)?.label}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">ëª¨ë¸:</span> GPT-4o-mini + OpenAI TTS (ê°ì •??
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ê°ì •??TTS ?œìŠ¤???¤ëª… */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">?š ê°ì •??TTS ?œìŠ¤???¹ì§•</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <Zap className="mr-2 h-4 w-4 text-orange-500" />
                ???œê¸°ì°???              </h4>
              <p className="text-sm text-gray-600">
                ?ê¸° ?ˆê³  ë¹ ë¥¸ ?ë„ë¡??ë„ˆì§€ê°€ ?˜ì¹˜???Œì„±?¼ë¡œ ë³€?˜ë©?ˆë‹¤.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <Moon className="mr-2 h-4 w-4 text-blue-500" />
                ?Œ™ ì°¨ë¶„????              </h4>
              <p className="text-sm text-gray-600">
                ?ê¸‹?˜ê³  ë¶€?œëŸ¬???¤ìœ¼ë¡??‰í™”ë¡œìš´ ?Œì„±?¼ë¡œ ë³€?˜ë©?ˆë‹¤.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <Briefcase className="mr-2 h-4 w-4 text-purple-500" />
                ?’¼ ?„ë¬¸????              </h4>
              <p className="text-sm text-gray-600">
                ?´ìŠ¤ ?µì»¤ì²˜ëŸ¼ ? ë¢°ê°??ˆê³  ê¶Œìœ„ ?ˆëŠ” ?Œì„±?¼ë¡œ ë³€?˜ë©?ˆë‹¤.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <Smile className="mr-2 h-4 w-4 text-green-500" />
                ?˜Š ? ì¾Œ????              </h4>
              <p className="text-sm text-gray-600">
                ë°ê³  ì¹œê·¼???¤ìœ¼ë¡?ì¦ê²ê³??ƒìŒ???˜ëŠ” ?Œì„±?¼ë¡œ ë³€?˜ë©?ˆë‹¤.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
