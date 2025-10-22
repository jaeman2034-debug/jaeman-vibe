import { useEffect, useState } from 'react';

interface KakaoMapsHook {
  isLoaded: boolean;
  error: string | null;
}

// ?�역 로딩 ?�태 관�?let globalKakaoPromise: Promise<any> | null = null;
let globalKakaoLoaded = false;

export const useKakaoMaps = (): KakaoMapsHook => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ?��? 로드?�어 ?�는지 ?�인
    if (globalKakaoLoaded && window.kakao && window.kakao.maps) {
      setIsLoaded(true);
      return;
    }

    // ?��? 로딩 중인지 ?�인
    if (globalKakaoPromise) {
      globalKakaoPromise
        .then(() => {
          setIsLoaded(true);
          setError(null);
        })
        .catch((err) => {
          setError(err.message || '카카??지??로드 ?�패');
        });
      return;
    }

    // ?�로??로딩 ?�작
    const appKey = import.meta.env.VITE_KAKAO_JS_KEY || (window as any).KAKAO_JS_KEY;
    if (!appKey) {
      setError('VITE_KAKAO_JS_KEY ?�경변?��? ?�정?��? ?�았?�니??);
      return;
    }

    globalKakaoPromise = new Promise((resolve, reject) => {
      // ?��? ?�크립트가 ?�는지 ?�인
      const existingScript = document.getElementById('kakao-map-sdk');
      if (existingScript) {
        if (window.kakao && window.kakao.maps) {
          window.kakao.maps.load(() => {
            globalKakaoLoaded = true;
            resolve(window.kakao);
          });
        } else {
          reject(new Error('기존 ?�크립트 로드 ?�패'));
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
            reject(new Error('카카??지??API 객체�?찾을 ???�습?�다'));
          }
        } catch (err) {
          reject(err);
        }
      };

      kakaoScript.onerror = () => {
        reject(new Error('카카??지??API ?�크립트 로드 ?�패'));
      };

      document.head.appendChild(kakaoScript);
    });

    globalKakaoPromise
      .then(() => {
        setIsLoaded(true);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || '카카??지??로드 ?�패');
        globalKakaoPromise = null; // ?�시?��? ?�해 초기??      });
  }, []);

  return { isLoaded, error };
};
