// ?î• PWA ?§Ïπò ?†ÎèÑ Ïª¥Ìè¨?åÌä∏
import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    // Android/Chrome ?§Ïπò ?ÑÎ°¨?ÑÌä∏
    window.addEventListener('beforeinstallprompt', handler as any);
    
    // ?§Ïπò ?ÑÎ£å Í∞êÏ?
    window.addEventListener('appinstalled', () => setInstalled(true));

    // iOS Safari Í∞êÏ?
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isIOS && !isInStandaloneMode && !installed) {
      setShowIOSGuide(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as any);
    };
  }, [installed]);

  if (installed) return null;

  // Android/Chrome ?§Ïπò ?ÑÎ°¨?ÑÌä∏
  if (deferred) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">VIBE Admin ?§Ïπò</h3>
              <p className="text-gray-600 text-xs mt-1">
                ???îÎ©¥??Ï∂îÍ??òÏó¨ Îπ†Î•¥Í≤??ëÍ∑º?òÏÑ∏??              </p>
              <div className="flex gap-2 mt-3">
                <button
                  className="px-3 py-2 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                  onClick={async () => {
                    await deferred.prompt();
                    const choice = await deferred.userChoice;
                    if (choice.outcome === 'accepted') {
                      setDeferred(null);
                    }
                  }}
                >
                  ?§Ïπò
                </button>
                <button 
                  className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                  onClick={() => setDeferred(null)}
                >
                  ?òÏ§ë??                </button>
              </div>
            </div>
            <button
              onClick={() => setDeferred(null)}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS Safari ?§Ïπò Í∞Ä?¥Îìú
  if (showIOSGuide) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">iOS?êÏÑú ?§Ïπò?òÍ∏∞</h3>
              <p className="text-gray-600 text-xs mt-1">
                ?òÎã® Í≥µÏú† Î≤ÑÌäº ??"???îÎ©¥??Ï∂îÍ?" ?†ÌÉù
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                  onClick={() => setShowIOSGuide(false)}
                >
                  ?ïÏù∏
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
