// useSpeech.ts
import { isSpeaking, speakOnce } from "@/hooks/useTTS"; // ê²½ë¡œ ë§ê²Œ

const retriable = new Set<SpeechRecognitionErrorEvent["error"]>([
  "no-speech", "network", "aborted" // ?ë™ ?¬ì‹œ??OK
]);

const fatal = new Set<SpeechRecognitionErrorEvent["error"]>([
  "not-allowed", "service-not-allowed", "audio-capture" // ê¶Œí•œ/?¥ì¹˜ ë¬¸ì œ
]);

let streak = 0;
let firstInStreakAt = 0;
const STREAK_WINDOW = 10_000; // 10ì´?ì°?
const MAX_STREAK = 5;         // 5???˜ìœ¼ë©??ë™?¬ì‹œ??ì¤‘ë‹¨

// ?íƒœ ê´€ë¦?(?¤ì œ êµ¬í˜„?ì„œ???ì ˆ???íƒœ ê´€ë¦??¼ì´ë¸ŒëŸ¬ë¦??¬ìš©)
let state = { listening: false, canAutoResume: true };
const setState = (newState: Partial<typeof state>) => {
  state = { ...state, ...newState };
};
const getState = () => state;

// SpeechRecognition ?¸ìŠ¤?´ìŠ¤ (?¤ì œ êµ¬í˜„?ì„œ???ì ˆ??ì´ˆê¸°??
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

recognition.onerror = async (e) => {
  console.warn("[STT error]", e.error);

  // ì¹˜ëª…???¤ë¥˜: ?ë™ ?¬ì‹œ??ì¤‘ë‹¨ + 1???ˆë‚´
  if (fatal.has(e.error)) {
    await speakOnce("ë§ˆì´??ê¶Œí•œ???•ì¸??ì£¼ì„¸??", { cooldown: 10_000 });
    setState({ listening: false, canAutoResume: false });
    return;
  }

  // ?¬ì‹œ??ê°€?¥í•œ ?¤ë¥˜
  if (!retriable.has(e.error)) {
    // ?????†ëŠ” ?¤ë¥˜??ì¡°ì‹¬?¤ëŸ½ê²?ì²˜ë¦¬
    await speakOnce("? ì‹œ ë¬¸ì œê°€ ?ˆì–´?? ?¤ì‹œ ?œë„? ê²Œ??");
  }

  const now = Date.now();
  if (now - firstInStreakAt > STREAK_WINDOW) {
    // ?ˆë„??ë¦¬ì…‹
    firstInStreakAt = now;
    streak = 0;
  }
  streak++;

  // ?¤íŠ¸ë¦?ì²?ê±´ì—?œë§Œ ?ˆë‚´(ë°˜ë³µ ?ˆë‚´ ë°©ì?)
  if (streak === 1) {
    await speakOnce("? ì‹œë§Œìš”. ?¤ì‹œ ?¸ì‹??ë³¼ê²Œ??");
  }

  // ?¤íŠ¸ë¦??œë„ ì´ˆê³¼ë©??ë™ ?¬ì‹œ??ë©ˆì¶”ê³??˜ë™ ?¬ê°œë§??ˆìš©
  if (streak >= MAX_STREAK) {
    await speakOnce("?°ì† ?¤ë¥˜ë¡??Œì„± ?¸ì‹??ë©ˆì·„?´ìš”. ?¤ì‹œ ?œì‘???ŒëŸ¬ ì£¼ì„¸??", { cooldown: 10_000 });
    setState({ listening: false, canAutoResume: false });
    return;
  }

  // ?¬ì‹œ??ë°±ì˜¤??(0.5s ??1s ??2s ????ìµœë? 5s)
  const delay = Math.min(500 * 2 ** (streak - 1), 5000);

  // TTS ì¤‘ì—???¬ì‹œ?‘í•˜ì§€ ?ŠìŒ
  const retry = () => {
    if (!isSpeaking() && getState().canAutoResume !== false) {
      try {
        recognition.start();
      } catch (err) {
        console.warn("restart failed", err);
      }
    } else {
      // TTSê°€ ?ë‚˜ê¸?ì¡°ê¸ˆ ??ê¸°ë‹¤?¸ë‹¤ ?¬ì‹œ??
      setTimeout(retry, 400);
    }
  };
  setTimeout(retry, delay);
};

export { recognition, setState, getState };
