// 간단 STT 래퍼: 한 번 듣고 문자열 반환
export function createRecognizer(locale: string) {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) throw new Error("이 브라우저는 음성 인식을 지원하지 않습니다.");
    const rec = new SR();
    rec.lang = locale || "ko-KR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    return rec;
  }
  
  export function listenOnce(locale: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const rec = createRecognizer(locale);
        let finished = false;
  
        rec.onresult = (e: any) => {
          const t = e?.results?.[0]?.[0]?.transcript ?? "";
          finished = true;
          rec.stop();
          resolve(t);
        };
  
        rec.onerror = (e: any) => {
          if (!finished) reject(new Error(e?.error || "stt_error"));
        };
  
        rec.onend = () => {
          if (!finished) reject(new Error("no_speech"));
        };
  
        rec.start();
      } catch (err) {
        reject(err);
      }
    });
  }
  