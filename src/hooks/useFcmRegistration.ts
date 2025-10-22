import { useState, useEffect } from "react";
import { getMessaging, getToken, onMessage, deleteToken } from "firebase/messaging";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "@/lib/firebase"; // 파일 진입점에서 사용
import { onAuthStateChanged } from "firebase/auth";

const functions = getFunctions();

interface FcmRegistrationOptions {
  vapidKey: string;
  onTokenReceived?: (token: string) => void;
  onMessageReceived?: (payload: any) => void;
  onError?: (error: Error) => void;
}

export function useFcmRegistration(options: FcmRegistrationOptions) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  // FCM 지원 여부 확인
  useEffect(() => {
    const checkSupport = async () => {
      try {
        // 개발 모드에서 FCM 스킵
        if (import.meta.env.DEV) {
          console.info('[MSG] Dev mode → skip FCM support check');
          setIsSupported(false);
          return;
        }

        // messagingSenderId가 없으면 스킵
        const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
        if (!messagingSenderId) {
          console.info('[MSG] No messagingSenderId → skip FCM support check');
          setIsSupported(false);
          return;
        }

        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const messaging = getMessaging();
          setIsSupported(true);
        } else {
          setIsSupported(false);
          setError("FCM이 지원되지 않는 브라우저입니다.");
        }
      } catch (err) {
        setIsSupported(false);
        setError("FCM 초기화에 실패했습니다.");
      }
    };

    checkSupport();
  }, []);

  // FCM 토큰 요청 및 등록
  const registerFcmToken = async () => {
    if (!isSupported || !auth.currentUser) return;

    setLoading(true);
    setError(null);

    try {
      const messaging = getMessaging();
      
      // 권한 요청
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('알림 권한이 거부되었습니다.');
      }

      // FCM 토큰 요청
      const currentToken = await getToken(messaging, {
        vapidKey: options.vapidKey
      });

      if (currentToken) {
        setToken(currentToken);
        
        // 서버에 토큰 저장
        await saveTokenToServer(currentToken);
        
        // 콜백 호출
        if (options.onTokenReceived) {
          options.onTokenReceived(currentToken);
        }
        
        console.log('FCM 토큰 등록 완료:', currentToken);
      } else {
        throw new Error('FCM 토큰을 가져올 수 없습니다.');
      }
    } catch (err: any) {
      console.error('FCM 토큰 등록 실패:', err);
      setError(err.message || '토큰 등록에 실패했습니다.');
      
      if (options.onError) {
        options.onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // 서버에 토큰 저장
  const saveTokenToServer = async (token: string) => {
    try {
      const saveTokenFn = httpsCallable(functions, 'saveFcmTokenFn');
      
      const deviceInfo = {
        platform: getPlatform(),
        appVersion: getAppVersion(),
        deviceId: getDeviceId()
      };
      
      await saveTokenFn({ token, deviceInfo });
    } catch (err) {
      console.error('서버에 토큰 저장 실패:', err);
      throw err;
    }
  };

  // FCM 토큰 제거
  const unregisterFcmToken = async () => {
    if (!token) return;

    try {
      setLoading(true);
      
      // 서버에서 토큰 제거
      const removeTokenFn = httpsCallable(functions, 'removeFcmTokenFn');
      await removeTokenFn({ token });
      
      // 로컬 토큰 제거
      const messaging = getMessaging();
      await deleteToken(messaging);
      
      setToken(null);
      console.log('FCM 토큰 제거 완료');
    } catch (err: any) {
      console.error('FCM 토큰 제거 실패:', err);
      setError(err.message || '토큰 제거에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // FCM 메시지 수신 리스너
  useEffect(() => {
    if (!isSupported) return;

    const messaging = getMessaging();
    
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('FCM 메시지 수신:', payload);
      
      // 브라우저 알림 표시
      if (payload.notification) {
        const { title, body } = payload.notification;
        
        if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title || '알림', {
              body: body || '',
              icon: '/icons/icon-192.png',
              badge: '/icons/icon-192.png',
              tag: 'fcm-notification',
              data: payload.data
            });
          });
        } else {
          // 기본 브라우저 알림
          new Notification(title || '알림', {
            body: body || '',
            icon: '/icons/icon-192.png'
          });
        }
      }
      
      // 콜백 호출
      if (options.onMessageReceived) {
        options.onMessageReceived(payload);
      }
    });

    return unsubscribe;
  }, [isSupported, options.onMessageReceived]);

  // 인증 상태 변경시 토큰 등록
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && isSupported) {
        registerFcmToken();
      } else {
        setToken(null);
      }
    });

    return unsubscribe;
  }, [isSupported]);

  // 플랫폼 정보 가져오기
  const getPlatform = () => {
    const userAgent = navigator.userAgent;
    if (/Android/i.test(userAgent)) return 'android';
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
    if (/Windows/i.test(userAgent)) return 'windows';
    if (/Mac/i.test(userAgent)) return 'mac';
    if (/Linux/i.test(userAgent)) return 'linux';
    return 'unknown';
  };

  // 앱 버전 가져오기
  const getAppVersion = () => {
    // package.json의 version을 사용하거나 환경변수에서 가져오기
    return process.env.REACT_APP_VERSION || '1.0.0';
  };

  // 디바이스 ID 생성 (간단한 구현)
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'web_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  };

  return {
    token,
    loading,
    error,
    isSupported,
    registerFcmToken,
    unregisterFcmToken,
    refresh: registerFcmToken
  };
}