export type Parsed = { name?:string; email?:string; phone?:string; password?:string };

let lastJson = "";
let t: any;

export function emitFillOnce(parsed: Parsed, wait = 250) {
  const j = JSON.stringify(parsed || {});
  if (j === lastJson) return;           // 멱등
  clearTimeout(t);
  t = setTimeout(() => {
    lastJson = j;
    window.dispatchEvent(new CustomEvent("nlu:fill", { detail: parsed }));
    window.__setSignupFields?.(parsed);
  }, wait);                              // 디바운스
} 