// ?™ï¸??Œì„± ëª…ë ¹ ?¸ì‹ ??- ì²œì¬ ëª¨ë“œ 4?¨ê³„
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
    // ë¸Œë¼?°ì? ì§€???•ì¸
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('? ï¸ Speech Recognition??ì§€?ë˜ì§€ ?ŠëŠ” ë¸Œë¼?°ì??…ë‹ˆ??');
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const recognition = new SpeechRecognition();
    
    // ?¤ì •
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    // ?´ë²¤???¸ë“¤??    recognition.onstart = () => {
      setListening(true);
      setError(null);
      console.log('?™ï¸??Œì„± ?¸ì‹ ?œì‘');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript.trim();
      console.log('?¯ ?Œì„± ?¸ì‹ ê²°ê³¼:', transcript);
      onResult(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('???Œì„± ?¸ì‹ ?¤ë¥˜:', event.error, event.message);
      setError(event.message);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      console.log('?¹ï¸ ?Œì„± ?¸ì‹ ì¢…ë£Œ');
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
      setError('?Œì„± ?¸ì‹??ì§€?í•˜ì§€ ?ŠëŠ” ë¸Œë¼?°ì??…ë‹ˆ??');
      return;
    }

    if (recognitionRef.current && !listening) {
      try {
        recognitionRef.current.start();
        console.log('?¤ ?Œì„± ëª…ë ¹ ?€ê¸?ì¤?..');
      } catch (err) {
        console.error('???Œì„± ?¸ì‹ ?œì‘ ?¤íŒ¨:', err);
        setError('?Œì„± ?¸ì‹???œì‘?????†ìŠµ?ˆë‹¤.');
      }
    }
  };

  const stop = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      console.log('?›‘ ?Œì„± ?¸ì‹ ì¤‘ì?');
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
