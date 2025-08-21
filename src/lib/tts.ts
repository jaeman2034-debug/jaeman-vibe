// TTS와 STT를 상호 배타로 만들기
let isListening = false;       // STT 상태
let isSpeakingTTS = false;     // TTS 상태

export function speak(text: string) {
  if (isListening) return;           // ✅ 듣는 중엔 절대 TTS 재생 금지
  if (isSpeakingTTS) return;         // ✅ 이미 말하는 중이면 중복 방지
  
  const u = new SpeechSynthesisUtterance(text);
  isSpeakingTTS = true;
  u.onend = () => (isSpeakingTTS = false);
  u.onerror = () => (isSpeakingTTS = false);  // 에러 시에도 상태 복구
  
  try { speechSynthesis.cancel(); } catch {}
  speechSynthesis.speak(u);
}

export function startListeningGuard() {
  try { speechSynthesis.cancel(); } catch {}   // ✅ 듣기 시작 전에 TTS 즉시 중단
  isSpeakingTTS = false;                      // ✅ TTS 상태 강제 리셋
  
  // 모든 오디오 요소 정리
  const audio = document.getElementById("tts-audio") as HTMLAudioElement | null;
  if (audio) { audio.pause(); audio.currentTime = 0; }
  
  // 추가 오디오 요소들도 정리 (혹시 모를 경우)
  document.querySelectorAll('audio').forEach(a => {
    a.pause();
    a.currentTime = 0;
  });
  
  isListening = true;
}

export function stopListeningGuard() {
  isListening = false;
}

// 상태 확인 함수들
export function isCurrentlyListening(): boolean {
  return isListening;
}

export function isCurrentlySpeaking(): boolean {
  return isSpeakingTTS;
}

// 강제 TTS 중단 (긴급 상황용)
export function forceStopTTS() {
  try { speechSynthesis.cancel(); } catch {}
  isSpeakingTTS = false;
  const audio = document.getElementById("tts-audio") as HTMLAudioElement | null;
  if (audio) { audio.pause(); audio.currentTime = 0; }
}

// 도움말/예시 문장 제거 (보조 안전망)
export function stripExamples(s: string): string {
  // '예:' 또는 '예시'가 들어간 문장/줄 제거
  return s
    .split(/\n|[.?!]/)
    .filter(line => {
      const trimmed = line.trim();
      // 예:, 예시, 예 :, 예 시 등 다양한 패턴 제거
      return !/^(예[:시]|예\s*:|예시|예\s*시)/i.test(trimmed);
    })
    .join(". ")
    .replace(/\s*\.\s*\./g, ".")  // 연속된 점 정리
    .trim();
} 