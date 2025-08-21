// src/hooks/useSpeechRecognition.ts
import { useEffect, useState, useRef } from 'react';
import { startListeningGuard, stopListeningGuard, isCurrentlySpeaking, stripExamples } from '@/lib/tts';

export const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;  // 중간 결과 비활성화
    recognition.continuous = false;      // 테스트 때 안정적

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // 혹시라도 TTS가 켜져있으면 결과 무시
      if (isCurrentlySpeaking()) return;
      
      const rawResult = event.results[0][0].transcript;
      // 도움말/예시 문장 제거 (보조 안전망)
      const cleaned = stripExamples(rawResult);
      
      // 개발 환경에서만 로그 출력
      if (import.meta.env.DEV && rawResult !== cleaned) {
        console.log("🔍 예시 문장 제거:", { raw: rawResult, cleaned });
      }
      
      setTranscript(cleaned);
    };

    recognition.onend = () => {
      setIsListening(false);
      stopListeningGuard(); // ✅ TTS 재생 허용
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript('');
      startListeningGuard(); // ✅ TTS 즉시 중단
      recognitionRef.current.interimResults = false;
      recognitionRef.current.continuous = false;  // 테스트 때 안정적
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return { transcript, isListening, startListening };
};
