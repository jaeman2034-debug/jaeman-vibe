export function startSpeechRecognition(onResult: (text: string) => void) {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다.');
      return;
    }
    const recognition = new SR();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
  
    recognition.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript?.trim?.() ?? '';
      if (text) onResult(text);
    };
    recognition.onerror = () => {
      onResult('');
    };
    recognition.start();
  }
  