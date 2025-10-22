// ?�� YAGO VIBE 관리자 ??- Genius Pack V1
import AdminSummaryCardGenius from '@/components/AdminSummaryCardGenius';
import HeaderInstallButton from '@/components/HeaderInstallButton';

const mockData = {
  title: 'AI ?�일 ?�약 리포??,
  date: new Date().toLocaleString('ko-KR'),
  summary: `?�규 가?�자 18�?(+12%), 중고거래 ?�규 ?�품 36�? 메시지 ?�답�?92%?�니??\n\n?�위 관??카테고리??축구???�류?�며, ?�고 ?�진 ?�박 ?�목 3건이 ?�어 ?�시 권장?�니??`,
  kpis: [
    { label: '?�규 가??, value: 18 },
    { label: '?�규 ?�품', value: 36 },
    { label: '?�답�?, value: '92%' },
    { label: '?�고 ?�박', value: 3 },
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
            <p className="text-sm text-white/60">?�마?�폰 ?�치??PWA · ?�프?�인 ?�??/p>
          </div>
          <p className="text-xs text-white/40">
            AI ?�약 + TTS + A2HS가 ?�장??관리자 ?�?�보??          </p>
        </div>

        <AdminSummaryCardGenius data={mockData} />

        {/* 추�? 기능 카드??*/}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-[#0E1013] border border-white/10 rounded-2xl p-4">
            <h3 className="font-semibold text-[#A3E635] mb-2">?�� PWA 기능</h3>
            <ul className="text-sm text-white/80 space-y-1">
              <li>?????�면 ?�치 가??/li>
              <li>???�프?�인 ?�작</li>
              <li>???�동 ?�데?�트</li>
              <li>???�이?�브 ??경험</li>
            </ul>
          </div>

          <div className="bg-[#0E1013] border border-white/10 rounded-2xl p-4">
            <h3 className="font-semibold text-[#A3E635] mb-2">?�� AI 기능</h3>
            <ul className="text-sm text-white/80 space-y-1">
              <li>???�시�??�약 ?�성</li>
              <li>??TTS ?�성 리포??/li>
              <li>???�동 ?�계 분석</li>
              <li>???�마???�림</li>
            </ul>
          </div>
        </div>

        {/* ?�치 가?�드 */}
        <div className="mt-6 bg-[#0E1013] border border-white/10 rounded-2xl p-4">
          <h3 className="font-semibold text-[#A3E635] mb-3">?�� ?�치 가?�드</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/80 mb-2"><strong>Android Chrome:</strong></p>
              <p className="text-white/60">주소�?메뉴 ??"???�면??추�?" ?�는 ?�동 ?�치 배너</p>
            </div>
            <div>
              <p className="text-white/80 mb-2"><strong>iOS Safari:</strong></p>
              <p className="text-white/60">공유 버튼 ??"???�면??추�?" ?�택</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
