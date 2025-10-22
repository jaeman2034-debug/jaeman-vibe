// ?”¥ AdminSummaryCard Genius Pack V1 - ?¤í¬ ?Œë§ˆ + ?¼ì„ ?¡ì„¼??import { useSpeech } from '@/hooks/useSpeech';

type SummaryData = {
  title: string;
  date: string;
  summary: string;
  kpis: { label: string; value: string | number }[];
};

type Props = {
  data: SummaryData;
};

export default function AdminSummaryCardGenius({ data }: Props) {
  const { speak, stop, speaking, isSupported } = useSpeech();

  const handlePlay = () => {
    if (!isSupported) {
      alert('??ë¸Œë¼?°ì????Œì„± ì¶œë ¥??ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤.');
      return;
    }
    const text = `?¤ëŠ˜??ë¦¬í¬?¸ì…?ˆë‹¤. ${data.summary}`;
    speak(text, 'ko-KR');
  };

  return (
    <div className="rounded-2xl p-5 bg-[#0E1013] text-white shadow-xl border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">{data.title}</h2>
          <p className="text-sm text-white/60">{data.date}</p>
        </div>
        <div className="flex gap-2">
          {!speaking ? (
            <button 
              onClick={handlePlay} 
              className="px-3 py-1 rounded-xl bg-[#A3E635] text-black font-semibold hover:bg-[#8BC34A] transition-colors"
              disabled={!isSupported}
            >
              ?”Š ?£ê¸°
            </button>
          ) : (
            <button 
              onClick={stop} 
              className="px-3 py-1 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
            >
              ???•ì?
            </button>
          )}
        </div>
      </div>

      <p className="text-base leading-relaxed text-white/90 whitespace-pre-wrap mb-5">
        {data.summary}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {data.kpis.map((kpi, i) => (
          <div key={i} className="rounded-xl bg-white/5 p-3 border border-white/10">
            <p className="text-xs text-white/60">{kpi.label}</p>
            <p className="text-lg font-semibold text-[#A3E635]">{kpi.value}</p>
          </div>
        ))}
      </div>

      {!isSupported && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-sm text-red-400">
            ? ï¸ ??ë¸Œë¼?°ì????Œì„± ì¶œë ¥??ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤.
          </p>
        </div>
      )}
    </div>
  );
}
