// ?�� AI ?�?�형 관리자 ?�이지 - 천재 모드 5?�계
import { useState, useEffect } from 'react';
import { useSpeech } from '@/hooks/useSpeech';
import { useVoiceCommand } from '@/hooks/useVoiceCommand';
import { analyzeQuery, getQueryType, getChartType } from '@/hooks/useAdminAI';
import ReportChart from '@/components/ReportChart';
import { Mic, MicOff, Brain, BarChart3, RefreshCw, MessageCircle } from 'lucide-react';

interface AnalysisResult {
  reply: string;
  reports: any[];
  chartData: any[];
  insights: {
    trend: string;
    comparison: string;
    recommendation: string;
  };
}

export default function AdminAIChat() {
  const [answer, setAnswer] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const { speak, stop, speaking } = useSpeech();

  // ?�성 명령 처리
  const handleVoiceResult = async (text: string) => {
    if (!text.trim()) return;
    
    console.log('?�� ?�성 명령 ?�식:', text);
    setLastQuery(text);
    setLoading(true);
    
    // 분석 ?�작 ?�성 ?�내
    speak(`"${text}" 분석 중입?�다. ?�시�?기다?�주?�요.`);
    
    try {
      const result: AnalysisResult = await analyzeQuery(text);
      
      setAnswer(result.reply);
      setReports(result.reports);
      setChartData(result.chartData);
      setInsights(result.insights);
      
      // 쿼리 ?�스?�리??추�?
      setQueryHistory(prev => [text, ...prev.slice(0, 4)]); // 최�? 5�??��?
      
      // AI ?�답???�성?�로 ?�생
      setTimeout(() => {
        speak(result.reply);
      }, 1000);
      
    } catch (error) {
      console.error('??AI 분석 ?�패:', error);
      const errorMessage = '죄송?�니?? ?�이??분석 �??�류가 발생?�습?�다. ?�시 ?�도?�주?�요.';
      setAnswer(errorMessage);
      speak(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const { start, stop: stopVoice, listening } = useVoiceCommand(handleVoiceResult);

  // ?�스???�력?�로??분석 가??  const handleTextSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('query') as string;
    if (query.trim()) {
      await handleVoiceResult(query);
      (e.target as HTMLFormElement).reset();
    }
  };

  // 차트 ?�??결정
  const chartType = lastQuery ? getChartType(getQueryType(lastQuery), reports) : 'line';

  // ?�시 질문??  const exampleQueries = [
    "?�번 �?가??추세 그래??보여�?,
    "지?�주보다 거래?�이 ?�었??",
    "최근 7???�이???�약?�줘",
    "?�답�?변??추이 ?�려�?,
    "?�늘�??�제 비교?�줘"
  ];

  return (
    <main className="min-h-dvh bg-[#0B0B0D] text-white p-4 sm:p-6 space-y-6">
      {/* ?�더 */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            ?�� AI ?�?�형 관리자
          </h1>
          <p className="text-sm text-white/60 mt-1">
            ?�성?�로 ?�이?��? 분석?�고 ?�각?�해?�립?�다
          </p>
        </div>
        
        <button
          onClick={listening ? stopVoice : start}
          disabled={loading}
          className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
            listening 
              ? 'bg-red-500 hover:bg-red-600' 
              : loading
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-lime-400 text-black hover:bg-lime-300'
          }`}
        >
          {listening ? (
            <>
              <MicOff className="w-5 h-5" />
              ?�� ?�기 중�?
            </>
          ) : loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              분석 �?..
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              ?�� 말하�??�작
            </>
          )}
        </button>
      </header>

      {/* ?�시 질문??*/}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
        <h3 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
          ?�� ?�시 질문??(?�릭?�서 ?�도?�보?�요)
        </h3>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((query, index) => (
            <button
              key={index}
              onClick={() => handleVoiceResult(query)}
              disabled={loading}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {query}
            </button>
          ))}
        </div>
      </div>

      {/* ?�스???�력 */}
      <form onSubmit={handleTextSubmit} className="bg-white/5 rounded-2xl p-4 border border-white/10">
        <div className="flex gap-3">
          <input
            name="query"
            type="text"
            placeholder="?�스?�로??질문?????�어?? '?�번 �?거래 추세 ?�려�?"
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-lime-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-lime-400 text-black rounded-xl font-semibold hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Brain className="w-5 h-5" />
            분석
          </button>
        </div>
      </form>

      {/* 쿼리 ?�스?�리 */}
      {queryHistory.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <h3 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            최근 질문??          </h3>
          <div className="flex flex-wrap gap-2">
            {queryHistory.map((query, index) => (
              <button
                key={index}
                onClick={() => handleVoiceResult(query)}
                disabled={loading}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI ?�답 */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI 분석 결과
          </h3>
          {speaking && (
            <div className="flex items-center gap-2 text-lime-400">
              <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
              <span className="text-sm">?�성 ?�생 �?..</span>
              <button 
                onClick={stop}
                className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30"
              >
                ?��?
              </button>
            </div>
          )}
        </div>
        
        {answer ? (
          <div className="space-y-4">
            <p className="whitespace-pre-wrap text-base leading-relaxed text-white/90">
              {answer}
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">?���?/div>
            <p className="text-white/60 text-lg mb-2">
              "?�번 �?거래 추세 ?�려�??�고 말해보세??            </p>
            <p className="text-white/40 text-sm">
              ?�는 ?�의 ?�시 질문???�릭?�보?�요
            </p>
          </div>
        )}
      </div>

      {/* 차트 ?�각??*/}
      {chartData.length > 0 && (
        <ReportChart 
          data={chartData} 
          type={chartType as 'line' | 'bar' | 'pie'}
          title={`${lastQuery} - ?�이??분석`}
          insights={insights}
        />
      )}

      {/* 로딩 ?�태 */}
      {loading && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center">
          <div className="flex items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-lime-400" />
            <span className="text-lg">AI가 ?�이?��? 분석?�고 ?�습?�다...</span>
          </div>
          <div className="mt-4 text-sm text-white/60">
            Firestore ?�이??조회 ??GPT 분석 ??차트 ?�성 ???�성 ?�설
          </div>
        </div>
      )}

      {/* ?�용 가?�드 */}
      <div className="bg-gradient-to-r from-lime-500/10 to-blue-500/10 rounded-2xl p-6 border border-lime-500/20">
        <h3 className="text-lg font-semibold text-lime-400 mb-3 flex items-center gap-2">
          ?? ?�용 가?�드
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-white mb-2">?�� ?�성 명령 ?�시:</h4>
            <ul className="space-y-1 text-white/70">
              <li>??"?�번 �?가??추세 그래??보여�?</li>
              <li>??"지?�주보다 거래?�이 ?�었??"</li>
              <li>??"최근 7???�이???�약?�줘"</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">?�� 지??기능:</h4>
            <ul className="space-y-1 text-white/70">
              <li>??Firestore ?�이???�시�?분석</li>
              <li>??GPT 기반 ?�연???�설</li>
              <li>??Recharts ?�각??/li>
              <li>??TTS ?�성 ?�생</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
