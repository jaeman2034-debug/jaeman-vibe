// ?�� ?�성 ?�어 ?�널 - 천재 모드 4?�계
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
      // 명령??분석
      const dateId = parseDateCommand(text);
      const action = parseAction(text);
      const statType = parseStatType(text);
      
      console.log('?�� ?�성 명령 분석:', {
        text,
        dateId,
        action,
        statType
      });

      // ?�성 ?�드�?      speak(`"${text}" 명령???�식?�습?�다. ?�이?��? 조회?�고 ?�습?�다.`);

      // Firestore?�서 리포??조회
      const report = await getReportByDate(dateId);
      
      if (report) {
        setCurrentReport(report);
        onReportUpdate?.(report);
        
        // ?�약 ?�성 �??�성 ?�생
        const summary = generateReportSummary(report, action, statType);
        speak(summary);
        
        console.log('??리포??조회 �??�성 ?�생 ?�료:', summary);
      } else {
        // 리포?��? ?�는 경우
        const dateStr = new Date(dateId).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        });
        
        const notFoundMessage = `죄송?�니?? ${dateStr} 리포?��? 찾을 ???�습?�다.`;
        speak(notFoundMessage);
        
        console.log('??리포?��? 찾을 ???�음:', dateId);
      }
    } catch (error) {
      console.error('???�성 명령 처리 ?�패:', error);
      speak('죄송?�니?? 명령??처리?�는 �??�류가 발생?�습?�다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const { start, stop, listening, isSupported, error } = useVoiceCommand(handleVoiceResult);

  if (!isSupported) {
    return (
      <div className="bg-red-100 border border-red-200 rounded-xl p-4 text-red-800">
        <p className="font-semibold">?�️ ?�성 ?�식??지?�하지 ?�는 브라?��??�니??</p>
        <p className="text-sm mt-1">Chrome, Edge ??최신 브라?��?�??�용?�주?�요.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        ?�� ?�성 ?�어 ?�널
      </h2>
      
      {/* ?�성 ?�식 ?�태 */}
      <div className="mb-4">
        {listening ? (
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-red-700 font-medium">?�성 ?�식 �?..</span>
            <button
              onClick={stop}
              className="ml-auto px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              중�?
            </button>
          </div>
        ) : (
          <button
            onClick={start}
            disabled={isProcessing}
            className="w-full px-4 py-3 bg-lime-400 text-black rounded-lg font-semibold hover:bg-lime-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            ?�� 말하�??�작
          </button>
        )}
      </div>

      {/* 처리 ?�태 */}
      {isProcessing && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-700">명령??처리?�고 ?�습?�다...</span>
          </div>
        </div>
      )}

      {/* ?�류 메시지 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">??{error}</p>
        </div>
      )}

      {/* ?�용 가?�한 명령???�내 */}
      <div className="text-sm text-gray-600 space-y-2">
        <p className="font-medium">?�� ?�용 가?�한 명령??</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>"?�늘 리포???�어�?</li>
          <li>"?�제 가?�자 �?명이??"</li>
          <li>"?�번�?거래???�려�?</li>
          <li>"최근 ?�답�?보여�?</li>
          <li>"그제 리포???�약?�줘"</li>
        </ul>
      </div>

      {/* ?�재 리포???�보 */}
      {currentReport && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm font-medium">
            ?�� 최근 조회??리포?? {new Date(currentReport.createdAt).toLocaleDateString('ko-KR')}
          </p>
        </div>
      )}
    </div>
  );
}
