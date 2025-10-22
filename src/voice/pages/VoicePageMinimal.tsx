// VoicePage 최소 ?�시 (?�작 보장 ?�턴)
import { useEffect } from "react";

export default function VoicePageMinimal() {
  // VoicePage 진입 ??(마이??권한/?�디??컨텍?�트)
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    (async () => {
      try {
        // 1) 마이??권한 ?�청
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('[VOICE] Microphone permission granted');
        
        // 2) AudioContext ?�성??
        if ('AudioContext' in window) {
          const ac = new AudioContext();
          await ac.resume();
          console.log('[VOICE] AudioContext resumed');
        }
        
        // 3) ?�기??STT ?�작 ??초기??로직
        console.log('[VOICE] Ready for speech recognition');
        
      } catch (e) {
        console.error('[VOICE] mic permission error', e);
      }
    })();
    
    // 4) ?�리 ?�수
    return () => { 
      stream?.getTracks().forEach(t => t.stop()); 
    };
  }, []);

  return (
    <div className="p-4">
      <h1>?�성 ?�이지</h1>
      <p>마이??권한???�청?�었?�니??</p>
    </div>
  );
}
