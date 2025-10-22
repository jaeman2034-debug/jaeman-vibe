// ??/src/pages/AdminBriefingConsole.tsx ??Cursor???ÑÏÑ± Î≤ÑÏ†Ñ
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";

export default function AdminBriefingConsole() {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("alloy");
  const [playing, setPlaying] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [playLogs, setPlayLogs] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "notification_reports"), (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => b.date?.seconds - a.date?.seconds);
      setReports(list.slice(0, 10));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "play_logs"), (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => b.playedAt?.seconds - a.playedAt?.seconds);
      setPlayLogs(list.slice(0, 20));
    });
    return () => unsub();
  }, []);

  const playReport = async (report: any) => {
    try {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      
      setPlaying(report.id);
      const newAudio = new Audio(report.audioUrl);
      setAudio(newAudio);
      
      newAudio.play();
      
      // ?¨ÏÉù Î°úÍ∑∏ Í∏∞Î°ù
      await addDoc(collection(db, "play_logs"), {
        reportId: report.id,
        title: report.title,
        playedAt: serverTimestamp(),
        voice: selectedVoice,
        audioUrl: report.audioUrl,
        adminId: "admin", // ?§Ï†úÎ°úÎäî ?ÑÏû¨ Í¥ÄÎ¶¨Ïûê ID
      });
      
      newAudio.onended = () => setPlaying(null);
      newAudio.onerror = () => {
        console.error("?§Îîî???¨ÏÉù ?§Î•ò");
        setPlaying(null);
      };
    } catch (err) {
      console.error("?¨ÏÉù ?§Î•ò:", err);
      setPlaying(null);
    }
  };

  const stopPlayback = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(null);
    }
  };

  const getVoiceLabel = (voice: string) => {
    const voices = {
      alloy: "?éô Alloy (Í∏∞Î≥∏)",
      echo: "?îä Echo (?®ÏÑ±)",
      fable: "?ìñ Fable (?ÅÍµ≠)",
      onyx: "?ñ§ Onyx (ÍπäÏ? ?®ÏÑ±)",
      nova: "?í° Nova (?®ÏÑ±)",
      shimmer: "??Shimmer (?¨ÏÑ±)"
    };
    return voices[voice as keyof typeof voices] || voice;
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">?éß AI Î∏åÎ¶¨??Ïª®Ìä∏Î°??ºÌÑ∞</h1>
        {playing && (
          <button
            onClick={stopPlayback}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            ???ïÏ?
          </button>
        )}
      </div>

      {/* ?åÏÑ± ?†ÌÉù Ïª®Ìä∏Î°?*/}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="font-semibold mb-2">?éôÔ∏??åÏÑ± ?†ÌÉù</h2>
            <select 
              value={selectedVoice} 
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-[200px]"
            >
              <option value="alloy">?éô Alloy (Í∏∞Î≥∏)</option>
              <option value="echo">?îä Echo (?®ÏÑ±)</option>
              <option value="fable">?ìñ Fable (?ÅÍµ≠)</option>
              <option value="onyx">?ñ§ Onyx (ÍπäÏ? ?®ÏÑ±)</option>
              <option value="nova">?í° Nova (?®ÏÑ±)</option>
              <option value="shimmer">??Shimmer (?¨ÏÑ±)</option>
            </select>
          </div>
          <div className="text-gray-500 text-sm">
            ?†ÌÉù???åÏÑ±: <span className="font-semibold text-gray-700">{getVoiceLabel(selectedVoice)}</span>
          </div>
        </div>
      </div>

      {/* Î∏åÎ¶¨??Î¶¨Ìè¨??Î¶¨Ïä§??*/}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((r) => (
          <div key={r.id} className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-4 flex flex-col gap-3">
              <h3 className="font-semibold text-lg">{r.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-3">{r.summary}</p>
              
              {/* ?µÍ≥Ñ ?ïÎ≥¥ */}
              {r.stats && (
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>?õí Í±∞Îûò: {r.stats.markets}Í±?/span>
                  <span>?í¨ Ï±ÑÌåÖ: {r.stats.chats}Í±?/span>
                  <span>?ë• ?åÏõê: {r.stats.users}Î™?/span>
                </div>
              )}
              
              {/* ?¨ÏÉù Ïª®Ìä∏Î°?*/}
              <div className="flex gap-2 mt-2">
                {r.audioUrl ? (
                  <button
                    className={`w-full py-2 px-4 rounded-lg text-white font-semibold transition-colors ${
                      playing === r.id 
                        ? "bg-green-600 hover:bg-green-700" 
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                    onClick={() => playReport(r)}
                  >
                    {playing === r.id ? "???¨ÏÉù Ï§?.." : "?∂Ô∏è ?¨ÏÉù"}
                  </button>
                ) : (
                  <button 
                    disabled 
                    className="w-full py-2 px-4 rounded-lg bg-gray-300 text-gray-500 cursor-not-allowed"
                  >
                    ?åÏÑ± ?åÏùº ?ÜÏùå
                  </button>
                )}
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>
                  {r.date
                    ? new Date(r.date.seconds * 1000).toLocaleString("ko-KR")
                    : "?†Ïßú ?ïÎ≥¥ ?ÜÏùå"}
                </span>
                {r.audioSize && (
                  <span>{Math.round(r.audioSize / 1024)}KB</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ?¨ÏÉù Î°úÍ∑∏ */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6">
          <h2 className="font-semibold mb-4">?ìä ?¨ÏÉù Î°úÍ∑∏ (ÏµúÍ∑º 20Í∞?</h2>
          {playLogs.length === 0 ? (
            <p className="text-gray-500 text-sm">?ÑÏßÅ ?¨ÏÉù Í∏∞Î°ù???ÜÏäµ?àÎã§.</p>
          ) : (
            <div className="space-y-2">
              {playLogs.map((log, i) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{log.title}</div>
                    <div className="text-xs text-gray-500">
                      {getVoiceLabel(log.voice)} ??
                      {log.playedAt 
                        ? new Date(log.playedAt.seconds * 1000).toLocaleString("ko-KR")
                        : "?úÍ∞Ñ ?ïÎ≥¥ ?ÜÏùå"
                      }
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    #{i + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ?µÍ≥Ñ ?îÏïΩ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{reports.length}</div>
          <div className="text-sm text-gray-500">Ï¥?Î∏åÎ¶¨??Î¶¨Ìè¨??/div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">{playLogs.length}</div>
          <div className="text-sm text-gray-500">Ï¥??¨ÏÉù ?üÏàò</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {playing ? "?¨ÏÉù Ï§? : "?ÄÍ∏?}
          </div>
          <div className="text-sm text-gray-500">?ÑÏû¨ ?ÅÌÉú</div>
        </div>
      </div>
    </div>
  );
}
