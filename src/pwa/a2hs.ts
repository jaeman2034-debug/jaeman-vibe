// ?�� A2HS (Add to Home Screen) ?�치 ?�도 기능 - Genius Pack V1
let deferredPrompt: any = null;

export function initA2HS() {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    deferredPrompt = e;
    // ?�기??UI 버튼 ?�출 ???�용?��? ?�릭?�면 ?�래 ?�수 ?�출
    console.log('?�� A2HS: ?�치 가???�태');
    
    // ?�치 버튼 ?�시 (관리자 ?�이지?�서)
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', promptInstall);
    }
  });
}

export async function promptInstall() {
  if (!deferredPrompt) {
    console.warn('?�️ A2HS: ?�치 ?�롬?�트가 준비되지 ?�았?�니??');
    return;
  }
  
  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('?�� A2HS ?�치 결과:', outcome);
    deferredPrompt = null;
    
    if (outcome === 'accepted') {
      console.log('??PWA ?�치 ?�인??);
    } else {
      console.log('??PWA ?�치 거�???);
    }
  } catch (error) {
    console.error('??A2HS ?�치 ?�류:', error);
  }
}

// ?�치 ?�료 감�?
export function onAppInstalled(callback: () => void) {
  window.addEventListener('appinstalled', callback);
}
