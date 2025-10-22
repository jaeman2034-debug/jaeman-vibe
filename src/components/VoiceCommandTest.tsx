// ?§ª ?Œì„± ëª…ë ¹???ŒìŠ¤??ì»´í¬?ŒíŠ¸ - ì²œì¬ ëª¨ë“œ 4?¨ê³„
import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';
import { parseDateCommand, parseAction, parseStatType } from '@/utils/parseDateCommand';

export default function VoiceCommandTest() {
  const { speak } = useSpeech();
  const [testCommand, setTestCommand] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);

  const testCommands = [
    "?¤ëŠ˜ ë¦¬í¬???½ì–´ì¤?,
    "?´ì œ ê°€?…ì ëª?ëª…ì´??",
    "?´ë²ˆì£?ê±°ë˜???Œë ¤ì¤?,
    "ìµœê·¼ ?‘ë‹µë¥?ë³´ì—¬ì¤?,
    "ê·¸ì œ ë¦¬í¬???”ì•½?´ì¤˜",
    "3?¼ì „ ë©”ì‹œì§€ ???Œë ¤ì¤?,
    "ì§€?œì£¼ ë¦¬í¬??ë³´ì—¬ì¤?
  ];

  const handleTestCommand = (command: string) => {
    setTestCommand(command);
    
    // ëª…ë ¹??ë¶„ì„
    const dateId = parseDateCommand(command);
    const action = parseAction(command);
    const statType = parseStatType(command);
    
    const result = {
      originalCommand: command,
      parsedDate: dateId,
      action: action,
      statType: statType,
      formattedDate: new Date(dateId).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    };
    
    setAnalysis(result);
    
    // ?Œì„±?¼ë¡œ ë¶„ì„ ê²°ê³¼ ?½ê¸°
    const summary = `ëª…ë ¹??"${command}"ë¥?ë¶„ì„?ˆìŠµ?ˆë‹¤. ${result.formattedDate}??${action} ?¡ì…˜?¼ë¡œ ${statType} ?µê³„ë¥??”ì²­?©ë‹ˆ??`;
    speak(summary);
  };

  const handleCustomTest = () => {
    if (testCommand.trim()) {
      handleTestCommand(testCommand.trim());
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        ?§ª ?Œì„± ëª…ë ¹???ŒìŠ¤??      </h2>
      
      {/* ë¯¸ë¦¬ ?•ì˜??ëª…ë ¹???ŒìŠ¤??*/}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">ë¯¸ë¦¬ ?•ì˜??ëª…ë ¹??</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {testCommands.map((command, index) => (
            <button
              key={index}
              onClick={() => handleTestCommand(command)}
              className="px-3 py-2 text-left text-sm bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              ?¤ {command}
            </button>
          ))}
        </div>
      </div>

      {/* ?¬ìš©???•ì˜ ëª…ë ¹???ŒìŠ¤??*/}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">?¬ìš©???•ì˜ ëª…ë ¹??</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={testCommand}
            onChange={(e) => setTestCommand(e.target.value)}
            placeholder="?Œì„± ëª…ë ¹?´ë? ?…ë ¥?˜ì„¸??.."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleCustomTest}
            disabled={!testCommand.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ?ŒìŠ¤??          </button>
        </div>
      </div>

      {/* ë¶„ì„ ê²°ê³¼ ?œì‹œ */}
      {analysis && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-3">?“Š ëª…ë ¹??ë¶„ì„ ê²°ê³¼:</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-600">?ë³¸ ëª…ë ¹??</span>
              <span className="ml-2 text-gray-800">"{analysis.originalCommand}"</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">?Œì‹±??? ì§œ:</span>
              <span className="ml-2 text-gray-800">{analysis.parsedDate}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">?¬ë§·??? ì§œ:</span>
              <span className="ml-2 text-gray-800">{analysis.formattedDate}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">?¡ì…˜:</span>
              <span className="ml-2 text-gray-800">{analysis.action}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">?µê³„ ?€??</span>
              <span className="ml-2 text-gray-800">{analysis.statType}</span>
            </div>
          </div>
        </div>
      )}

      {/* ?¬ìš© ê°€?¥í•œ ?¤ì›Œ???ˆë‚´ */}
      <div className="mt-4 text-xs text-gray-500">
        <p className="font-medium mb-2">?’¡ ì§€?í•˜???¤ì›Œ??</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <p className="font-medium">? ì§œ:</p>
            <p>?¤ëŠ˜, ?´ì œ, ê·¸ì œ, ?´ë²ˆì£? ì§€?œì£¼</p>
          </div>
          <div>
            <p className="font-medium">?¡ì…˜:</p>
            <p>?½ì–´, ë³´ì—¬, ?Œë ¤, ?”ì•½, ëª‡ëª…</p>
          </div>
          <div>
            <p className="font-medium">?µê³„:</p>
            <p>ê°€?…ì, ê±°ë˜, ?‘ë‹µ, ë©”ì‹œì§€</p>
          </div>
        </div>
      </div>
    </div>
  );
}
