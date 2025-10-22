// === YAGO VIBE ?„ì „ ?€?”í˜• AI ?Œì„± ë¹„ì„œ ===
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";

const AI_API_URL = import.meta.env.VITE_OPENAI_ASSISTANT_URL;

interface ConversationMessage {
  id: string;
  speaker: 'user' | 'ai';
  text: string;
  timestamp: Date;
  action?: string; // 'navigate', 'register', 'search' ??}

export default function VoiceAssistant() {
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // ?”Š ?Œì„± ì¶œë ¥ (TTS)
  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn("??ë¸Œë¼?°ì????Œì„± ?©ì„±??ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤.");
      return;
    }

    // ?´ì „ ?Œì„± ì¤‘ì?
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 1.5; // ìµœì  ?ë„ ?¤ì •
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      setIsSpeaking(true);
      console.log("?”Š AI ?Œì„± ì¶œë ¥ ?œì‘:", text);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      console.log("?”Š AI ?Œì„± ì¶œë ¥ ?„ë£Œ");
    };

    utterance.onerror = (e) => {
      console.error("TTS ?¤ë¥˜:", e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // ?™ï¸??Œì„± ?¸ì‹ (STT)
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      speak("??ë¸Œë¼?°ì????Œì„± ?¸ì‹??ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤.");
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

    recognition.onresult = async (e: any) => {
      const userSpeech = e.results[0][0].transcript;
      console.log("?¤ ?¸ì‹???Œì„±:", userSpeech);
      
      // ?¬ìš©??ë©”ì‹œì§€ ì¶”ê?
      const userMessage: ConversationMessage = {
        id: Date.now().toString(),
        speaker: 'user',
        text: userSpeech,
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, userMessage]);
      setIsListening(false);
      
      // AI ?‘ë‹µ ì²˜ë¦¬
      await handleAIResponse(userSpeech);
    };

    recognition.onerror = (e: any) => {
      console.error("STT ?¤ë¥˜:", e);
      setIsListening(false);
      speak("?Œì„± ?¸ì‹ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤. ?¤ì‹œ ?œë„?´ì£¼?¸ìš”.");
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log("?¤ ?Œì„± ?¸ì‹ ì¢…ë£Œ");
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  // ?§  AI ?‘ë‹µ ì²˜ë¦¬
  const handleAIResponse = async (userSpeech: string) => {
    setIsProcessing(true);
    try {
      // Firestore?ì„œ ìµœì‹  ?°ì´??ì¡°íšŒ
      const marketItemsRef = collection(db, "market_items");
      const q = query(marketItemsRef, orderBy("createdAt", "desc"), limit(10));
      const snapshot = await getDocs(q);
      
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // ?¤ëŠ˜ ?±ë¡???í’ˆ
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayItems = items.filter(item => {
        const createdAt = item.createdAt?.toDate();
        return createdAt && createdAt >= today;
      });

      // ?œì„± ?í’ˆ
      const activeItems = items.filter(item => item.status === "active");

      // AI API ?¸ì¶œ
      const proxyUrl = import.meta.env.VITE_OPENAI_PROXY_URL;
      
      if (!proxyUrl || proxyUrl.includes('your-n8n-server.com')) {
        // n8n ?¹í›…???¤ì •?˜ì? ?Šì? ê²½ìš° ë¡œì»¬ ?‘ë‹µ ?ì„±
        console.log("n8n ?¹í›…???¤ì •?˜ì? ?ŠìŒ, ë¡œì»¬ ?‘ë‹µ ?ì„±");
        await generateLocalResponse(userSpeech, items, todayItems, activeItems);
        return;
      }

      // n8n ?¹í›… ?¸ì¶œ
      const response = await fetch(`${proxyUrl.replace('ai-describe-tags-category-voice', 'yago-voice-assistant')}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userSpeech,
          items: items,
          todayItems: todayItems,
          activeItems: activeItems,
          mode: "voice-assistant"
        }),
      });

      if (!response.ok) {
        throw new Error(`n8n ?¹í›… ?¤ë¥˜: ${response.status}`);
      }

      const data = await response.json();
      const aiReply = data.reply || "ë¬´ìŠ¨ ?»ì¸ì§€ ?¤ì‹œ ë§ì??´ì£¼?¤ë˜??";
      const action = data.action || null;

      // AI ë©”ì‹œì§€ ì¶”ê?
      const aiMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        speaker: 'ai',
        text: aiReply,
        timestamp: new Date(),
        action: action
      };
      
      setConversation(prev => [...prev, aiMessage]);
      speak(aiReply);

      // ?¡ì…˜ ?¤í–‰
      if (action) {
        executeAction(action);
      }

    } catch (error) {
      console.error("AI ?‘ë‹µ ì²˜ë¦¬ ?¤ë¥˜:", error);
      const errorMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        speaker: 'ai',
        text: "AI ?‘ë‹µ??ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤. ?¤ì‹œ ?œë„?´ì£¼?¸ìš”.",
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, errorMessage]);
      speak("AI ?‘ë‹µ??ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤. ?¤ì‹œ ?œë„?´ì£¼?¸ìš”.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ?“ ë¡œì»¬ ?‘ë‹µ ?ì„± (?´ë°±)
  const generateLocalResponse = async (userSpeech: string, items: any[], todayItems: any[], activeItems: any[]) => {
    let aiReply = "";
    let action = null;

    // ê°„ë‹¨???¤ì›Œ??ê¸°ë°˜ ?‘ë‹µ
    if (userSpeech.includes("?±ë¡") || userSpeech.includes("?¬ë¦¬") || userSpeech.includes("???í’ˆ")) {
      aiReply = `?•ë‹˜, ???í’ˆ ?±ë¡???„ì??œë¦¬ê² ìŠµ?ˆë‹¤. ?„ì¬ ?±ë¡???í’ˆ?€ ì´?${items.length}ê°œì…?ˆë‹¤. ?±ë¡ ?˜ì´ì§€ë¡??´ë™? ê¹Œ??`;
      action = "navigate_upload";
    } else if (userSpeech.includes("?¤ëŠ˜") || userSpeech.includes("?´ì œ") || userSpeech.includes("ìµœê·¼")) {
      aiReply = `?•ë‹˜, ?¤ëŠ˜ ?±ë¡???í’ˆ?€ ${todayItems.length}ê°œì…?ˆë‹¤. ?„ì²´ ?œì„± ?í’ˆ?€ ${activeItems.length}ê°œì…?ˆë‹¤.`;
    } else if (userSpeech.includes("ë§ˆì¼“") || userSpeech.includes("?í’ˆ") || userSpeech.includes("ëª©ë¡")) {
      aiReply = `?•ë‹˜, ?„ì¬ ?±ë¡???í’ˆ?€ ì´?${items.length}ê°œì…?ˆë‹¤. ë§ˆì¼“ ?˜ì´ì§€ë¡??´ë™? ê¹Œ??`;
      action = "navigate_market";
    } else if (userSpeech.includes("ë³´ê³ ??) || userSpeech.includes("ë¶„ì„") || userSpeech.includes("?µê³„")) {
      aiReply = `?•ë‹˜, ?¬ê³  ë³´ê³ ?œë? ?•ì¸?´ë“œë¦¬ê² ?µë‹ˆ?? ë³´ê³ ???˜ì´ì§€ë¡??´ë™? ê¹Œ??`;
      action = "navigate_report";
    } else {
      aiReply = `?•ë‹˜, "${userSpeech}"???€?????ì„¸??ë§ì??´ì£¼?¸ìš”. ?í’ˆ ?±ë¡, ë§ˆì¼“ ì¡°íšŒ, ë³´ê³ ???•ì¸ ?±ì„ ?„ì??œë¦´ ???ˆìŠµ?ˆë‹¤.`;
    }

    const aiMessage: ConversationMessage = {
      id: (Date.now() + 1).toString(),
      speaker: 'ai',
      text: aiReply,
      timestamp: new Date(),
      action: action
    };
    
    setConversation(prev => [...prev, aiMessage]);
    speak(aiReply);

    if (action) {
      executeAction(action);
    }
  };

  // ???¡ì…˜ ?¤í–‰
  const executeAction = (action: string) => {
    setTimeout(() => {
      switch (action) {
        case "navigate_upload":
          speak("?í’ˆ ?±ë¡ ?˜ì´ì§€ë¡??´ë™?©ë‹ˆ??");
          navigate("/upload-voice-tts");
          break;
        case "navigate_market":
          speak("ë§ˆì¼“ ?˜ì´ì§€ë¡??´ë™?©ë‹ˆ??");
          navigate("/market");
          break;
        case "navigate_report":
          speak("?¬ê³  ë³´ê³ ???˜ì´ì§€ë¡??´ë™?©ë‹ˆ??");
          navigate("/voice-report");
          break;
        case "search_items":
          speak("?í’ˆ ê²€???˜ì´ì§€ë¡??´ë™?©ë‹ˆ??");
          navigate("/market/search-ai");
          break;
        default:
          console.log("?????†ëŠ” ?¡ì…˜:", action);
      }
    }, 2000); // ?Œì„± ì¶œë ¥ ?„ë£Œ ???¤í–‰
  };

  // ?¯ ?€??ì´ˆê¸°??  const clearConversation = () => {
    setConversation([]);
    window.speechSynthesis.cancel();
  };

  // ?¤ ?ë™ ?¸ì‚¬ë§?  useEffect(() => {
    const welcomeMessage: ConversationMessage = {
      id: "welcome",
      speaker: 'ai',
      text: "?ˆë…•?˜ì„¸???•ë‹˜! YAGO VIBE AI ?Œì„± ë¹„ì„œ?…ë‹ˆ?? ?í’ˆ ?±ë¡, ë§ˆì¼“ ì¡°íšŒ, ?¬ê³  ë¶„ì„ ??ë¬´ì—‡?´ë“  ?„ì??œë¦´ê²Œìš”. ë§ì??´ì£¼?¸ìš”!",
      timestamp: new Date()
    };
    
    setConversation([welcomeMessage]);
    speak(welcomeMessage.text);
  }, []);

  // ?“œ ?€???¤í¬ë¡??ë™ ?´ë™
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-center">?¤ YAGO VIBE AI ?Œì„± ë¹„ì„œ</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-blue-800 text-center">
          ?„ì „ ?€?”í˜• AI ?Œì„± ë¹„ì„œ - ?í’ˆ ?±ë¡, ë§ˆì¼“ ì¡°íšŒ, ?¬ê³  ë¶„ì„ê¹Œì? ëª¨ë“  ê²ƒì„ ?Œì„±?¼ë¡œ ì²˜ë¦¬?©ë‹ˆ??
        </p>
      </div>

      {/* ?íƒœ ?œì‹œ */}
      <div className="flex justify-center gap-4 mb-6">
        <div className={`px-4 py-2 rounded-lg ${isListening ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
          {isListening ? "?¤ ?£ëŠ” ì¤?.." : "?¤ ?€ê¸?ì¤?}
        </div>
        <div className={`px-4 py-2 rounded-lg ${isSpeaking ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
          {isSpeaking ? "?”Š ë§í•˜??ì¤?.." : "?”Š ?€ê¸?ì¤?}
        </div>
        <div className={`px-4 py-2 rounded-lg ${isProcessing ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
          {isProcessing ? "?§  ?ê°?˜ëŠ” ì¤?.." : "?§  ?€ê¸?ì¤?}
        </div>
      </div>

      {/* ?€???ì—­ */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 space-y-3">
          {conversation.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.speaker === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 border'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {msg.speaker === 'user' ? '?‘¤ ?•ë‹˜' : '?¤– AI ë¹„ì„œ'}
                  </span>
                  <span className="text-xs opacity-70">
                    {msg.timestamp.toLocaleTimeString('ko-KR')}
                  </span>
                </div>
                <p className="text-sm">{msg.text}</p>
                {msg.action && (
                  <div className="mt-2 text-xs opacity-70">
                    ???¡ì…˜: {msg.action}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={conversationEndRef} />
        </div>
      </div>

      {/* ì»¨íŠ¸ë¡?ë²„íŠ¼??*/}
      <div className="flex justify-center gap-4">
        <button
          onClick={startListening}
          disabled={isListening || isSpeaking || isProcessing}
          className={`px-6 py-3 rounded-lg font-semibold ${
            isListening || isSpeaking || isProcessing
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90"
          }`}
        >
          {isListening ? "?¤ ?£ëŠ” ì¤?.." : "?™ï¸??€???œì‘"}
        </button>
        
        <button
          onClick={clearConversation}
          className="px-6 py-3 rounded-lg font-semibold bg-gray-500 text-white hover:bg-gray-600"
        >
          ?—‘ï¸??€??ì´ˆê¸°??        </button>
      </div>

      {/* ?¬ìš© ?ˆë‚´ */}
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">?’¡ ?¬ìš© ?ˆë‚´</h3>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>??<strong>"???í’ˆ ?±ë¡?´ì¤˜"</strong> ???í’ˆ ?±ë¡ ?˜ì´ì§€ë¡??´ë™</li>
          <li>??<strong>"?¤ëŠ˜ ?±ë¡???í’ˆ ëª?ê°œì•¼?"</strong> ???¤ëŠ˜ ?±ë¡ ?„í™© ?ˆë‚´</li>
          <li>??<strong>"ë§ˆì¼“ ë³´ì—¬ì¤?</strong> ??ë§ˆì¼“ ?˜ì´ì§€ë¡??´ë™</li>
          <li>??<strong>"?¬ê³  ë³´ê³ ???Œë ¤ì¤?</strong> ???¬ê³  ë¶„ì„ ?˜ì´ì§€ë¡??´ë™</li>
          <li>??ëª¨ë“  ?€?”ëŠ” ?Œì„±?¼ë¡œ ì§„í–‰?˜ë©°, ?ë™?¼ë¡œ ê´€???˜ì´ì§€ë¡??´ë™?©ë‹ˆ??/li>
        </ul>
      </div>
    </div>
  );
}
