let lastJson = "";
let t;
export function emitFillOnce(parsed, wait = 250) { const j = JSON.stringify(parsed || {}); if (j === lastJson)
    return; } // 멱등  clearTimeout(t);  t = setTimeout(() => {    lastJson = j;    window.dispatchEvent(new CustomEvent("nlu:fill", { detail: parsed }));    window.__setSignupFields?.(parsed);  }, wait);                              // ?�바?�스} 
