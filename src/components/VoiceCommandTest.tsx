// ?�� ?�성 명령???�스??컴포?�트 - 천재 모드 4?�계
import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';
import { parseDateCommand, parseAction, parseStatType } from '@/utils/parseDateCommand';

export default function VoiceCommandTest() {
  const { speak } = useSpeech();
  const [testCommand, setTestCommand] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);

  const testCommands = [
    "?�늘 리포???�어�?,
    "?�제 가?�자 �?명이??",
    "?�번�?거래???�려�?,
    "최근 ?�답�?보여�?,
    "그제 리포???�약?�줘",
    "3?�전 메시지 ???�려�?,
    "지?�주 리포??보여�?
  ];

  const handleTestCommand = (command: string) => {
    setTestCommand(command);
    
    // 명령??분석
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
    
    // ?�성?�로 분석 결과 ?�기
    const summary = `명령??"${command}"�?분석?�습?�다. ${result.formattedDate}??${action} ?�션?�로 ${statType} ?�계�??�청?�니??`;
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
        ?�� ?�성 명령???�스??      </h2>
      
      {/* 미리 ?�의??명령???�스??*/}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">미리 ?�의??명령??</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {testCommands.map((command, index) => (
            <button
              key={index}
              onClick={() => handleTestCommand(command)}
              className="px-3 py-2 text-left text-sm bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              ?�� {command}
            </button>
          ))}
        </div>
      </div>

      {/* ?�용???�의 명령???�스??*/}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">?�용???�의 명령??</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={testCommand}
            onChange={(e) => setTestCommand(e.target.value)}
            placeholder="?�성 명령?��? ?�력?�세??.."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleCustomTest}
            disabled={!testCommand.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ?�스??          </button>
        </div>
      </div>

      {/* 분석 결과 ?�시 */}
      {analysis && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-3">?�� 명령??분석 결과:</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-600">?�본 명령??</span>
              <span className="ml-2 text-gray-800">"{analysis.originalCommand}"</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">?�싱???�짜:</span>
              <span className="ml-2 text-gray-800">{analysis.parsedDate}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">?�맷???�짜:</span>
              <span className="ml-2 text-gray-800">{analysis.formattedDate}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">?�션:</span>
              <span className="ml-2 text-gray-800">{analysis.action}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">?�계 ?�??</span>
              <span className="ml-2 text-gray-800">{analysis.statType}</span>
            </div>
          </div>
        </div>
      )}

      {/* ?�용 가?�한 ?�워???�내 */}
      <div className="mt-4 text-xs text-gray-500">
        <p className="font-medium mb-2">?�� 지?�하???�워??</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <p className="font-medium">?�짜:</p>
            <p>?�늘, ?�제, 그제, ?�번�? 지?�주</p>
          </div>
          <div>
            <p className="font-medium">?�션:</p>
            <p>?�어, 보여, ?�려, ?�약, 몇명</p>
          </div>
          <div>
            <p className="font-medium">?�계:</p>
            <p>가?�자, 거래, ?�답, 메시지</p>
          </div>
        </div>
      </div>
    </div>
  );
}
