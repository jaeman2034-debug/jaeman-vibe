import { useEffect } from 'react';

type Ctx = { 
  say: string; 
  go: (path: string) => void; 
  user: any; 
  tts: (m: string) => void; 
  get: (k: string) => string | null; 
};

export function useVoiceOnboard(ctx: Ctx) {
  const next = ctx.get('next') || '/market';
  const flow = ctx.get('flow'); // 'onboard'일 때만 시작

  useEffect(() => {
    if (flow !== 'onboard') return;

    if (!ctx.user) {
      // 한번만 TTS 실행되도록 설정
      const timer = setTimeout(() => {
        ctx.tts('지금 바로 가입할까요? 구글, 이메일 중에서 하나를 말해주세요');
      }, 1000); // 1초 후 실행
      
      return () => clearTimeout(timer);
    } else {
      ctx.tts('환영합니다. 바로 시작하겠습니다');
      ctx.go(next);
    }
  }, [flow, ctx.user, next]); // flow와 ctx.user가 변경될 때만 실행

  // 인텐트 처리
  const handle = (s: string) => {
    console.log('[VOICE_ONBOARD] 처리 중', s);
    s = s.toLowerCase();
    
    // 간단한 명령 의도 패턴으로 개선
    if (/(구글|google)/.test(s)) {
      console.log('[VOICE_ONBOARD] 구글 가입 선택됨');
      ctx.go(`/login?provider=google&next=${encodeURIComponent(`/voice?stage=welcome&next=${next}`)}`);
      return true;
    }
    
    if (/(이메일|메일)/.test(s)) {
      console.log('[VOICE_ONBOARD] 이메일 가입 선택됨');
      ctx.go(`/signup?next=${encodeURIComponent(`/voice?stage=welcome&next=${next}`)}`);
      return true;
    }
    
    if (/(휴대폰|문자|sms)/.test(s)) {
      console.log('[VOICE_ONBOARD] 휴대폰 가입 선택됨');
      ctx.go(`/phone?next=${encodeURIComponent(`/voice?stage=welcome&next=${next}`)}`);
      return true;
    }
    
    console.log('[VOICE_ONBOARD] 인식되지 않은 명령:', s);
    return false;
  };

  return { handle };
}