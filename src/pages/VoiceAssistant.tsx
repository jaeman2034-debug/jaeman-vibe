// === YAGO VIBE ?�전 ?�?�형 AI ?�성 비서 ===
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

  // ?�� ?�성 출력 (TTS)
  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn("??브라?��????�성 ?�성??지?�하지 ?�습?�다.");
      return;
    }

    // ?�전 ?�성 중�?
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 1.5; // 최적 ?�도 ?�정
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      setIsSpeaking(true);
      console.log("?�� AI ?�성 출력 ?�작:", text);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      console.log("?�� AI ?�성 출력 ?�료");
    };

    utterance.onerror = (e) => {
      console.error("TTS ?�류:", e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // ?���??�성 ?�식 (STT)
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      speak("??브라?��????�성 ?�식??지?�하지 ?�습?�다.");
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

    recognition.onresult = async (e: any) => {
      const userSpeech = e.results[0][0].transcript;
      console.log("?�� ?�식???�성:", userSpeech);
      
      // ?�용??메시지 추�?
      const userMessage: ConversationMessage = {
        id: Date.now().toString(),
        speaker: 'user',
        text: userSpeech,
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, userMessage]);
      setIsListening(false);
      
      // AI ?�답 처리
      await handleAIResponse(userSpeech);
    };

    recognition.onerror = (e: any) => {
      console.error("STT ?�류:", e);
      setIsListening(false);
      speak("?�성 ?�식 �??�류가 발생?�습?�다. ?�시 ?�도?�주?�요.");
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log("?�� ?�성 ?�식 종료");
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  // ?�� AI ?�답 처리
  const handleAIResponse = async (userSpeech: string) => {
    setIsProcessing(true);
    try {
      // Firestore?�서 최신 ?�이??조회
      const marketItemsRef = collection(db, "market_items");
      const q = query(marketItemsRef, orderBy("createdAt", "desc"), limit(10));
      const snapshot = await getDocs(q);
      
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // ?�늘 ?�록???�품
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayItems = items.filter(item => {
        const createdAt = item.createdAt?.toDate();
        return createdAt && createdAt >= today;
      });

      // ?�성 ?�품
      const activeItems = items.filter(item => item.status === "active");

      // AI API ?�출
      const proxyUrl = import.meta.env.VITE_OPENAI_PROXY_URL;
      
      if (!proxyUrl || proxyUrl.includes('your-n8n-server.com')) {
        // n8n ?�훅???�정?��? ?��? 경우 로컬 ?�답 ?�성
        console.log("n8n ?�훅???�정?��? ?�음, 로컬 ?�답 ?�성");
        await generateLocalResponse(userSpeech, items, todayItems, activeItems);
        return;
      }

      // n8n ?�훅 ?�출
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
        throw new Error(`n8n ?�훅 ?�류: ${response.status}`);
      }

      const data = await response.json();
      const aiReply = data.reply || "무슨 ?�인지 ?�시 말�??�주?�래??";
      const action = data.action || null;

      // AI 메시지 추�?
      const aiMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        speaker: 'ai',
        text: aiReply,
        timestamp: new Date(),
        action: action
      };
      
      setConversation(prev => [...prev, aiMessage]);
      speak(aiReply);

      // ?�션 ?�행
      if (action) {
        executeAction(action);
      }

    } catch (error) {
      console.error("AI ?�답 처리 ?�류:", error);
      const errorMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        speaker: 'ai',
        text: "AI ?�답??불러?????�습?�다. ?�시 ?�도?�주?�요.",
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, errorMessage]);
      speak("AI ?�답??불러?????�습?�다. ?�시 ?�도?�주?�요.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ?�� 로컬 ?�답 ?�성 (?�백)
  const generateLocalResponse = async (userSpeech: string, items: any[], todayItems: any[], activeItems: any[]) => {
    let aiReply = "";
    let action = null;

    // 간단???�워??기반 ?�답
    if (userSpeech.includes("?�록") || userSpeech.includes("?�리") || userSpeech.includes("???�품")) {
      aiReply = `?�님, ???�품 ?�록???��??�리겠습?�다. ?�재 ?�록???�품?� �?${items.length}개입?�다. ?�록 ?�이지�??�동?�까??`;
      action = "navigate_upload";
    } else if (userSpeech.includes("?�늘") || userSpeech.includes("?�제") || userSpeech.includes("최근")) {
      aiReply = `?�님, ?�늘 ?�록???�품?� ${todayItems.length}개입?�다. ?�체 ?�성 ?�품?� ${activeItems.length}개입?�다.`;
    } else if (userSpeech.includes("마켓") || userSpeech.includes("?�품") || userSpeech.includes("목록")) {
      aiReply = `?�님, ?�재 ?�록???�품?� �?${items.length}개입?�다. 마켓 ?�이지�??�동?�까??`;
      action = "navigate_market";
    } else if (userSpeech.includes("보고??) || userSpeech.includes("분석") || userSpeech.includes("?�계")) {
      aiReply = `?�님, ?�고 보고?��? ?�인?�드리겠?�니?? 보고???�이지�??�동?�까??`;
      action = "navigate_report";
    } else {
      aiReply = `?�님, "${userSpeech}"???�?????�세??말�??�주?�요. ?�품 ?�록, 마켓 조회, 보고???�인 ?�을 ?��??�릴 ???�습?�다.`;
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

  // ???�션 ?�행
  const executeAction = (action: string) => {
    setTimeout(() => {
      switch (action) {
        case "navigate_upload":
          speak("?�품 ?�록 ?�이지�??�동?�니??");
          navigate("/upload-voice-tts");
          break;
        case "navigate_market":
          speak("마켓 ?�이지�??�동?�니??");
          navigate("/market");
          break;
        case "navigate_report":
          speak("?�고 보고???�이지�??�동?�니??");
          navigate("/voice-report");
          break;
        case "search_items":
          speak("?�품 검???�이지�??�동?�니??");
          navigate("/market/search-ai");
          break;
        default:
          console.log("?????�는 ?�션:", action);
      }
    }, 2000); // ?�성 출력 ?�료 ???�행
  };

  // ?�� ?�??초기??  const clearConversation = () => {
    setConversation([]);
    window.speechSynthesis.cancel();
  };

  // ?�� ?�동 ?�사�?  useEffect(() => {
    const welcomeMessage: ConversationMessage = {
      id: "welcome",
      speaker: 'ai',
      text: "?�녕?�세???�님! YAGO VIBE AI ?�성 비서?�니?? ?�품 ?�록, 마켓 조회, ?�고 분석 ??무엇?�든 ?��??�릴게요. 말�??�주?�요!",
      timestamp: new Date()
    };
    
    setConversation([welcomeMessage]);
    speak(welcomeMessage.text);
  }, []);

  // ?�� ?�???�크�??�동 ?�동
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-center">?�� YAGO VIBE AI ?�성 비서</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-blue-800 text-center">
          ?�전 ?�?�형 AI ?�성 비서 - ?�품 ?�록, 마켓 조회, ?�고 분석까�? 모든 것을 ?�성?�로 처리?�니??
        </p>
      </div>

      {/* ?�태 ?�시 */}
      <div className="flex justify-center gap-4 mb-6">
        <div className={`px-4 py-2 rounded-lg ${isListening ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
          {isListening ? "?�� ?�는 �?.." : "?�� ?��?�?}
        </div>
        <div className={`px-4 py-2 rounded-lg ${isSpeaking ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
          {isSpeaking ? "?�� 말하??�?.." : "?�� ?��?�?}
        </div>
        <div className={`px-4 py-2 rounded-lg ${isProcessing ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
          {isProcessing ? "?�� ?�각?�는 �?.." : "?�� ?��?�?}
        </div>
      </div>

      {/* ?�???�역 */}
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
                    {msg.speaker === 'user' ? '?�� ?�님' : '?�� AI 비서'}
                  </span>
                  <span className="text-xs opacity-70">
                    {msg.timestamp.toLocaleTimeString('ko-KR')}
                  </span>
                </div>
                <p className="text-sm">{msg.text}</p>
                {msg.action && (
                  <div className="mt-2 text-xs opacity-70">
                    ???�션: {msg.action}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={conversationEndRef} />
        </div>
      </div>

      {/* 컨트�?버튼??*/}
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
          {isListening ? "?�� ?�는 �?.." : "?���??�???�작"}
        </button>
        
        <button
          onClick={clearConversation}
          className="px-6 py-3 rounded-lg font-semibold bg-gray-500 text-white hover:bg-gray-600"
        >
          ?���??�??초기??        </button>
      </div>

      {/* ?�용 ?�내 */}
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">?�� ?�용 ?�내</h3>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>??<strong>"???�품 ?�록?�줘"</strong> ???�품 ?�록 ?�이지�??�동</li>
          <li>??<strong>"?�늘 ?�록???�품 �?개야?"</strong> ???�늘 ?�록 ?�황 ?�내</li>
          <li>??<strong>"마켓 보여�?</strong> ??마켓 ?�이지�??�동</li>
          <li>??<strong>"?�고 보고???�려�?</strong> ???�고 분석 ?�이지�??�동</li>
          <li>??모든 ?�?�는 ?�성?�로 진행?�며, ?�동?�로 관???�이지�??�동?�니??/li>
        </ul>
      </div>
    </div>
  );
}
