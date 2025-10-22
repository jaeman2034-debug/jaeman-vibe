// ?¤ ?Œì„± ?œì–´ ?¨ë„ - ì²œì¬ ëª¨ë“œ 4?¨ê³„
import { useVoiceCommand } from '@/hooks/useVoiceCommand';
import { useSpeech } from '@/hooks/useSpeech';
import { parseDateCommand, parseAction, parseStatType } from '@/utils/parseDateCommand';
import { getReportByDate, generateReportSummary } from '@/api/getReportByDate';
import { useState } from 'react';

interface VoiceControlPanelProps {
  onReportUpdate?: (report: any) => void;
}

export default function VoiceControlPanel({ onReportUpdate }: VoiceControlPanelProps) {
  const { speak } = useSpeech();
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVoiceResult = async (text: string) => {
    setIsProcessing(true);
    
    try {
      // ëª…ë ¹??ë¶„ì„
      const dateId = parseDateCommand(text);
      const action = parseAction(text);
      const statType = parseStatType(text);
      
      console.log('?¯ ?Œì„± ëª…ë ¹ ë¶„ì„:', {
        text,
        dateId,
        action,
        statType
      });

      // ?Œì„± ?¼ë“œë°?      speak(`"${text}" ëª…ë ¹???¸ì‹?ˆìŠµ?ˆë‹¤. ?°ì´?°ë? ì¡°íšŒ?˜ê³  ?ˆìŠµ?ˆë‹¤.`);

      // Firestore?ì„œ ë¦¬í¬??ì¡°íšŒ
      const report = await getReportByDate(dateId);
      
      if (report) {
        setCurrentReport(report);
        onReportUpdate?.(report);
        
        // ?”ì•½ ?ì„± ë°??Œì„± ?¬ìƒ
        const summary = generateReportSummary(report, action, statType);
        speak(summary);
        
        console.log('??ë¦¬í¬??ì¡°íšŒ ë°??Œì„± ?¬ìƒ ?„ë£Œ:', summary);
      } else {
        // ë¦¬í¬?¸ê? ?†ëŠ” ê²½ìš°
        const dateStr = new Date(dateId).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        });
        
        const notFoundMessage = `ì£„ì†¡?©ë‹ˆ?? ${dateStr} ë¦¬í¬?¸ë? ì°¾ì„ ???†ìŠµ?ˆë‹¤.`;
        speak(notFoundMessage);
        
        console.log('??ë¦¬í¬?¸ë? ì°¾ì„ ???†ìŒ:', dateId);
      }
    } catch (error) {
      console.error('???Œì„± ëª…ë ¹ ì²˜ë¦¬ ?¤íŒ¨:', error);
      speak('ì£„ì†¡?©ë‹ˆ?? ëª…ë ¹??ì²˜ë¦¬?˜ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
    } finally {
      setIsProcessing(false);
    }
  };

  const { start, stop, listening, isSupported, error } = useVoiceCommand(handleVoiceResult);

  if (!isSupported) {
    return (
      <div className="bg-red-100 border border-red-200 rounded-xl p-4 text-red-800">
        <p className="font-semibold">? ï¸ ?Œì„± ?¸ì‹??ì§€?í•˜ì§€ ?ŠëŠ” ë¸Œë¼?°ì??…ë‹ˆ??</p>
        <p className="text-sm mt-1">Chrome, Edge ??ìµœì‹  ë¸Œë¼?°ì?ë¥??¬ìš©?´ì£¼?¸ìš”.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        ?¤ ?Œì„± ?œì–´ ?¨ë„
      </h2>
      
      {/* ?Œì„± ?¸ì‹ ?íƒœ */}
      <div className="mb-4">
        {listening ? (
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-red-700 font-medium">?Œì„± ?¸ì‹ ì¤?..</span>
            <button
              onClick={stop}
              className="ml-auto px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              ì¤‘ì?
            </button>
          </div>
        ) : (
          <button
            onClick={start}
            disabled={isProcessing}
            className="w-full px-4 py-3 bg-lime-400 text-black rounded-lg font-semibold hover:bg-lime-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            ?¤ ë§í•˜ê¸??œì‘
          </button>
        )}
      </div>

      {/* ì²˜ë¦¬ ?íƒœ */}
      {isProcessing && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-700">ëª…ë ¹??ì²˜ë¦¬?˜ê³  ?ˆìŠµ?ˆë‹¤...</span>
          </div>
        </div>
      )}

      {/* ?¤ë¥˜ ë©”ì‹œì§€ */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">??{error}</p>
        </div>
      )}

      {/* ?¬ìš© ê°€?¥í•œ ëª…ë ¹???ˆë‚´ */}
      <div className="text-sm text-gray-600 space-y-2">
        <p className="font-medium">?’¡ ?¬ìš© ê°€?¥í•œ ëª…ë ¹??</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>"?¤ëŠ˜ ë¦¬í¬???½ì–´ì¤?</li>
          <li>"?´ì œ ê°€?…ì ëª?ëª…ì´??"</li>
          <li>"?´ë²ˆì£?ê±°ë˜???Œë ¤ì¤?</li>
          <li>"ìµœê·¼ ?‘ë‹µë¥?ë³´ì—¬ì¤?</li>
          <li>"ê·¸ì œ ë¦¬í¬???”ì•½?´ì¤˜"</li>
        </ul>
      </div>

      {/* ?„ì¬ ë¦¬í¬???•ë³´ */}
      {currentReport && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm font-medium">
            ?“Š ìµœê·¼ ì¡°íšŒ??ë¦¬í¬?? {new Date(currentReport.createdAt).toLocaleDateString('ko-KR')}
          </p>
        </div>
      )}
    </div>
  );
}
