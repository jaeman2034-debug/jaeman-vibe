// useTTS.ts
let speaking = false;
let lastAnnounceAt = 0;

export const isSpeaking = () => speaking;

export async function speakOnce(
  text: string,
  opts?: { lang?: string; rate?: number; pitch?: number; cooldown?: number }
) {
  const cooldown = opts?.cooldown ?? 5000; // 5ì´??´ë‚´ ê°™ì? ë¥??ˆë‚´ ê¸ˆì?
  if (Date.now() - lastAnnounceAt < cooldown) return;

  lastAnnounceAt = Date.now();
  speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = opts?.lang ?? "ko-KR";
  if (opts?.rate) u.rate = opts.rate;
  if (opts?.pitch) u.pitch = opts.pitch;

  return new Promise<void>((resolve) => {
    u.onstart = () => (speaking = true);
    u.onend = u.onerror = () => {
      speaking = false;
      resolve();
    };
    speechSynthesis.speak(u);
  });
}
