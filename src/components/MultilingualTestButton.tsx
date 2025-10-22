// ?Œ ?¤êµ­??TTS ?ŒìŠ¤??ë²„íŠ¼ - ì²œì¬ ëª¨ë“œ 3?¨ê³„
import { useSpeech } from '@/hooks/useSpeech';

export default function MultilingualTestButton() {
  const { speak, stop, speaking, detectLang } = useSpeech();

  const testTexts = {
    korean: "?ˆë…•?˜ì„¸?? ?¤ëŠ˜??AI ë¦¬í¬?¸ì…?ˆë‹¤. ? ê·œ ê°€?…ì 25ëª? ê±°ë˜??45ê±? ?‘ë‹µë¥?88%ë¥?ê¸°ë¡?ˆìŠµ?ˆë‹¤. ?„ë°˜?ìœ¼ë¡??‘í˜¸???±ê³¼ë¥?ë³´ì´ê³??ˆìŠµ?ˆë‹¤.",
    english: "Hello! Today's AI report shows 25 new users, 45 transactions, and 88% response rate. Overall performance is good.",
    mixed: "Hello! ?¤ëŠ˜??AI ë¦¬í¬?¸ì…?ˆë‹¤. New users 25ëª? transactions 45ê±? response rate 88%. ?„ë°˜?ìœ¼ë¡?good performance?…ë‹ˆ??"
  };

  const handleTest = (text: string, label: string) => {
    const detectedLang = detectLang(text);
    console.log(`?Œ ?ŒìŠ¤???ìŠ¤??(${label}):`, text);
    console.log(`?” ê°ì????¸ì–´:`, detectedLang);
    speak(text);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        ?Œ ?¤êµ­??TTS ?ŒìŠ¤??      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => handleTest(testTexts.korean, '?œêµ­??)}
          disabled={speaking}
          className="px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ?‡°?‡· ?œêµ­???ŒìŠ¤??        </button>
        
        <button
          onClick={() => handleTest(testTexts.english, '?ì–´')}
          disabled={speaking}
          className="px-4 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ?‡º?‡¸ English Test
        </button>
        
        <button
          onClick={() => handleTest(testTexts.mixed, '?¼í•©')}
          disabled={speaking}
          className="px-4 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ?Œ Mixed Language
        </button>
      </div>

      {speaking && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <span className="text-sm text-gray-600 ml-2">?Œì„± ?¬ìƒ ì¤?..</span>
          <button
            onClick={stop}
            className="ml-4 px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
          >
            ì¤‘ì?
          </button>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        ?’¡ ê°?ë²„íŠ¼???´ë¦­?˜ì—¬ ?¸ì–´ ?ë™ ê°ì? ë°?TTS ?¬ìƒ???ŒìŠ¤?¸í•´ë³´ì„¸??
      </div>
    </div>
  );
}
