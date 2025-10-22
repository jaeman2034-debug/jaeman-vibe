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

  // ?�시�??�이??구독
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

  // OpenAI Whisper API ?�출
  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error("OpenAI API ?��? ?�정?��? ?�았?�니?? .env ?�일??VITE_OPENAI_API_KEY�?추�??�세??");
    }

    const formData = new FormData();
    formData.append("file", audioBlob, "voice.webm");
    formData.append("model", "whisper-1");
    formData.append("language", "ko"); // ?�국??지??
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
        throw new Error(`OpenAI API ?�류: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.text || "";
    } catch (error) {
      console.error("Whisper API ?�출 ?�패:", error);
      throw error;
    }
  };

  // Cloud Function ?�출
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
      console.error("AI Voice Auto Cloud Function ?�출 ?�패:", error);
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

          // OpenAI Whisper API ?�출
          setStatus("?�� ?�성 ?�식 �?..");
          const text = await transcribeAudio(blob);
          setTranscript(text);
          
          if (!text.trim()) {
            setStatus("???�성???�식?????�습?�다. ?�시 ?�도?�주?�요.");
            return;
          }

          setStatus("?�� AI 분석 �?..");
          const result = await callAiVoiceAuto(text);
          
          if (result.success) {
            setStatus("???�성 기반 ?�동 ?�록 ?�료!");
            console.log("?�록???�품:", result.data);
          } else {
            setStatus(`???�록 ?�패: ${result.error}`);
          }
        } catch (error) {
          console.error("?�성 처리 ?�류:", error);
          setStatus(`???�류 발생: ${String(error)}`);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setStatus("?���??�음 �?.. (말�??�주?�요)");
    } catch (error) {
      console.error("마이???�근 ?�류:", error);
      setStatus("??마이???�근??거�??�었?�니?? 브라?��? ?�정???�인?�주?�요.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setStatus("?�� ?�성 처리 �?..");
    }
  };

  // ?�계 ?�보
  const stats = {
    total: items.length,
    voiceProcessed: items.filter(i => i.voiceInput).length,
    aiProcessed: items.filter(i => i.aiProcessed).length
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold mb-2">?���??�성 기반 ?�동 ?�록</h1>
        <p className="text-slate-600 mb-4">말로 ?�품???�록?�세?? AI가 ?�동?�로 분석?�고 분류?�니??</p>
        
        {/* ?�계 ?�보 */}
        <div className="flex justify-center gap-4 text-sm text-slate-600">
          <span>?�� �??�품: {stats.total}�?/span>
          <span>?���??�성 ?�록: {stats.voiceProcessed}�?/span>
          <span>?�� AI 처리: {stats.aiProcessed}�?/span>
        </div>
      </div>

      {/* ?�성 ?�음 ?�션 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8">
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">?�� ?�성?�로 ?�품 ?�록</h2>
            <p className="text-slate-600 text-sm mb-4">
              ?? "?�이??축구??만원???�아??, "?�디?�스 ?�니??5만원"
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
            {recording ? "???�음 종료" : "???�음 ?�작"}
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
                <div className="text-sm font-semibold text-slate-700 mb-2">?�� ?�식???�용:</div>
                <div className="text-slate-600">{transcript}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ?�용 가?�드 */}
      <div className="bg-slate-50 rounded-xl p-4 mb-6">
        <h3 className="font-bold text-slate-800 mb-2">?�� ?�용 가?�드</h3>
        <div className="text-sm text-slate-600 space-y-1">
          <div>??"브랜?�명 + ?�품�?+ 가�? ?�태�?말해주세??/div>
          <div>???�시: "?�이??축구??만원???�아??, "?�디?�스 ?�니??5만원"</div>
          <div>??AI가 ?�동?�로 카테고리 분류, 가�?추출, ?�명 ?�성?�니??/div>
        </div>
      </div>

      {/* ?�록???�품 목록 */}
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-4">?�� ?�록???�품 목록</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="text-slate-500">?�� ?�품 목록??불러?�는 �?..</div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-slate-500">?�� ?�록???�품???�습?�다. ?�성?�로 ?�품???�록?�보?�요!</div>
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
                    ?�� {item.category || "기�?"}
                    {item.price && ` | ?�� ${item.price.toLocaleString()}??}
                  </div>
                  
                  {item.desc && (
                    <div className="text-sm text-slate-700">{item.desc}</div>
                  )}
                  
                  {item.voiceInput && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      ?���?"{item.voiceInput}"
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {item.aiProcessed && <span className="bg-green-100 text-green-700 px-2 py-1 rounded">?�� AI</span>}
                    {item.voiceInput && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">?���??�성</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ?�단 ?�보 */}
      <div className="text-center text-xs text-slate-500 mt-8">
        <div>?���??�성 기반 ?�동 ?�록 ?�스??| OpenAI Whisper + GPT-4o-mini</div>
        <div>?�� STT (?�성?�텍?�트) + NLU (?�도 분석) + ?�동 분류</div>
        <div>?�� 카테고리: 축구?? ?�니?? �? ?�품, 기�?</div>
      </div>
    </div>
  );
};

export default MarketPage_AI_VoiceAuto;
