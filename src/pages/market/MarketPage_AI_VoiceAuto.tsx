import React, { useState, useRef, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase";

type MarketItem = {
  id: string;
  title: string;
  price?: number | null;
  category?: string;
  desc?: string;
  status?: string;
  voiceInput?: string;
  aiProcessed?: boolean;
  createdAt?: any;
};

const MarketPage_AI_VoiceAuto: React.FC = () => {

  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  // ?¤ì‹œê°??°ì´??êµ¬ë…
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "marketItems"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr: MarketItem[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
      setItems(arr);
      setLoading(false);
    }, (error) => {
      console.error("Firestore subscription error:", error);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  // OpenAI Whisper API ?¸ì¶œ
  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error("OpenAI API ?¤ê? ?¤ì •?˜ì? ?Šì•˜?µë‹ˆ?? .env ?Œì¼??VITE_OPENAI_API_KEYë¥?ì¶”ê??˜ì„¸??");
    }

    const formData = new FormData();
    formData.append("file", audioBlob, "voice.webm");
    formData.append("model", "whisper-1");
    formData.append("language", "ko"); // ?œêµ­??ì§€??
    try {
      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API ?¤ë¥˜: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.text || "";
    } catch (error) {
      console.error("Whisper API ?¸ì¶œ ?¤íŒ¨:", error);
      throw error;
    }
  };

  // Cloud Function ?¸ì¶œ
  const callAiVoiceAuto = async (transcript: string): Promise<{ success: boolean; data?: any; docId?: string; error?: string }> => {
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const functionUrl = `https://asia-northeast3-${projectId}.cloudfunctions.net/aiVoiceAuto`;
    
    try {
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return { success: true, data: data.data, docId: data.docId };
    } catch (error) {
      console.error("AI Voice Auto Cloud Function ?¸ì¶œ ?¤íŒ¨:", error);
      return { success: false, error: String(error) };
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunks.current, { type: "audio/webm" });
          chunks.current = [];

          // OpenAI Whisper API ?¸ì¶œ
          setStatus("?¤ ?Œì„± ?¸ì‹ ì¤?..");
          const text = await transcribeAudio(blob);
          setTranscript(text);
          
          if (!text.trim()) {
            setStatus("???Œì„±???¸ì‹?????†ìŠµ?ˆë‹¤. ?¤ì‹œ ?œë„?´ì£¼?¸ìš”.");
            return;
          }

          setStatus("?§  AI ë¶„ì„ ì¤?..");
          const result = await callAiVoiceAuto(text);
          
          if (result.success) {
            setStatus("???Œì„± ê¸°ë°˜ ?ë™ ?±ë¡ ?„ë£Œ!");
            console.log("?±ë¡???í’ˆ:", result.data);
          } else {
            setStatus(`???±ë¡ ?¤íŒ¨: ${result.error}`);
          }
        } catch (error) {
          console.error("?Œì„± ì²˜ë¦¬ ?¤ë¥˜:", error);
          setStatus(`???¤ë¥˜ ë°œìƒ: ${String(error)}`);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setStatus("?™ï¸??¹ìŒ ì¤?.. (ë§ì??´ì£¼?¸ìš”)");
    } catch (error) {
      console.error("ë§ˆì´???‘ê·¼ ?¤ë¥˜:", error);
      setStatus("??ë§ˆì´???‘ê·¼??ê±°ë??˜ì—ˆ?µë‹ˆ?? ë¸Œë¼?°ì? ?¤ì •???•ì¸?´ì£¼?¸ìš”.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setStatus("?”„ ?Œì„± ì²˜ë¦¬ ì¤?..");
    }
  };

  // ?µê³„ ?•ë³´
  const stats = {
    total: items.length,
    voiceProcessed: items.filter(i => i.voiceInput).length,
    aiProcessed: items.filter(i => i.aiProcessed).length
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold mb-2">?™ï¸??Œì„± ê¸°ë°˜ ?ë™ ?±ë¡</h1>
        <p className="text-slate-600 mb-4">ë§ë¡œ ?í’ˆ???±ë¡?˜ì„¸?? AIê°€ ?ë™?¼ë¡œ ë¶„ì„?˜ê³  ë¶„ë¥˜?©ë‹ˆ??</p>
        
        {/* ?µê³„ ?•ë³´ */}
        <div className="flex justify-center gap-4 text-sm text-slate-600">
          <span>?“¦ ì´??í’ˆ: {stats.total}ê°?/span>
          <span>?™ï¸??Œì„± ?±ë¡: {stats.voiceProcessed}ê°?/span>
          <span>?§  AI ì²˜ë¦¬: {stats.aiProcessed}ê°?/span>
        </div>
      </div>

      {/* ?Œì„± ?¹ìŒ ?¹ì…˜ */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8">
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">?¤ ?Œì„±?¼ë¡œ ?í’ˆ ?±ë¡</h2>
            <p className="text-slate-600 text-sm mb-4">
              ?? "?˜ì´??ì¶•êµ¬??ë§Œì›???”ì•„??, "?„ë””?¤ìŠ¤ ? ë‹ˆ??5ë§Œì›"
            </p>
          </div>
          
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`px-8 py-4 rounded-2xl text-white text-xl font-bold transition-all transform hover:scale-105 ${
              recording 
                ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            }`}
          >
            {recording ? "???¹ìŒ ì¢…ë£Œ" : "???¹ìŒ ?œì‘"}
          </button>
          
          {status && (
            <div className="text-center">
              <div className="text-sm text-slate-700 bg-white px-4 py-2 rounded-xl shadow-sm">
                {status}
              </div>
            </div>
          )}
          
          {transcript && (
            <div className="w-full max-w-md">
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                <div className="text-sm font-semibold text-slate-700 mb-2">?¯ ?¸ì‹???´ìš©:</div>
                <div className="text-slate-600">{transcript}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ?¬ìš© ê°€?´ë“œ */}
      <div className="bg-slate-50 rounded-xl p-4 mb-6">
        <h3 className="font-bold text-slate-800 mb-2">?’¡ ?¬ìš© ê°€?´ë“œ</h3>
        <div className="text-sm text-slate-600 space-y-1">
          <div>??"ë¸Œëœ?œëª… + ?í’ˆëª?+ ê°€ê²? ?•íƒœë¡?ë§í•´ì£¼ì„¸??/div>
          <div>???ˆì‹œ: "?˜ì´??ì¶•êµ¬??ë§Œì›???”ì•„??, "?„ë””?¤ìŠ¤ ? ë‹ˆ??5ë§Œì›"</div>
          <div>??AIê°€ ?ë™?¼ë¡œ ì¹´í…Œê³ ë¦¬ ë¶„ë¥˜, ê°€ê²?ì¶”ì¶œ, ?¤ëª… ?ì„±?©ë‹ˆ??/div>
        </div>
      </div>

      {/* ?±ë¡???í’ˆ ëª©ë¡ */}
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-4">?“¦ ?±ë¡???í’ˆ ëª©ë¡</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="text-slate-500">?“¦ ?í’ˆ ëª©ë¡??ë¶ˆëŸ¬?¤ëŠ” ì¤?..</div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-slate-500">?“¦ ?±ë¡???í’ˆ???†ìŠµ?ˆë‹¤. ?Œì„±?¼ë¡œ ?í’ˆ???±ë¡?´ë³´?¸ìš”!</div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border p-4 bg-white hover:shadow-md transition-shadow"
              >
                <div className="space-y-2">
                  <div className="font-semibold text-lg">{item.title}</div>
                  
                  <div className="text-sm text-slate-600">
                    ?“‚ {item.category || "ê¸°í?"}
                    {item.price && ` | ?’° ${item.price.toLocaleString()}??}
                  </div>
                  
                  {item.desc && (
                    <div className="text-sm text-slate-700">{item.desc}</div>
                  )}
                  
                  {item.voiceInput && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      ?™ï¸?"{item.voiceInput}"
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {item.aiProcessed && <span className="bg-green-100 text-green-700 px-2 py-1 rounded">?§  AI</span>}
                    {item.voiceInput && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">?™ï¸??Œì„±</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ?˜ë‹¨ ?•ë³´ */}
      <div className="text-center text-xs text-slate-500 mt-8">
        <div>?™ï¸??Œì„± ê¸°ë°˜ ?ë™ ?±ë¡ ?œìŠ¤??| OpenAI Whisper + GPT-4o-mini</div>
        <div>?§  STT (?Œì„±?’í…?¤íŠ¸) + NLU (?˜ë„ ë¶„ì„) + ?ë™ ë¶„ë¥˜</div>
        <div>?“‚ ì¹´í…Œê³ ë¦¬: ì¶•êµ¬?? ? ë‹ˆ?? ê³? ?©í’ˆ, ê¸°í?</div>
      </div>
    </div>
  );
};

export default MarketPage_AI_VoiceAuto;
