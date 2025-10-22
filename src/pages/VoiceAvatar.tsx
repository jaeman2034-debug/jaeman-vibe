// === YAGO VIBE AI ?�성 ?�바?� ===
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from "firebase/firestore";

const AI_API_URL = import.meta.env.VITE_OPENAI_PROXY_URL;

interface ConversationMessage {
  id: string;
  speaker: 'user' | 'ai';
  text: string;
  timestamp: Date;
  emotion?: string;
}

export default function VoiceAvatar() {
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string>("neutral");
  const [avatarScale, setAvatarScale] = useState(1);
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
      setAvatarScale(1.1);
      console.log("?�� AI ?�바?� ?�성 출력 ?�작:", text);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setAvatarScale(1);
      console.log("?�� AI ?�바?� ?�성 출력 ?�료");
    };

    utterance.onerror = (e) => {
      console.error("TTS ?�류:", e);
      setIsSpeaking(false);
      setAvatarScale(1);
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
      console.log("?�� AI ?�바?� ?�성 ?�식 ?�작");
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
      console.log("?�� AI ?�바?� ?�성 ?�식 종료");
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
          mode: "voice-avatar"
        }),
      });

      if (!response.ok) {
        throw new Error(`n8n ?�훅 ?�류: ${response.status}`);
      }

      const data = await response.json();
      const aiReply = data.reply || "무슨 ?�인지 ?�시 말�??�주?�래??";
      const emotion = data.emotion || "neutral";

      // 감정 ?�정
      setCurrentEmotion(emotion);

      // AI 메시지 추�?
      const aiMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        speaker: 'ai',
        text: aiReply,
        timestamp: new Date(),
        emotion: emotion
      };
      
      setConversation(prev => [...prev, aiMessage]);
      speak(aiReply);

      // ?�??로그 ?�??      await saveConversationLog(userMessage, aiMessage);

    } catch (error) {
      console.error("AI ?�답 처리 ?�류:", error);
      const errorMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        speaker: 'ai',
        text: "AI ?�답??불러?????�습?�다. ?�시 ?�도?�주?�요.",
        timestamp: new Date(),
        emotion: "sad"
      };
      
      setConversation(prev => [...prev, errorMessage]);
      setCurrentEmotion("sad");
      speak("AI ?�답??불러?????�습?�다. ?�시 ?�도?�주?�요.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ?�� 로컬 ?�답 ?�성 (?�백)
  const generateLocalResponse = async (userSpeech: string, items: any[], todayItems: any[], activeItems: any[]) => {
    let aiReply = "";
    let emotion = "neutral";

    // 간단???�워??기반 ?�답 �?감정 분석
    if (userSpeech.includes("?�록") || userSpeech.includes("?�리") || userSpeech.includes("???�품")) {
      aiReply = `?�님, ???�품 ?�록???��??�리겠습?�다! ?�재 ?�록???�품?� �?${items.length}개입?�다. ?�록 ?�이지�??�동?�까??`;
      emotion = "happy";
    } else if (userSpeech.includes("?�늘") || userSpeech.includes("?�제") || userSpeech.includes("최근")) {
      aiReply = `?�님, ?�늘 ?�록???�품?� ${todayItems.length}개입?�다. ?�체 ?�성 ?�품?� ${activeItems.length}개입?�다.`;
      emotion = "neutral";
    } else if (userSpeech.includes("마켓") || userSpeech.includes("?�품") || userSpeech.includes("목록")) {
      aiReply = `?�님, ?�재 ?�록???�품?� �?${items.length}개입?�다. 마켓 ?�이지�??�동?�까??`;
      emotion = "happy";
    } else if (userSpeech.includes("보고??) || userSpeech.includes("분석") || userSpeech.includes("?�계")) {
      aiReply = `?�님, ?�고 보고?��? ?�인?�드리겠?�니?? 보고???�이지�??�동?�까??`;
      emotion = "excited";
    } else if (userSpeech.includes("고마??) || userSpeech.includes("감사")) {
      aiReply = `천만?�요 ?�님! ?�제?��? ?��??�릴게요!`;
      emotion = "happy";
    } else if (userSpeech.includes("?�녕") || userSpeech.includes("?�이")) {
      aiReply = `?�녕?�세???�님! YAGO VIBE AI ?�바?�?�니?? 무엇???��??�릴까요?`;
      emotion = "happy";
    } else {
      aiReply = `?�님, "${userSpeech}"???�?????�세??말�??�주?�요. ?�품 ?�록, 마켓 조회, 보고???�인 ?�을 ?��??�릴 ???�습?�다!`;
      emotion = "neutral";
    }

    setCurrentEmotion(emotion);

    const aiMessage: ConversationMessage = {
      id: (Date.now() + 1).toString(),
      speaker: 'ai',
      text: aiReply,
      timestamp: new Date(),
      emotion: emotion
    };
    
    setConversation(prev => [...prev, aiMessage]);
    speak(aiReply);
  };

  // ?�� ?�??로그 ?�??  const saveConversationLog = async (userMessage: ConversationMessage, aiMessage: ConversationMessage) => {
    try {
      await addDoc(collection(db, "conversation_logs"), {
        userMessage: userMessage.text,
        aiMessage: aiMessage.text,
        emotion: aiMessage.emotion || "neutral",
        timestamp: serverTimestamp(),
        sessionId: Date.now().toString()
      });
    } catch (error) {
      console.error("?�??로그 ?�???�패:", error);
    }
  };

  // ?�� ?�??초기??  const clearConversation = () => {
    setConversation([]);
    setCurrentEmotion("neutral");
    window.speechSynthesis.cancel();
  };

  // ?�� ?�동 ?�사�?  useEffect(() => {
    const welcomeMessage: ConversationMessage = {
      id: "welcome",
      speaker: 'ai',
      text: "?�녕?�세???�님! YAGO VIBE AI ?�바?�?�니?? ?�품 ?�록, 마켓 조회, ?�고 분석 ??무엇?�든 ?��??�릴게요. 말�??�주?�요!",
      timestamp: new Date(),
      emotion: "happy"
    };
    
    setConversation([welcomeMessage]);
    setCurrentEmotion("happy");
    speak(welcomeMessage.text);
  }, []);

  // ?�� ?�???�크�??�동 ?�동
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // ?��?�♂�?3D AI ?�바?� 컴포?�트
  const Avatar = () => {
    const meshRef = useRef<any>();

    // 감정???�른 ?�상 변??    const getEmotionColor = () => {
      switch (currentEmotion) {
        case "happy": return "#fbbf24"; // ?��???        case "excited": return "#f97316"; // 주황??        case "sad": return "#6b7280"; // ?�색
        case "neutral": return "#60a5fa"; // ?��???        default: return "#60a5fa";
      }
    };

    // 말할 ????모양 ?�니메이??    useEffect(() => {
      if (meshRef.current) {
        if (isSpeaking) {
          meshRef.current.scale.y = 1.2;
          meshRef.current.scale.x = 0.8;
        } else {
          meshRef.current.scale.y = 1;
          meshRef.current.scale.x = 1;
        }
      }
    }, [isSpeaking]);

    return (
      <group>
        {/* 메인 ?�바?� */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial 
            color={getEmotionColor()} 
            emissive={isSpeaking ? "#ffffff" : "#000000"}
            emissiveIntensity={isSpeaking ? 0.2 : 0}
          />
        </mesh>
        
        {/* ??*/}
        <mesh position={[-0.3, 0.2, 0.9]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh position={[0.3, 0.2, 0.9]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        
        {/* ??*/}
        <mesh position={[0, -0.3, 0.9]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        
        {/* 말풍??*/}
        {isSpeaking && (
          <Text
            position={[0, 2, 0]}
            fontSize={0.3}
            color="#000000"
            anchorX="center"
            anchorY="middle"
          >
            ?��
          </Text>
        )}
      </group>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-center">?�� YAGO VIBE AI ?�성 ?�바?�</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-blue-800 text-center">
          AI ?�바?�가 ?�시간으�?말하�? ?�정??짓고, 반응?�는 ?�전 ?�?�형 ?�스?�입?�다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 3D ?�바?� ?�역 */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <Canvas style={{ width: 400, height: 400 }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[2, 2, 2]} intensity={0.8} />
              <pointLight position={[-2, -2, -2]} intensity={0.5} />
              <OrbitControls enableZoom={false} enablePan={false} />
              <Avatar />
            </Canvas>
            
            {/* ?�태 ?�시 */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isListening ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {isListening ? "?�� ?�는 �?.." : "?�� ?��?�?}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isSpeaking ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {isSpeaking ? "?�� 말하??�?.." : "?�� ?��?�?}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isProcessing ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {isProcessing ? "?�� ?�각?�는 �?.." : "?�� ?��?�?}
              </div>
            </div>
          </div>

          {/* 컨트�?버튼??*/}
          <div className="flex gap-4 mt-6">
            <motion.button
              onClick={startListening}
              disabled={isListening || isSpeaking || isProcessing}
              className={`px-6 py-3 rounded-lg font-semibold ${
                isListening || isSpeaking || isProcessing
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isListening ? "?�� ?�는 �?.." : "?���??�???�작"}
            </motion.button>
            
            <motion.button
              onClick={clearConversation}
              className="px-6 py-3 rounded-lg font-semibold bg-gray-500 text-white hover:bg-gray-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ?���??�??초기??            </motion.button>
          </div>
        </div>

        {/* ?�???�역 */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-4">?�� ?�??기록</h2>
          <div className="h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 space-y-3">
            {conversation.map((msg) => (
              <motion.div
                key={msg.id}
                className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
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
                      {msg.speaker === 'user' ? '?�� ?�님' : '?�� AI ?�바?�'}
                    </span>
                    <span className="text-xs opacity-70">
                      {msg.timestamp.toLocaleTimeString('ko-KR')}
                    </span>
                    {msg.emotion && (
                      <span className="text-xs opacity-70">
                        {msg.emotion === 'happy' ? '?��' : 
                         msg.emotion === 'excited' ? '?��' : 
                         msg.emotion === 'sad' ? '?��' : '?��'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </motion.div>
            ))}
            <div ref={conversationEndRef} />
          </div>
        </div>
      </div>

      {/* ?�용 ?�내 */}
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">?�� AI ?�바?� ?�용 ?�내</h3>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>??<strong>?�정 변??</strong> AI??감정???�라 ?�바?� ?�상�??�정??변?�니??/li>
          <li>??<strong>??모양 ?�기??</strong> AI가 말할 ???�바?�???�이 ?�직입?�다</li>
          <li>??<strong>?�시�?반응:</strong> ?�성 ?�식, 처리, 출력 ?�태�??�시간으�??�시?�니??/li>
          <li>??<strong>?�??로그:</strong> 모든 ?�?��? Firestore???�동?�로 ?�?�됩?�다</li>
          <li>??<strong>감정 분석:</strong> AI가 ?�용?�의 말에 ?�라 ?�절??감정?�로 반응?�니??/li>
        </ul>
      </div>
    </div>
  );
}
