import { onCLS, onINP, onLCP, onFCP, onTTFB, Metric } from 'web-vitals';

function send(m: Metric) {
  const url = 'https://us-centrall-jaeman-vibe-platform.cloudfunctions.net/collectVitals';
  
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: m.name, 
      value: m.value, 
      id: m.id,
      url: location.pathname + location.search,
      ua: navigator.userAgent,
      uid: null // 인증이 필요한 경우 여기에 uid 추가
    })
  }).catch(() => {
    // 실패해도 조용히 무시
  });
}

export function startVitals() {
  // 개발 중에는 collectVitals 비활성화
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_VITALS !== "true") {
    console.log('Web Vitals 수집이 개발 모드에서 비활성화되었습니다.');
    return;
  }

  onCLS(send); 
  onINP(send); 
  onLCP(send); 
  onFCP(send); 
  onTTFB(send);
}
