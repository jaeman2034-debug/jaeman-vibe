// ?’¬ AI ?€?”í˜• ê´€ë¦¬ì ?˜ì´ì§€ - ì²œì¬ ëª¨ë“œ 5?¨ê³„
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

  // ?Œì„± ëª…ë ¹ ì²˜ë¦¬
  const handleVoiceResult = async (text: string) => {
    if (!text.trim()) return;
    
    console.log('?¤ ?Œì„± ëª…ë ¹ ?¸ì‹:', text);
    setLastQuery(text);
    setLoading(true);
    
    // ë¶„ì„ ?œì‘ ?Œì„± ?ˆë‚´
    speak(`"${text}" ë¶„ì„ ì¤‘ì…?ˆë‹¤. ? ì‹œë§?ê¸°ë‹¤?¤ì£¼?¸ìš”.`);
    
    try {
      const result: AnalysisResult = await analyzeQuery(text);
      
      setAnswer(result.reply);
      setReports(result.reports);
      setChartData(result.chartData);
      setInsights(result.insights);
      
      // ì¿¼ë¦¬ ?ˆìŠ¤? ë¦¬??ì¶”ê?
      setQueryHistory(prev => [text, ...prev.slice(0, 4)]); // ìµœë? 5ê°?? ì?
      
      // AI ?‘ë‹µ???Œì„±?¼ë¡œ ?¬ìƒ
      setTimeout(() => {
        speak(result.reply);
      }, 1000);
      
    } catch (error) {
      console.error('??AI ë¶„ì„ ?¤íŒ¨:', error);
      const errorMessage = 'ì£„ì†¡?©ë‹ˆ?? ?°ì´??ë¶„ì„ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤. ?¤ì‹œ ?œë„?´ì£¼?¸ìš”.';
      setAnswer(errorMessage);
      speak(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const { start, stop: stopVoice, listening } = useVoiceCommand(handleVoiceResult);

  // ?ìŠ¤???…ë ¥?¼ë¡œ??ë¶„ì„ ê°€??  const handleTextSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('query') as string;
    if (query.trim()) {
      await handleVoiceResult(query);
      (e.target as HTMLFormElement).reset();
    }
  };

  // ì°¨íŠ¸ ?€??ê²°ì •
  const chartType = lastQuery ? getChartType(getQueryType(lastQuery), reports) : 'line';

  // ?ˆì‹œ ì§ˆë¬¸??  const exampleQueries = [
    "?´ë²ˆ ì£?ê°€??ì¶”ì„¸ ê·¸ë˜??ë³´ì—¬ì¤?,
    "ì§€?œì£¼ë³´ë‹¤ ê±°ë˜?‰ì´ ?˜ì—ˆ??",
    "ìµœê·¼ 7???°ì´???”ì•½?´ì¤˜",
    "?‘ë‹µë¥?ë³€??ì¶”ì´ ?Œë ¤ì¤?,
    "?¤ëŠ˜ê³??´ì œ ë¹„êµ?´ì¤˜"
  ];

  return (
    <main className="min-h-dvh bg-[#0B0B0D] text-white p-4 sm:p-6 space-y-6">
      {/* ?¤ë” */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            ?¤– AI ?€?”í˜• ê´€ë¦¬ì
          </h1>
          <p className="text-sm text-white/60 mt-1">
            ?Œì„±?¼ë¡œ ?°ì´?°ë? ë¶„ì„?˜ê³  ?œê°?”í•´?œë¦½?ˆë‹¤
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
              ?›‘ ?£ê¸° ì¤‘ì?
            </>
          ) : loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              ë¶„ì„ ì¤?..
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              ?¤ ë§í•˜ê¸??œì‘
            </>
          )}
        </button>
      </header>

      {/* ?ˆì‹œ ì§ˆë¬¸??*/}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
        <h3 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
          ?’¡ ?ˆì‹œ ì§ˆë¬¸??(?´ë¦­?´ì„œ ?œë„?´ë³´?¸ìš”)
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

      {/* ?ìŠ¤???…ë ¥ */}
      <form onSubmit={handleTextSubmit} className="bg-white/5 rounded-2xl p-4 border border-white/10">
        <div className="flex gap-3">
          <input
            name="query"
            type="text"
            placeholder="?ìŠ¤?¸ë¡œ??ì§ˆë¬¸?????ˆì–´?? '?´ë²ˆ ì£?ê±°ë˜ ì¶”ì„¸ ?Œë ¤ì¤?"
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-lime-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-lime-400 text-black rounded-xl font-semibold hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Brain className="w-5 h-5" />
            ë¶„ì„
          </button>
        </div>
      </form>

      {/* ì¿¼ë¦¬ ?ˆìŠ¤? ë¦¬ */}
      {queryHistory.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <h3 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            ìµœê·¼ ì§ˆë¬¸??          </h3>
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

      {/* AI ?‘ë‹µ */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI ë¶„ì„ ê²°ê³¼
          </h3>
          {speaking && (
            <div className="flex items-center gap-2 text-lime-400">
              <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
              <span className="text-sm">?Œì„± ?¬ìƒ ì¤?..</span>
              <button 
                onClick={stop}
                className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30"
              >
                ?•ì?
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
            <div className="text-6xl mb-4">?™ï¸?/div>
            <p className="text-white/60 text-lg mb-2">
              "?´ë²ˆ ì£?ê±°ë˜ ì¶”ì„¸ ?Œë ¤ì¤??¼ê³  ë§í•´ë³´ì„¸??            </p>
            <p className="text-white/40 text-sm">
              ?ëŠ” ?„ì˜ ?ˆì‹œ ì§ˆë¬¸???´ë¦­?´ë³´?¸ìš”
            </p>
          </div>
        )}
      </div>

      {/* ì°¨íŠ¸ ?œê°??*/}
      {chartData.length > 0 && (
        <ReportChart 
          data={chartData} 
          type={chartType as 'line' | 'bar' | 'pie'}
          title={`${lastQuery} - ?°ì´??ë¶„ì„`}
          insights={insights}
        />
      )}

      {/* ë¡œë”© ?íƒœ */}
      {loading && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center">
          <div className="flex items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-lime-400" />
            <span className="text-lg">AIê°€ ?°ì´?°ë? ë¶„ì„?˜ê³  ?ˆìŠµ?ˆë‹¤...</span>
          </div>
          <div className="mt-4 text-sm text-white/60">
            Firestore ?°ì´??ì¡°íšŒ ??GPT ë¶„ì„ ??ì°¨íŠ¸ ?ì„± ???Œì„± ?´ì„¤
          </div>
        </div>
      )}

      {/* ?¬ìš© ê°€?´ë“œ */}
      <div className="bg-gradient-to-r from-lime-500/10 to-blue-500/10 rounded-2xl p-6 border border-lime-500/20">
        <h3 className="text-lg font-semibold text-lime-400 mb-3 flex items-center gap-2">
          ?? ?¬ìš© ê°€?´ë“œ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-white mb-2">?¤ ?Œì„± ëª…ë ¹ ?ˆì‹œ:</h4>
            <ul className="space-y-1 text-white/70">
              <li>??"?´ë²ˆ ì£?ê°€??ì¶”ì„¸ ê·¸ë˜??ë³´ì—¬ì¤?</li>
              <li>??"ì§€?œì£¼ë³´ë‹¤ ê±°ë˜?‰ì´ ?˜ì—ˆ??"</li>
              <li>??"ìµœê·¼ 7???°ì´???”ì•½?´ì¤˜"</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">?“Š ì§€??ê¸°ëŠ¥:</h4>
            <ul className="space-y-1 text-white/70">
              <li>??Firestore ?°ì´???¤ì‹œê°?ë¶„ì„</li>
              <li>??GPT ê¸°ë°˜ ?ì—°???´ì„¤</li>
              <li>??Recharts ?œê°??/li>
              <li>??TTS ?Œì„± ?¬ìƒ</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
