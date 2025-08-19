let speaking = false;
let locked = false;        // PTT중/녹음중 강제 금지
let muteUntil = 0;         // 녹음 끝난 뒤 쿨다운(ms)

export function setTtsLock(v: boolean) {
  locked = v;
  if (v) window.speechSynthesis.cancel();
}

export function muteFor(ms: number) {
  muteUntil = Date.now() + ms;
  if (ms > 0) window.speechSynthesis.cancel();
}

export function canSpeak() {
  return !locked && Date.now() > muteUntil;
}

export function speak(
  text: string,
  opts?: { lang?: string; volume?: number; rate?: number }
) {
  if (!canSpeak()) return null;          // 🔒 금지/쿨다운이면 말하지 않음
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang   = opts?.lang ?? 'ko-KR';
  u.volume = opts?.volume ?? 0.45;
  u.rate   = opts?.rate ?? 1.0;
  u.onstart = () => (speaking = true);
  u.onend = u.onerror = () => (speaking = false);
  window.speechSynthesis.speak(u);
  return u;
}

export function stopSpeak() {
  speaking = false;
  window.speechSynthesis.cancel();
}

export function isTtsLocked() { return locked; }

export function isSpeaking() {
  return speaking || window.speechSynthesis.speaking;
} 