import { useEffect, useState } from 'react';

interface KakaoMapsHook {
  isLoaded: boolean;
  error: string | null;
}

// ?„ì—­ ë¡œë”© ?íƒœ ê´€ë¦?let globalKakaoPromise: Promise<any> | null = null;
let globalKakaoLoaded = false;

export const useKakaoMaps = (): KakaoMapsHook => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ?´ë? ë¡œë“œ?˜ì–´ ?ˆëŠ”ì§€ ?•ì¸
    if (globalKakaoLoaded && window.kakao && window.kakao.maps) {
      setIsLoaded(true);
      return;
    }

    // ?´ë? ë¡œë”© ì¤‘ì¸ì§€ ?•ì¸
    if (globalKakaoPromise) {
      globalKakaoPromise
        .then(() => {
          setIsLoaded(true);
          setError(null);
        })
        .catch((err) => {
          setError(err.message || 'ì¹´ì¹´??ì§€??ë¡œë“œ ?¤íŒ¨');
        });
      return;
    }

    // ?ˆë¡œ??ë¡œë”© ?œì‘
    const appKey = import.meta.env.VITE_KAKAO_JS_KEY || (window as any).KAKAO_JS_KEY;
    if (!appKey) {
      setError('VITE_KAKAO_JS_KEY ?˜ê²½ë³€?˜ê? ?¤ì •?˜ì? ?Šì•˜?µë‹ˆ??);
      return;
    }

    globalKakaoPromise = new Promise((resolve, reject) => {
      // ?´ë? ?¤í¬ë¦½íŠ¸ê°€ ?ˆëŠ”ì§€ ?•ì¸
      const existingScript = document.getElementById('kakao-map-sdk');
      if (existingScript) {
        if (window.kakao && window.kakao.maps) {
          window.kakao.maps.load(() => {
            globalKakaoLoaded = true;
            resolve(window.kakao);
          });
        } else {
          reject(new Error('ê¸°ì¡´ ?¤í¬ë¦½íŠ¸ ë¡œë“œ ?¤íŒ¨'));
        }
        return;
      }

      const kakaoScript = document.createElement('script');
      kakaoScript.id = 'kakao-map-sdk';
      kakaoScript.async = true;
      kakaoScript.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services&autoload=false`;
      
      kakaoScript.onload = () => {
        try {
          if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => {
              globalKakaoLoaded = true;
              resolve(window.kakao);
            });
          } else {
            reject(new Error('ì¹´ì¹´??ì§€??API ê°ì²´ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤'));
          }
        } catch (err) {
          reject(err);
        }
      };

      kakaoScript.onerror = () => {
        reject(new Error('ì¹´ì¹´??ì§€??API ?¤í¬ë¦½íŠ¸ ë¡œë“œ ?¤íŒ¨'));
      };

      document.head.appendChild(kakaoScript);
    });

    globalKakaoPromise
      .then(() => {
        setIsLoaded(true);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'ì¹´ì¹´??ì§€??ë¡œë“œ ?¤íŒ¨');
        globalKakaoPromise = null; // ?¬ì‹œ?„ë? ?„í•´ ì´ˆê¸°??      });
  }, []);

  return { isLoaded, error };
};
