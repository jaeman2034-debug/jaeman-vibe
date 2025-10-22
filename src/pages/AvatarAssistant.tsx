// === YAGO VIBE 3D ?¤ì‹œê°?AI ?„ë°”?€ ë¹„ì„œ ===
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Text } from "@react-three/drei";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from "firebase/firestore";

const AI_API_URL = import.meta.env.VITE_OPENAI_PROXY_URL;

interface ConversationMessage {
  id: string;
  speaker: 'user' | 'ai';
  text: string;
  timestamp: Date;
  emotion?: string;
  intent?: string;
}

// ?§?â™‚ï¸?3D ?„ë°”?€ ëª¨ë¸ ì»´í¬?ŒíŠ¸
function AvatarModel({ speaking, emotion }: { speaking: boolean; emotion: string }) {
  const meshRef = useRef<any>();
  const mouthRef = useRef<any>();
  const eyeRef = useRef<any>();

  // ê°ì •???°ë¥¸ ?‰ìƒ ë³€??  const getEmotionColor = () => {
    switch (emotion) {
      case "happy": return "#fbbf24"; // ?¸ë???      case "excited": return "#f97316"; // ì£¼í™©??      case "sad": return "#6b7280"; // ?Œìƒ‰
      case "neutral": return "#60a5fa"; // ?Œë???      default: return "#60a5fa";
    }
  };

  // ?¤ì‹œê°?? ë‹ˆë©”ì´??ì²˜ë¦¬
  useFrame((state) => {
    if (meshRef.current) {
      // ë§í•  ????ëª¨ì–‘ ?™ê¸°??      if (speaking && mouthRef.current) {
        const time = state.clock.getElapsedTime();
        mouthRef.current.scale.y = 1 + Math.sin(time * 10) * 0.3;
        mouthRef.current.scale.x = 0.8 + Math.sin(time * 8) * 0.2;
      } else if (mouthRef.current) {
        mouthRef.current.scale.y = 1;
        mouthRef.current.scale.x = 1;
      }

      // ê°ì •???°ë¥¸ ?„ì²´ ?‰ìƒ ë³€??      meshRef.current.material.color.setHex(getEmotionColor().replace('#', '0x'));

      // ë§í•  ??ë°œê´‘ ?¨ê³¼
      if (speaking) {
        meshRef.current.material.emissive.setHex(0xffffff);
        meshRef.current.material.emissiveIntensity = 0.2;
      } else {
        meshRef.current.material.emissive.setHex(0x000000);
        meshRef.current.material.emissiveIntensity = 0;
      }

      // ê°ì •???°ë¥¸ ë¯¸ì„¸???€ì§ì„
      if (emotion === "excited") {
        meshRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 2) * 0.1;
      } else if (emotion === "sad") {
        meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
      }
    }
  });

  return (
    <group>
      {/* ë©”ì¸ ?„ë°”?€ ëª¸ì²´ */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          color={getEmotionColor()} 
          emissive={speaking ? "#ffffff" : "#000000"}
          emissiveIntensity={speaking ? 0.2 : 0}
        />
      </mesh>
      
      {/* ??*/}
      <mesh ref={eyeRef} position={[-0.3, 0.2, 0.9]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.3, 0.2, 0.9]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      
      {/* ??(?™ê¸°??ê°€?? */}
      <mesh ref={mouthRef} position={[0, -0.3, 0.9]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      
      {/* ë§í’??*/}
      {speaking && (
        <Text
          position={[0, 2, 0]}
          fontSize={0.3}
          color="#000000"
          anchorX="center"
          anchorY="middle"
        >
          ?’¬
        </Text>
      )}

      {/* ê°ì • ?œì‹œ */}
      {emotion && (
        <Text
          position={[0, -1.5, 0]}
          fontSize={0.2}
          color="#666666"
          anchorX="center"
          anchorY="middle"
        >
          {emotion === 'happy' ? '?˜Š' : 
           emotion === 'excited' ? '?¤©' : 
           emotion === 'sad' ? '?˜¢' : '?˜'}
        </Text>
      )}
    </group>
  );
}

export default function AvatarAssistant() {
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string>("neutral");
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
      console.log("?”Š AI ?„ë°”?€ ?Œì„± ì¶œë ¥ ?œì‘:", text);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      console.log("?”Š AI ?„ë°”?€ ?Œì„± ì¶œë ¥ ?„ë£Œ");
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
      console.log("?¤ AI ?„ë°”?€ ?Œì„± ?¸ì‹ ?œì‘");
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
      console.log("?¤ AI ?„ë°”?€ ?Œì„± ?¸ì‹ ì¢…ë£Œ");
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
          mode: "avatar-assistant"
        }),
      });

      if (!response.ok) {
        throw new Error(`n8n ?¹í›… ?¤ë¥˜: ${response.status}`);
      }

      const data = await response.json();
      const aiReply = data.reply || "ë¬´ìŠ¨ ?»ì¸ì§€ ?¤ì‹œ ë§ì??´ì£¼?¤ë˜??";
      const emotion = data.emotion || "neutral";
      const intent = data.intent || "";

      // ê°ì • ?¤ì •
      setCurrentEmotion(emotion);

      // AI ë©”ì‹œì§€ ì¶”ê?
      const aiMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        speaker: 'ai',
        text: aiReply,
        timestamp: new Date(),
        emotion: emotion,
        intent: intent
      };
      
      setConversation(prev => [...prev, aiMessage]);
      speak(aiReply);

      // ?€??ë¡œê·¸ ?€??      await saveConversationLog(userMessage, aiMessage);

    } catch (error) {
      console.error("AI ?‘ë‹µ ì²˜ë¦¬ ?¤ë¥˜:", error);
      const errorMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        speaker: 'ai',
        text: "AI ?‘ë‹µ??ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤. ?¤ì‹œ ?œë„?´ì£¼?¸ìš”.",
        timestamp: new Date(),
        emotion: "sad"
      };
      
      setConversation(prev => [...prev, errorMessage]);
      setCurrentEmotion("sad");
      speak("AI ?‘ë‹µ??ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤. ?¤ì‹œ ?œë„?´ì£¼?¸ìš”.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ?“ ë¡œì»¬ ?‘ë‹µ ?ì„± (?´ë°±)
  const generateLocalResponse = async (userSpeech: string, items: any[], todayItems: any[], activeItems: any[]) => {
    let aiReply = "";
    let emotion = "neutral";
    let intent = "";

    // ê°„ë‹¨???¤ì›Œ??ê¸°ë°˜ ?‘ë‹µ ë°?ê°ì • ë¶„ì„
    if (userSpeech.includes("?±ë¡") || userSpeech.includes("?¬ë¦¬") || userSpeech.includes("???í’ˆ")) {
      aiReply = `?•ë‹˜, ???í’ˆ ?±ë¡???„ì??œë¦¬ê² ìŠµ?ˆë‹¤! ?„ì¬ ?±ë¡???í’ˆ?€ ì´?${items.length}ê°œì…?ˆë‹¤. ?±ë¡ ?˜ì´ì§€ë¡??´ë™? ê¹Œ??`;
      emotion = "happy";
      intent = "navigate_upload";
    } else if (userSpeech.includes("?¤ëŠ˜") || userSpeech.includes("?´ì œ") || userSpeech.includes("ìµœê·¼")) {
      aiReply = `?•ë‹˜, ?¤ëŠ˜ ?±ë¡???í’ˆ?€ ${todayItems.length}ê°œì…?ˆë‹¤. ?„ì²´ ?œì„± ?í’ˆ?€ ${activeItems.length}ê°œì…?ˆë‹¤.`;
      emotion = "neutral";
      intent = "show_stats";
    } else if (userSpeech.includes("ë§ˆì¼“") || userSpeech.includes("?í’ˆ") || userSpeech.includes("ëª©ë¡")) {
      aiReply = `?•ë‹˜, ?„ì¬ ?±ë¡???í’ˆ?€ ì´?${items.length}ê°œì…?ˆë‹¤. ë§ˆì¼“ ?˜ì´ì§€ë¡??´ë™? ê¹Œ??`;
      emotion = "happy";
      intent = "navigate_market";
    } else if (userSpeech.includes("ë³´ê³ ??) || userSpeech.includes("ë¶„ì„") || userSpeech.includes("?µê³„")) {
      aiReply = `?•ë‹˜, ?¬ê³  ë³´ê³ ?œë? ?•ì¸?´ë“œë¦¬ê² ?µë‹ˆ?? ë³´ê³ ???˜ì´ì§€ë¡??´ë™? ê¹Œ??`;
      emotion = "excited";
      intent = "navigate_report";
    } else if (userSpeech.includes("ê³ ë§ˆ??) || userSpeech.includes("ê°ì‚¬")) {
      aiReply = `ì²œë§Œ?ìš” ?•ë‹˜! ?¸ì œ? ì? ?„ì??œë¦´ê²Œìš”!`;
      emotion = "happy";
      intent = "gratitude";
    } else if (userSpeech.includes("?ˆë…•") || userSpeech.includes("?˜ì´")) {
      aiReply = `?ˆë…•?˜ì„¸???•ë‹˜! YAGO VIBE AI ?„ë°”?€ ë¹„ì„œ?…ë‹ˆ?? ë¬´ì—‡???„ì??œë¦´ê¹Œìš”?`;
      emotion = "happy";
      intent = "greeting";
    } else {
      aiReply = `?•ë‹˜, "${userSpeech}"???€?????ì„¸??ë§ì??´ì£¼?¸ìš”. ?í’ˆ ?±ë¡, ë§ˆì¼“ ì¡°íšŒ, ë³´ê³ ???•ì¸ ?±ì„ ?„ì??œë¦´ ???ˆìŠµ?ˆë‹¤!`;
      emotion = "neutral";
      intent = "clarification";
    }

    setCurrentEmotion(emotion);

    const aiMessage: ConversationMessage = {
      id: (Date.now() + 1).toString(),
      speaker: 'ai',
      text: aiReply,
      timestamp: new Date(),
      emotion: emotion,
      intent: intent
    };
    
    setConversation(prev => [...prev, aiMessage]);
    speak(aiReply);
  };

  // ?’¾ ?€??ë¡œê·¸ ?€??  const saveConversationLog = async (userMessage: ConversationMessage, aiMessage: ConversationMessage) => {
    try {
      await addDoc(collection(db, "avatar_conversation_logs"), {
        userMessage: userMessage.text,
        aiMessage: aiMessage.text,
        emotion: aiMessage.emotion || "neutral",
        intent: aiMessage.intent || "",
        timestamp: serverTimestamp(),
        sessionId: Date.now().toString()
      });
    } catch (error) {
      console.error("?€??ë¡œê·¸ ?€???¤íŒ¨:", error);
    }
  };

  // ?¯ ?€??ì´ˆê¸°??  const clearConversation = () => {
    setConversation([]);
    setCurrentEmotion("neutral");
    window.speechSynthesis.cancel();
  };

  // ?¤ ?ë™ ?¸ì‚¬ë§?  useEffect(() => {
    const welcomeMessage: ConversationMessage = {
      id: "welcome",
      speaker: 'ai',
      text: "?ˆë…•?˜ì„¸???•ë‹˜! YAGO VIBE 3D AI ?„ë°”?€ ë¹„ì„œ?…ë‹ˆ?? ?í’ˆ ?±ë¡, ë§ˆì¼“ ì¡°íšŒ, ?¬ê³  ë¶„ì„ ??ë¬´ì—‡?´ë“  ?„ì??œë¦´ê²Œìš”. ë§ì??´ì£¼?¸ìš”!",
      timestamp: new Date(),
      emotion: "happy"
    };
    
    setConversation([welcomeMessage]);
    setCurrentEmotion("happy");
    speak(welcomeMessage.text);
  }, []);

  // ?“œ ?€???¤í¬ë¡??ë™ ?´ë™
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-center">?§?â™‚ï¸?YAGO VIBE 3D ?¤ì‹œê°?AI ?„ë°”?€ ë¹„ì„œ</h1>
      
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <p className="text-purple-800 text-center font-medium">
          AI ?„ë°”?€ê°€ ?¤ì œ ?¬ëŒì²˜ëŸ¼ ë§í•˜ê³? ?ƒê³ , ?œì •??ì§€?¼ë©°, ?…ëª¨?‘ì´ ?Œì„±??ë§ì¶° ?€ì§ì´???„ì „ ?€?”í˜• ?œìŠ¤?œì…?ˆë‹¤.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 3D ?„ë°”?€ ?ì—­ */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <Canvas style={{ width: 500, height: 500 }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[2, 2, 2]} intensity={0.8} />
              <pointLight position={[-2, -2, -2]} intensity={0.5} />
              <OrbitControls enableZoom={false} enablePan={false} />
              <AvatarModel speaking={isSpeaking} emotion={currentEmotion} />
            </Canvas>
            
            {/* ?íƒœ ?œì‹œ */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isListening ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {isListening ? "?¤ ?£ëŠ” ì¤?.." : "?¤ ?€ê¸?ì¤?}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isSpeaking ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {isSpeaking ? "?”Š ë§í•˜??ì¤?.." : "?”Š ?€ê¸?ì¤?}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isProcessing ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {isProcessing ? "?§  ?ê°?˜ëŠ” ì¤?.." : "?§  ?€ê¸?ì¤?}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentEmotion === 'happy' ? 'bg-yellow-500 text-white' :
                currentEmotion === 'excited' ? 'bg-orange-500 text-white' :
                currentEmotion === 'sad' ? 'bg-gray-500 text-white' : 'bg-blue-500 text-white'
              }`}>
                {currentEmotion === 'happy' ? '?˜Š ê¸°ì¨' :
                 currentEmotion === 'excited' ? '?¤© ?¥ë¶„' :
                 currentEmotion === 'sad' ? '?˜¢ ?¬í””' : '?˜ ì¤‘ë¦½'}
              </div>
            </div>
          </div>

          {/* ì»¨íŠ¸ë¡?ë²„íŠ¼??*/}
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
              {isListening ? "?¤ ?£ëŠ” ì¤?.." : "?™ï¸??€???œì‘"}
            </motion.button>
            
            <motion.button
              onClick={clearConversation}
              className="px-6 py-3 rounded-lg font-semibold bg-gray-500 text-white hover:bg-gray-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ?—‘ï¸??€??ì´ˆê¸°??            </motion.button>
          </div>
        </div>

        {/* ?€???ì—­ */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-4">?’¬ ?¤ì‹œê°??€??/h2>
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
                      {msg.speaker === 'user' ? '?‘¤ ?•ë‹˜' : '?§?â™‚ï¸?AI ?„ë°”?€'}
                    </span>
                    <span className="text-xs opacity-70">
                      {msg.timestamp.toLocaleTimeString('ko-KR')}
                    </span>
                    {msg.emotion && (
                      <span className="text-xs opacity-70">
                        {msg.emotion === 'happy' ? '?˜Š' : 
                         msg.emotion === 'excited' ? '?¤©' : 
                         msg.emotion === 'sad' ? '?˜¢' : '?˜'}
                      </span>
                    )}
                    {msg.intent && (
                      <span className="text-xs opacity-70 bg-gray-200 px-1 rounded">
                        {msg.intent}
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

      {/* ?¬ìš© ?ˆë‚´ */}
      <div className="mt-8 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">?’¡ 3D AI ?„ë°”?€ ë¹„ì„œ ?¬ìš© ?ˆë‚´</h3>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>??<strong>?¤ì‹œê°??œì • ë³€??</strong> AI??ê°ì •???°ë¼ ?„ë°”?€ ?‰ìƒê³??œì •???¤ì‹œê°„ìœ¼ë¡?ë³€?©ë‹ˆ??/li>
          <li>??<strong>??ëª¨ì–‘ ?™ê¸°??</strong> AIê°€ ë§í•  ???„ë°”?€???…ì´ ?Œì„±??ë§ì¶° ?¤ì‹œê°„ìœ¼ë¡??€ì§ì…?ˆë‹¤</li>
          <li>??<strong>ê°ì • ë¶„ì„:</strong> ?¬ìš©?ì˜ ë§ì— ?°ë¼ AIê°€ ?ì ˆ??ê°ì •?¼ë¡œ ë°˜ì‘?©ë‹ˆ??/li>
          <li>??<strong>?˜ë„ ?¸ì‹:</strong> ?¬ìš©?ì˜ ?”ì²­??ë¶„ì„?˜ì—¬ ?ì ˆ???¡ì…˜???œì•ˆ?©ë‹ˆ??/li>
          <li>??<strong>?€??ë¡œê·¸:</strong> ëª¨ë“  ?€?”ê? Firestore???ë™?¼ë¡œ ?€?¥ë©?ˆë‹¤</li>
          <li>??<strong>?íƒœ ?œì‹œ:</strong> ?Œì„± ?¸ì‹, ì²˜ë¦¬, ì¶œë ¥ ?íƒœë¥??¤ì‹œê°„ìœ¼ë¡??œì‹œ?©ë‹ˆ??/li>
        </ul>
      </div>
    </div>
  );
}
