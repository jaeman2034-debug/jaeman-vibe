// ?�� YAGO VIBE 관리자 AI ?�약 카드 + TTS - 천재 모드 3?�계 (?�국??+ ???�라?�더)
import { useEffect, useMemo } from "react";
import { useSpeech } from "@/hooks/useSpeech";
import { Slider } from "@/components/ui/slider";

type Props = {
  today: { ai: number; seller: number; avg: number; total: number }; // ?�균 ?�답(�?
  weekly?: { aiAvg: number; sellerAvg: number; respAvg: number; totalAvg: number }; // ?�택
  autoplay?: boolean; // true�??�이지 진입 ???�동 ??��
};

export default function AdminSummaryCard({ today, weekly, autoplay = false }: Props) {
  const { speak, stop, speaking, isSupported, rate, setRate, pitch, setPitch, detectLang } = useSpeech();

  // ?�약 ?�스???�성
  const summaryText = useMemo(() => {
    const date = new Date().toLocaleDateString("ko-KR", {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    
    const todayLine = `?�늘 ${date} AI ?�답 ${today.ai}�? ?�매???�답 ${today.seller}�? ?�균 ?�답?�간 ${today.avg}분입?�다.`;
    
    const weeklyLine = weekly
      ? `최근 7???�균?� AI ${weekly.aiAvg}�? ?�매??${weekly.sellerAvg}�? ?�균 ?�답?�간 ${weekly.respAvg}분입?�다.`
      : "";
    
    const totalLine = `�?메시지 ${today.total}건이 처리?�었?�니??`;
    
    return `${todayLine} ${weeklyLine} ${totalLine}`.trim();
  }, [today, weekly]);

  // ?�성 ?�생 ?�수 (?�국???�동 감�?)
  const handleSpeak = () => {
    if (!isSupported) {
      alert("??브라?��????�성 출력??지?�하지 ?�습?�다.");
      return;
    }
    speak(summaryText); // ?�어 ?�동 감�?
  };

  // ?�동 ?�생 (?�이지 진입 ??
  useEffect(() => {
    if (autoplay && isSupported) {
      // iOS ???�동?�생 ?�한 ?�?? ?�짝 지??      const timer = setTimeout(() => {
        handleSpeak();
      }, 800); // 0.8�?지??      
      return () => clearTimeout(timer);
    }
  }, [autoplay, isSupported]);

  // 컴포?�트 ?�마?�트 ???�성 ?�리
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
        <p className="font-semibold">?�️ 브라?��?가 ?�성 출력??지?�하지 ?�습?�다.</p>
        <p className="text-sm mt-1">Chrome, Edge ??최신 브라?��?�??�용?�주?�요.</p>
      </div>
    );
  }

  const detectedLanguage = detectLang(summaryText);
  const languageFlag = detectedLanguage.startsWith('ko') ? '?��?��' : '?��?��';
  const languageName = detectedLanguage.startsWith('ko') ? '?�국?? : 'English';

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4 sm:p-6 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
            <p className="text-sm font-semibold text-indigo-700">?�� AI ?�약 리포??/p>
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

          {/* 추�? ?�계 ?�보 */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white/60 rounded-lg p-2 text-center">
              <div className="font-semibold text-indigo-700">{today.ai}</div>
              <div className="text-gray-600">AI ?�답</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2 text-center">
              <div className="font-semibold text-green-700">{today.seller}</div>
              <div className="text-gray-600">?�매???�답</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2 text-center">
              <div className="font-semibold text-yellow-700">{today.avg}�?/div>
              <div className="text-gray-600">?�균 ?�답</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2 text-center">
              <div className="font-semibold text-purple-700">{today.total}</div>
              <div className="text-gray-600">�?메시지</div>
            </div>
          </div>
        </div>

        {/* ?�성 ?�어 버튼 */}
        <div className="flex flex-col gap-2 shrink-0">
          {!speaking ? (
            <button
              onClick={handleSpeak}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md"
              aria-label="?�약 ?�성 ?�생"
              title="?�약 ?�성 ?�생"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              ?�기
            </button>
          ) : (
            <button
              onClick={stop}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-500 text-white text-sm font-medium hover:bg-gray-600 transition-colors shadow-md"
              aria-label="?�성 중�?"
              title="?�성 중�?"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 011 1v4a1 1 0 11-2 0V8a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              중�?
            </button>
          )}

          {/* ?�동 ?�생 ?�정 ?�시 */}
          {autoplay && (
            <div className="text-xs text-indigo-600 text-center">
              ?�동 ?�생 ?�성??            </div>
          )}
        </div>
      </div>

      {/* ?���????�라?�더 컨트�?*/}
      <div className="pt-4 mt-4 border-t border-indigo-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* ?�도 조절 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">?���??�도</label>
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

          {/* ?�치 조절 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">?�� ?�치</label>
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

        {/* ?�시�?조절 ?�내 */}
        <div className="mt-3 text-xs text-gray-500 text-center">
          ?�� ?�라?�더�??�직이�??�음 ?�생부???�용?�니??        </div>
      </div>
    </div>
  );
}
