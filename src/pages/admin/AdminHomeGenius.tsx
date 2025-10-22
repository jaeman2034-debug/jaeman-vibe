// ?”¥ YAGO VIBE ê´€ë¦¬ì ??- Genius Pack V1
import AdminSummaryCardGenius from '@/components/AdminSummaryCardGenius';
import HeaderInstallButton from '@/components/HeaderInstallButton';

const mockData = {
  title: 'AI ?¼ì¼ ?”ì•½ ë¦¬í¬??,
  date: new Date().toLocaleString('ko-KR'),
  summary: `? ê·œ ê°€?…ì 18ëª?(+12%), ì¤‘ê³ ê±°ë˜ ? ê·œ ?í’ˆ 36ê±? ë©”ì‹œì§€ ?‘ë‹µë¥?92%?…ë‹ˆ??\n\n?ìœ„ ê´€??ì¹´í…Œê³ ë¦¬??ì¶•êµ¬???˜ë¥˜?´ë©°, ?¬ê³  ?Œì§„ ?„ë°• ?ˆëª© 3ê±´ì´ ?ˆì–´ ?¸ì‹œ ê¶Œì¥?©ë‹ˆ??`,
  kpis: [
    { label: '? ê·œ ê°€??, value: 18 },
    { label: '? ê·œ ?í’ˆ', value: 36 },
    { label: '?‘ë‹µë¥?, value: '92%' },
    { label: '?¬ê³  ?„ë°•', value: 3 },
  ],
};

export default function AdminHomeGenius() {
  return (
    <main className="min-h-dvh bg-[#0B0B0D] text-white">
      <header className="sticky top-0 z-10 bg-[#0B0B0D]/80 backdrop-blur border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold flex items-center gap-2">
            ??YAGO VIBE Admin
            <span className="text-xs bg-[#A3E635] text-black px-2 py-1 rounded-full">
              Genius Pack V1
            </span>
          </h1>
          <HeaderInstallButton />
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#A3E635] rounded-full animate-pulse"></div>
            <p className="text-sm text-white/60">?¤ë§ˆ?¸í° ?¤ì¹˜??PWA Â· ?¤í”„?¼ì¸ ?€??/p>
          </div>
          <p className="text-xs text-white/40">
            AI ?”ì•½ + TTS + A2HSê°€ ?´ì¥??ê´€ë¦¬ì ?€?œë³´??          </p>
        </div>

        <AdminSummaryCardGenius data={mockData} />

        {/* ì¶”ê? ê¸°ëŠ¥ ì¹´ë“œ??*/}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-[#0E1013] border border-white/10 rounded-2xl p-4">
            <h3 className="font-semibold text-[#A3E635] mb-2">?”¥ PWA ê¸°ëŠ¥</h3>
            <ul className="text-sm text-white/80 space-y-1">
              <li>?????”ë©´ ?¤ì¹˜ ê°€??/li>
              <li>???¤í”„?¼ì¸ ?™ì‘</li>
              <li>???ë™ ?…ë°?´íŠ¸</li>
              <li>???¤ì´?°ë¸Œ ??ê²½í—˜</li>
            </ul>
          </div>

          <div className="bg-[#0E1013] border border-white/10 rounded-2xl p-4">
            <h3 className="font-semibold text-[#A3E635] mb-2">?¯ AI ê¸°ëŠ¥</h3>
            <ul className="text-sm text-white/80 space-y-1">
              <li>???¤ì‹œê°??”ì•½ ?ì„±</li>
              <li>??TTS ?Œì„± ë¦¬í¬??/li>
              <li>???ë™ ?µê³„ ë¶„ì„</li>
              <li>???¤ë§ˆ???Œë¦¼</li>
            </ul>
          </div>
        </div>

        {/* ?¤ì¹˜ ê°€?´ë“œ */}
        <div className="mt-6 bg-[#0E1013] border border-white/10 rounded-2xl p-4">
          <h3 className="font-semibold text-[#A3E635] mb-3">?“± ?¤ì¹˜ ê°€?´ë“œ</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/80 mb-2"><strong>Android Chrome:</strong></p>
              <p className="text-white/60">ì£¼ì†Œì°?ë©”ë‰´ ??"???”ë©´??ì¶”ê?" ?ëŠ” ?ë™ ?¤ì¹˜ ë°°ë„ˆ</p>
            </div>
            <div>
              <p className="text-white/80 mb-2"><strong>iOS Safari:</strong></p>
              <p className="text-white/60">ê³µìœ  ë²„íŠ¼ ??"???”ë©´??ì¶”ê?" ? íƒ</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
