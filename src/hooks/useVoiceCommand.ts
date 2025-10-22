// ?���??�성 명령 ?�식 ??- 천재 모드 4?�계
import { useEffect, useRef, useState } from 'react';

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

export function useVoiceCommand(onResult: (text: string) => void) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 브라?��? 지???�인
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('?�️ Speech Recognition??지?�되지 ?�는 브라?��??�니??');
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const recognition = new SpeechRecognition();
    
    // ?�정
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    // ?�벤???�들??    recognition.onstart = () => {
      setListening(true);
      setError(null);
      console.log('?���??�성 ?�식 ?�작');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript.trim();
      console.log('?�� ?�성 ?�식 결과:', transcript);
      onResult(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('???�성 ?�식 ?�류:', event.error, event.message);
      setError(event.message);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      console.log('?�️ ?�성 ?�식 종료');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onResult]);

  const start = () => {
    if (!isSupported) {
      setError('?�성 ?�식??지?�하지 ?�는 브라?��??�니??');
      return;
    }

    if (recognitionRef.current && !listening) {
      try {
        recognitionRef.current.start();
        console.log('?�� ?�성 명령 ?��?�?..');
      } catch (err) {
        console.error('???�성 ?�식 ?�작 ?�패:', err);
        setError('?�성 ?�식???�작?????�습?�다.');
      }
    }
  };

  const stop = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      console.log('?�� ?�성 ?�식 중�?');
    }
  };

  return { 
    start, 
    stop, 
    listening, 
    isSupported,
    error
  };
}
