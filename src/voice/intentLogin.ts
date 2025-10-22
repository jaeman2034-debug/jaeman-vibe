export function isLoginIntent(s: string) {
  const t = s.replace(/\s+/g, '').toLowerCase(); // 공백 제거/소문자
  return ['로그인', '구글로그인', '회원가입', '회원가입', '가입'].some(k =>
    t.includes(k)
  );
}

export function getLoginRoute(s: string) {
  const t = s.replace(/\s+/g, '').toLowerCase();
  
  // 이메일 가입 의도
  if (t.includes('이메일') && (t.includes('가입') || t.includes('회원'))) {
    return '/signup?next=/market';
  }
  
  // 구글 로그인 의도
  if (t.includes('구글') && (t.includes('로그인') || t.includes('가입'))) {
    return '/login?provider=google&next=/market';
  }
  
  // 일반 로그인 의도
  if (t.includes('로그인') || t.includes('가입') || t.includes('회원')) {
    return '/login?next=/market';
  }
  
  return null;
}

// 로그인/가입 페이지에서 사용하는 음성 명령 (민감 정보 입력 방지)
export function getAuthPageVoiceRoute(s: string) {
  const t = s.replace(/\s+/g, '').toLowerCase();
  
  // 뒤로가기/시작으로
  if (t.includes('뒤로') || t.includes('시작') || t.includes('홈')) {
    return '/start';
  }
  
  // 이메일로 가입
  if (t.includes('이메일') && (t.includes('가입') || t.includes('회원'))) {
    return '/signup?next=/market';
  }
  
  // 구글로 로그인가입
  if (t.includes('구글') && (t.includes('로그인') || t.includes('가입'))) {
    return '/login?provider=google&next=/market';
  }
  
  return null;
}

// /voice 페이지에서 사용하는 로그인 의도 처리 (from, next 파라미터 고려)
export function getVoicePageLoginRoute(s: string, from?: string, next?: string) {
  const t = s.replace(/\s+/g, '').toLowerCase();
  const targetNext = next || '/market';
  const targetFrom = from || '/start';
  
  // 이메일 가입 의도
  if (t.includes('이메일') && (t.includes('가입') || t.includes('회원'))) {
    return `/signup?next=${encodeURIComponent(targetNext)}`;
  }
  
  // 이메일 로그인 의도
  if (t.includes('이메일') && t.includes('로그인')) {
    return `/login?next=${encodeURIComponent(targetNext)}`;
  }
  
  // 구글 로그인가입 의도
  if (t.includes('구글') && (t.includes('로그인') || t.includes('가입'))) {
    return `/login?provider=google&next=${encodeURIComponent(targetNext)}`;
  }
  
  // 뒤로가기/시작으로
  if (t.includes('뒤로') || t.includes('이전') || t.includes('취소') || t.includes('처음') || t.includes('시작')) {
    return targetFrom;
  }
  
  return null;
}