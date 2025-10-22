// src/lib/kakaoLoader.ts
let kakaoPromise: Promise<any> | null = null;

declare global {
  interface Window { kakao: any }
}

export function loadKakao(): Promise<any> {
  if (typeof window !== "undefined" && window.kakao?.maps) {
    return Promise.resolve(window.kakao);
  }
  if (kakaoPromise) return kakaoPromise;

  kakaoPromise = new Promise((resolve, reject) => {
    const key = import.meta.env.VITE_KAKAO_API_KEY; // ??Vite ë°©ì‹
    if (!key) return reject(new Error("Missing VITE_KAKAO_API_KEY"));

    const id = "kakao-map-sdk";
    const existed = document.getElementById(id) as HTMLScriptElement | null;
    if (existed) {
      if (window.kakao?.maps) return resolve(window.kakao);
      existed.addEventListener("load", () => resolve(window.kakao));
      existed.addEventListener("error", () => reject(new Error("Kakao SDK load error")));
      return;
    }

    const s = document.createElement("script");
    s.id = id;
    s.async = true;
    // ?‘‰ https ë¡?ê³ ì • (?„ë¡œ? ì½œ ?ë? ê²½ë¡œ X)
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
    s.onerror = () => reject(new Error("Kakao SDK network error"));
    s.onload = () => {
      if (!window.kakao?.maps) return reject(new Error("Kakao maps is undefined after load"));
      window.kakao.maps.load(() => resolve(window.kakao));
    };
    document.head.appendChild(s);
  });

  return kakaoPromise;
}
