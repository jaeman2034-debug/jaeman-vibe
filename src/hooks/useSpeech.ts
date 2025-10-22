// useSpeech.ts
import { isSpeaking, speakOnce } from "@/hooks/useTTS"; // 경로 맞게

const retriable = new Set<SpeechRecognitionErrorEvent["error"]>([
  "no-speech", "network", "aborted" // ?�동 ?�시??OK
]);

const fatal = new Set<SpeechRecognitionErrorEvent["error"]>([
  "not-allowed", "service-not-allowed", "audio-capture" // 권한/?�치 문제
]);

let streak = 0;
let firstInStreakAt = 0;
const STREAK_WINDOW = 10_000; // 10�?�?
const MAX_STREAK = 5;         // 5???�으�??�동?�시??중단

// ?�태 관�?(?�제 구현?�서???�절???�태 관�??�이브러�??�용)
let state = { listening: false, canAutoResume: true };
const setState = (newState: Partial<typeof state>) => {
  state = { ...state, ...newState };
};
const getState = () => state;

// SpeechRecognition ?�스?�스 (?�제 구현?�서???�절??초기??
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

recognition.onerror = async (e) => {
  console.warn("[STT error]", e.error);

  // 치명???�류: ?�동 ?�시??중단 + 1???�내
  if (fatal.has(e.error)) {
    await speakOnce("마이??권한???�인??주세??", { cooldown: 10_000 });
    setState({ listening: false, canAutoResume: false });
    return;
  }

  // ?�시??가?�한 ?�류
  if (!retriable.has(e.error)) {
    // ?????�는 ?�류??조심?�럽�?처리
    await speakOnce("?�시 문제가 ?�어?? ?�시 ?�도?�게??");
  }

  const now = Date.now();
  if (now - firstInStreakAt > STREAK_WINDOW) {
    // ?�도??리셋
    firstInStreakAt = now;
    streak = 0;
  }
  streak++;

  // ?�트�?�?건에?�만 ?�내(반복 ?�내 방�?)
  if (streak === 1) {
    await speakOnce("?�시만요. ?�시 ?�식??볼게??");
  }

  // ?�트�??�도 초과�??�동 ?�시??멈추�??�동 ?�개�??�용
  if (streak >= MAX_STREAK) {
    await speakOnce("?�속 ?�류�??�성 ?�식??멈췄?�요. ?�시 ?�작???�러 주세??", { cooldown: 10_000 });
    setState({ listening: false, canAutoResume: false });
    return;
  }

  // ?�시??백오??(0.5s ??1s ??2s ????최�? 5s)
  const delay = Math.min(500 * 2 ** (streak - 1), 5000);

  // TTS 중에???�시?�하지 ?�음
  const retry = () => {
    if (!isSpeaking() && getState().canAutoResume !== false) {
      try {
        recognition.start();
      } catch (err) {
        console.warn("restart failed", err);
      }
    } else {
      // TTS가 ?�나�?조금 ??기다?�다 ?�시??
      setTimeout(retry, 400);
    }
  };
  setTimeout(retry, delay);
};

export { recognition, setState, getState };
