// ?�� PWA Service Worker ?�록 ??- Toast ?�데?�트 ?�림 ?�스??import { registerSW } from 'virtual:pwa-register';

export function setupPWA() {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // ?�� 커스?� Toast ?�림 (alert ?�??브랜?�형 ?�림)
      const toast = document.createElement('div')
      toast.innerHTML = `
        <div style="
          position: fixed; bottom: 24px; right: 24px;
          background: linear-gradient(135deg, #0B0B0D 0%, #1a1a1a 100%); 
          color: white; padding: 16px 20px;
          border-radius: 16px; font-size: 14px;
          display: flex; align-items: center; gap: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
          border: 1px solid rgba(163, 230, 53, 0.2);
          z-index: 9999; font-family: Pretendard, sans-serif;
          backdrop-filter: blur(10px);
          max-width: 320px;
          animation: slideInUp 0.3s ease-out;">
          <div style="font-size: 24px;">??/div>
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 4px;">?�로???�데?�트!</div>
            <div style="font-size: 12px; opacity: 0.8;">YAGO VIBE가 ?�데?�트?�었?�니??/div>
          </div>
          <button id="refreshApp" style="
            background: #A3E635; color: black; border: none;
            border-radius: 8px; padding: 6px 12px; font-weight: 600;
            cursor: pointer; font-size: 12px; transition: all 0.2s;
            box-shadow: 0 2px 8px rgba(163, 230, 53, 0.3);">?�로고침</button>
        </div>
        <style>
          @keyframes slideInUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        </style>`
      
      document.body.appendChild(toast)
      
      // ?�로고침 버튼 ?�벤??      document.getElementById('refreshApp')?.addEventListener('click', () => {
        updateSW(true)
        toast.style.animation = 'slideInUp 0.3s ease-out reverse'
        setTimeout(() => toast.remove(), 300)
      })
      
      // 10�????�동 ?�거
      setTimeout(() => {
        if (document.body.contains(toast)) {
          toast.style.animation = 'slideInUp 0.3s ease-out reverse'
          setTimeout(() => toast.remove(), 300)
        }
      }, 10000)
    },
    onOfflineReady() {
      // ?�프?�인 준�??�료 ?�스??      const offlineToast = document.createElement('div')
      offlineToast.innerHTML = `
        <div style="
          position: fixed; bottom: 24px; right: 24px;
          background: linear-gradient(135deg, #10B981 0%, #059669 100%); 
          color: white; padding: 12px 16px;
          border-radius: 12px; font-size: 13px;
          display: flex; align-items: center; gap: 8px;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
          z-index: 9999; font-family: Pretendard, sans-serif;
          animation: slideInUp 0.3s ease-out;">
          <div style="font-size: 18px;">?��</div>
          <div>?�프?�인?�서???�용 가?�합?�다!</div>
        </div>`
      
      document.body.appendChild(offlineToast)
      setTimeout(() => {
        if (document.body.contains(offlineToast)) {
          offlineToast.style.animation = 'slideInUp 0.3s ease-out reverse'
          setTimeout(() => offlineToast.remove(), 300)
        }
      }, 3000)
      
      console.log('??PWA: ?�프?�인 준�??�료!')
    },
  });
  
  return updateSW;
}
