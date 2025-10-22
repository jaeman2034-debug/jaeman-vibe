// ?�� ?�국??TTS ?�스??버튼 - 천재 모드 3?�계
import { useSpeech } from '@/hooks/useSpeech';

export default function MultilingualTestButton() {
  const { speak, stop, speaking, detectLang } = useSpeech();

  const testTexts = {
    korean: "?�녕?�세?? ?�늘??AI 리포?�입?�다. ?�규 가?�자 25�? 거래??45�? ?�답�?88%�?기록?�습?�다. ?�반?�으�??�호???�과�?보이�??�습?�다.",
    english: "Hello! Today's AI report shows 25 new users, 45 transactions, and 88% response rate. Overall performance is good.",
    mixed: "Hello! ?�늘??AI 리포?�입?�다. New users 25�? transactions 45�? response rate 88%. ?�반?�으�?good performance?�니??"
  };

  const handleTest = (text: string, label: string) => {
    const detectedLang = detectLang(text);
    console.log(`?�� ?�스???�스??(${label}):`, text);
    console.log(`?�� 감�????�어:`, detectedLang);
    speak(text);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        ?�� ?�국??TTS ?�스??      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => handleTest(testTexts.korean, '?�국??)}
          disabled={speaking}
          className="px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ?��?�� ?�국???�스??        </button>
        
        <button
          onClick={() => handleTest(testTexts.english, '?�어')}
          disabled={speaking}
          className="px-4 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ?��?�� English Test
        </button>
        
        <button
          onClick={() => handleTest(testTexts.mixed, '?�합')}
          disabled={speaking}
          className="px-4 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ?�� Mixed Language
        </button>
      </div>

      {speaking && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <span className="text-sm text-gray-600 ml-2">?�성 ?�생 �?..</span>
          <button
            onClick={stop}
            className="ml-4 px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
          >
            중�?
          </button>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        ?�� �?버튼???�릭?�여 ?�어 ?�동 감�? �?TTS ?�생???�스?�해보세??
      </div>
    </div>
  );
}
