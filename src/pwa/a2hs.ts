// ?”¥ A2HS (Add to Home Screen) ?¤ì¹˜ ? ë„ ê¸°ëŠ¥ - Genius Pack V1
let deferredPrompt: any = null;

export function initA2HS() {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    deferredPrompt = e;
    // ?¬ê¸°??UI ë²„íŠ¼ ?¸ì¶œ ???¬ìš©?ê? ?´ë¦­?˜ë©´ ?„ëž˜ ?¨ìˆ˜ ?¸ì¶œ
    console.log('?”¥ A2HS: ?¤ì¹˜ ê°€???íƒœ');
    
    // ?¤ì¹˜ ë²„íŠ¼ ?œì‹œ (ê´€ë¦¬ìž ?˜ì´ì§€?ì„œ)
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', promptInstall);
    }
  });
}

export async function promptInstall() {
  if (!deferredPrompt) {
    console.warn('? ï¸ A2HS: ?¤ì¹˜ ?„ë¡¬?„íŠ¸ê°€ ì¤€ë¹„ë˜ì§€ ?Šì•˜?µë‹ˆ??');
    return;
  }
  
  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('?”¥ A2HS ?¤ì¹˜ ê²°ê³¼:', outcome);
    deferredPrompt = null;
    
    if (outcome === 'accepted') {
      console.log('??PWA ?¤ì¹˜ ?¹ì¸??);
    } else {
      console.log('??PWA ?¤ì¹˜ ê±°ë???);
    }
  } catch (error) {
    console.error('??A2HS ?¤ì¹˜ ?¤ë¥˜:', error);
  }
}

// ?¤ì¹˜ ?„ë£Œ ê°ì?
export function onAppInstalled(callback: () => void) {
  window.addEventListener('appinstalled', callback);
}
