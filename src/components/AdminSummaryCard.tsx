// ?”¥ YAGO VIBE ê´€ë¦¬ì AI ?”ì•½ ì¹´ë“œ + TTS - ì²œì¬ ëª¨ë“œ 3?¨ê³„ (?¤êµ­??+ ???¬ë¼?´ë”)
import { useEffect, useMemo } from "react";
import { useSpeech } from "@/hooks/useSpeech";
import { Slider } from "@/components/ui/slider";

type Props = {
  today: { ai: number; seller: number; avg: number; total: number }; // ?‰ê·  ?‘ë‹µ(ë¶?
  weekly?: { aiAvg: number; sellerAvg: number; respAvg: number; totalAvg: number }; // ? íƒ
  autoplay?: boolean; // trueë©??˜ì´ì§€ ì§„ì… ???ë™ ??…
};

export default function AdminSummaryCard({ today, weekly, autoplay = false }: Props) {
  const { speak, stop, speaking, isSupported, rate, setRate, pitch, setPitch, detectLang } = useSpeech();

  // ?”ì•½ ?ìŠ¤???ì„±
  const summaryText = useMemo(() => {
    const date = new Date().toLocaleDateString("ko-KR", {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    
    const todayLine = `?¤ëŠ˜ ${date} AI ?‘ë‹µ ${today.ai}ê±? ?ë§¤???‘ë‹µ ${today.seller}ê±? ?‰ê·  ?‘ë‹µ?œê°„ ${today.avg}ë¶„ì…?ˆë‹¤.`;
    
    const weeklyLine = weekly
      ? `ìµœê·¼ 7???‰ê· ?€ AI ${weekly.aiAvg}ê±? ?ë§¤??${weekly.sellerAvg}ê±? ?‰ê·  ?‘ë‹µ?œê°„ ${weekly.respAvg}ë¶„ì…?ˆë‹¤.`
      : "";
    
    const totalLine = `ì´?ë©”ì‹œì§€ ${today.total}ê±´ì´ ì²˜ë¦¬?˜ì—ˆ?µë‹ˆ??`;
    
    return `${todayLine} ${weeklyLine} ${totalLine}`.trim();
  }, [today, weekly]);

  // ?Œì„± ?¬ìƒ ?¨ìˆ˜ (?¤êµ­???ë™ ê°ì?)
  const handleSpeak = () => {
    if (!isSupported) {
      alert("??ë¸Œë¼?°ì????Œì„± ì¶œë ¥??ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤.");
      return;
    }
    speak(summaryText); // ?¸ì–´ ?ë™ ê°ì?
  };

  // ?ë™ ?¬ìƒ (?˜ì´ì§€ ì§„ì… ??
  useEffect(() => {
    if (autoplay && isSupported) {
      // iOS ???ë™?¬ìƒ ?œí•œ ?€?? ?´ì§ ì§€??      const timer = setTimeout(() => {
        handleSpeak();
      }, 800); // 0.8ì´?ì§€??      
      return () => clearTimeout(timer);
    }
  }, [autoplay, isSupported]);

  // ì»´í¬?ŒíŠ¸ ?¸ë§ˆ?´íŠ¸ ???Œì„± ?•ë¦¬
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isSupported) {
    return (
      <div className="bg-red-100 border border-red-200 rounded-2xl p-4 sm:p-5 shadow-sm text-red-800">
        <p className="font-semibold">? ï¸ ë¸Œë¼?°ì?ê°€ ?Œì„± ì¶œë ¥??ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤.</p>
        <p className="text-sm mt-1">Chrome, Edge ??ìµœì‹  ë¸Œë¼?°ì?ë¥??¬ìš©?´ì£¼?¸ìš”.</p>
      </div>
    );
  }

  const detectedLanguage = detectLang(summaryText);
  const languageFlag = detectedLanguage.startsWith('ko') ? '?‡°?‡·' : '?‡º?‡¸';
  const languageName = detectedLanguage.startsWith('ko') ? '?œêµ­?? : 'English';

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4 sm:p-6 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
            <p className="text-sm font-semibold text-indigo-700">?“£ AI ?”ì•½ ë¦¬í¬??/p>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
              {languageFlag} {languageName}
            </span>
            {speaking && (
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            )}
          </div>
          
          <p className="text-gray-800 leading-relaxed text-sm sm:text-base">
            {summaryText}
          </p>

          {/* ì¶”ê? ?µê³„ ?•ë³´ */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white/60 rounded-lg p-2 text-center">
              <div className="font-semibold text-indigo-700">{today.ai}</div>
              <div className="text-gray-600">AI ?‘ë‹µ</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2 text-center">
              <div className="font-semibold text-green-700">{today.seller}</div>
              <div className="text-gray-600">?ë§¤???‘ë‹µ</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2 text-center">
              <div className="font-semibold text-yellow-700">{today.avg}ë¶?/div>
              <div className="text-gray-600">?‰ê·  ?‘ë‹µ</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2 text-center">
              <div className="font-semibold text-purple-700">{today.total}</div>
              <div className="text-gray-600">ì´?ë©”ì‹œì§€</div>
            </div>
          </div>
        </div>

        {/* ?Œì„± ?œì–´ ë²„íŠ¼ */}
        <div className="flex flex-col gap-2 shrink-0">
          {!speaking ? (
            <button
              onClick={handleSpeak}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md"
              aria-label="?”ì•½ ?Œì„± ?¬ìƒ"
              title="?”ì•½ ?Œì„± ?¬ìƒ"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              ?½ê¸°
            </button>
          ) : (
            <button
              onClick={stop}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-500 text-white text-sm font-medium hover:bg-gray-600 transition-colors shadow-md"
              aria-label="?Œì„± ì¤‘ì?"
              title="?Œì„± ì¤‘ì?"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 011 1v4a1 1 0 11-2 0V8a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              ì¤‘ì?
            </button>
          )}

          {/* ?ë™ ?¬ìƒ ?¤ì • ?œì‹œ */}
          {autoplay && (
            <div className="text-xs text-indigo-600 text-center">
              ?ë™ ?¬ìƒ ?œì„±??            </div>
          )}
        </div>
      </div>

      {/* ?šï¸????¬ë¼?´ë” ì»¨íŠ¸ë¡?*/}
      <div className="pt-4 mt-4 border-t border-indigo-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* ?ë„ ì¡°ì ˆ */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">?šï¸??ë„</label>
              <span className="text-sm text-gray-600">{rate.toFixed(1)}x</span>
            </div>
            <Slider 
              min={0.5} 
              max={2.0} 
              step={0.1} 
              value={[rate]} 
              onValueChange={(v) => setRate(v[0])}
              className="w-full"
            />
          </div>

          {/* ?¼ì¹˜ ì¡°ì ˆ */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">?µ ?¼ì¹˜</label>
              <span className="text-sm text-gray-600">{pitch.toFixed(1)}</span>
            </div>
            <Slider 
              min={0.5} 
              max={2.0} 
              step={0.1} 
              value={[pitch]} 
              onValueChange={(v) => setPitch(v[0])}
              className="w-full"
            />
          </div>
        </div>

        {/* ?¤ì‹œê°?ì¡°ì ˆ ?ˆë‚´ */}
        <div className="mt-3 text-xs text-gray-500 text-center">
          ?’¡ ?¬ë¼?´ë”ë¥??€ì§ì´ë©??¤ìŒ ?¬ìƒë¶€???ìš©?©ë‹ˆ??        </div>
      </div>
    </div>
  );
}
