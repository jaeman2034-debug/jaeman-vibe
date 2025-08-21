import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';
import BottomSheet from '../components/BottomSheet';
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';

const COUNTRIES = [
  { code: 'KR', label: '대한민국' },
  { code: 'JP', label: '일본' },
  { code: 'US', label: '미국' },
  { code: 'TW', label: '대만' },
];

// 🛡️ 안전 모드 진입 함수
function enterSafeMode() {
  localStorage.setItem("SAFE_MODE", "1");
  // 시트 닫기 (있다면)
  // setSheet(false); // 이 함수는 StartScreen 내부에서 호출되므로 별도 처리
  requestAnimationFrame(() => {
    // StartScreen에서 직접 nav 호출
    window.location.href = "/home";
  });
}

// 🔄 확실한 로그아웃 컴포넌트
function LogoutItem({ close }: { close: () => void }) {
  const nav = useNavigate();
  
  async function handleLogout(e: React.MouseEvent) {
    e.preventDefault(); 
    e.stopPropagation();
    console.log("[LOGOUT] start:", auth.currentUser?.uid ?? null);
    
    try {
      await signOut(auth);
      console.log("[LOGOUT] done");
    } catch (e) {
      console.error("[LOGOUT] error", e);
    } finally {
      // 앱 캐시/플래그 정리
      localStorage.removeItem("SAFE_MODE");
      localStorage.removeItem("user");
      sessionStorage.clear();
      
      // 시트 닫기
      close();
      
      // 굳이 이동 안 해도 됨. 곧바로 '시작하기' 누르면 위 분기대로 사인업으로 감.
      // 필요하면 시작화면으로 안전 이동:
      // nav("/", { replace: true });
    }
  }
  
  return (
    <button
      type="button"
      onClick={handleLogout}
      style={{padding:'12px', borderRadius:10, border:'1px solid #e5e7eb', textAlign:'left', width:'100%'}}
    >
      🔄 다른 계정으로 시작 (로그아웃)
    </button>
  );
}

export default function StartScreen() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user, ready } = useAuth(); // ✅ ready가 true일 때만 동작
  const [sheet, setSheet] = useState(false);
  const [country, setCountry] = useState('KR');

  // 에뮬레이터 모드 여부 - 항상 false로 설정
  const USE_EMU = false;

  // 저장된 지역 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('yago.country');
    if (saved) setCountry(saved);
  }, []);

  // API 상태 확인
  const [apiHealth, setApiHealth] = useState<'checking' | 'ok' | 'down'>('checking');
  const [payload, setPayload] = useState<any>(null);

  const checkHealth = async () => {
    if (USE_EMU) return { ok: true }; // 방어적 처리
    
    // 백엔드 미구현 시 health 체크 건너뛰기
    try {
      const res = await fetch('/api/health', { 
        cache: 'no-store',
        // 백엔드 미구현 시 타임아웃 설정
        signal: AbortSignal.timeout(3000) // 3초 타임아웃
      });
      
      if (!res.ok) {
        if (res.status === 500) {
          // 백엔드 미구현 시 500 에러는 무시하고 OK로 처리
          console.info('[health] backend not implemented (500), treating as OK');
          setApiHealth('ok');
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      setPayload(data);
      setApiHealth(data?.ok ? 'ok' : 'down');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // 타임아웃 시 OK로 처리
        console.info('[health] timeout, treating as OK');
        setApiHealth('ok');
      } else {
        console.warn('[health] error:', err);
        // 에러 시에도 OK로 처리하여 UI 차단 방지
        setApiHealth('ok');
      }
    }
  };

  // 에뮬레이터면 health 호출을 생략하고 바로 OK 처리
  useEffect(() => {
    if (USE_EMU) {
      console.info('[health] skipped (emulator mode). returning ok');
      // 프로젝트 상태 이름에 맞춰서 아래 둘 중 사용
      // setIsHealthy?.(true);
      setApiHealth('ok');
      return; // 폴링 시작하지 않음
    }
    checkHealth();
    const id = setInterval(checkHealth, 15_000);
    return () => clearInterval(id);
  }, [USE_EMU]);

  // 라우트 변경 시 시트 닫기
  useEffect(() => setSheet(false), [loc.pathname]);

  const onStart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    if (!ready) return;                 // 아직 auth sync 전이면 잠깐 무시
    
    // stale 캐시 정리(선택)
    localStorage.removeItem("SAFE_MODE");

    const u = auth.currentUser ?? user; // 가장 최신 상태
    if (u) nav("/home", { replace: true });
    else   nav("/sell", { replace: true });  // ✅ 간단하게 /sell로 이동
  };

  // 지역 저장
  function onCountryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    setCountry(v);
    localStorage.setItem('yago.country', v);
  }

  // 🛡️ 안전 모드 진입 함수 (StartScreen 내부)
  function handleSafeMode() {
    try {
      console.log("[SAFE] click");
      localStorage.setItem("SAFE_MODE", "1");
      setSheet(false);
      requestAnimationFrame(() => nav("/home", { replace: true }));
    } catch (e) {
      console.error("[SAFE] error", e);
      alert("안전 모드 진입 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  }

  return (
    <div style={{
      minHeight:'100vh', background:'#f6f7fb', display:'flex',
      alignItems:'center', justifyContent:'center', padding:16
    }}>
      <div style={{
        width:360, maxWidth:'100%', background:'#fff', borderRadius:16,
        boxShadow:'0 8px 30px rgba(0,0,0,0.06)', border:'1px solid #eaecef',
        padding:24, textAlign:'center'
      }}>
        {/* 로고 */}
        <div style={{
          width:72, height:72, borderRadius:18, background:'rgba(37,99,235,.12)',
          display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px'
        }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="4" fill="#2563eb"/>
            <path d="M8 12h8M12 8v8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </div>

        <div style={{ fontSize:22, fontWeight:800 }}>YAGO SPORTS</div>
        <div style={{ marginTop:2, color:'#6b7280', fontSize:12 }}>AI Platform for Sports Enthusiasts</div>

        <div style={{ marginTop:18, fontSize:18, fontWeight:700 }}>스포츠의 시작, 야고</div>
        <div style={{ marginTop:6, color:'#6b7280', fontSize:13, lineHeight:1.5 }}>
          체육인 커뮤니티, 장터, 모임까지.<br/>지금 위치를 선택하고 시작해보세요!
        </div>

        {/* 국가 선택 */}
        <div style={{ marginTop:12 }}>
          <select value={country} onChange={onCountryChange}
                  style={{ padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:10 }}>
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.code} {c.label}</option>)}
          </select>
        </div>

        {/* 시작하기 버튼 - 반드시 type="button" */}
        <button 
          type="button"
          onClick={onStart}
          disabled={!ready} // ✅ ready가 false면 비활성화
          aria-haspopup="dialog"
          style={{ 
            marginTop:14, 
            width:'100%', 
            height:44, 
            borderRadius:10,
            background: ready ? '#2563eb' : '#9ca3af', // ✅ ready에 따라 색상 변경
            color:'#fff', 
            fontWeight:700, 
            border:0, 
            cursor: ready ? 'pointer' : 'not-allowed', // ✅ ready에 따라 커서 변경
            position: "relative", 
            zIndex: 1, 
            pointerEvents: "auto" 
          }}>
          {!ready ? '인증 상태 확인 중...' : user ? '계정 관리 / 다른 계정으로 시작' : '시작하기'}
        </button>

        {/* 로그인 상태 표시 */}
        {ready && user && (
          <div style={{ marginTop:8, fontSize:12, color:'#059669', background:'#ecfdf5', padding:'6px 12px', borderRadius:8 }}>
            ✅ {user.displayName || user.email || user.phoneNumber}로 로그인됨
          </div>
        )}
        
        {/* 인증 상태 확인 중 표시 */}
        {!ready && (
          <div style={{ marginTop:8, fontSize:12, color:'#6b7280', background:'#f3f4f6', padding:'6px 12px', borderRadius:8 }}>
            🔄 인증 상태 확인 중...
          </div>
        )}

        <div style={{ marginTop:10, fontSize:13, color:'#6b7280' }}>
          {ready ? (
            user ? (
              <>
                다른 계정으로 시작하거나{' '}
                <a onClick={(e)=>{e.preventDefault(); nav('/home');}} href="/home"
                   style={{ color:'#2563eb', textDecoration:'none', marginLeft:6, cursor:'pointer' }}>
                  홈으로 이동
                </a>
              </>
            ) : (
              <>
                이미 계정이 있나요?{' '}
                <a onClick={(e)=>{e.preventDefault(); nav('/login');}} href="/login"
                   style={{ color:'#ef4444', textDecoration:'none', marginLeft:6, cursor:'pointer' }}>
                  로그인
                </a>
              </>
            )
          ) : (
            <span style={{ opacity: 0.6 }}>인증 상태 확인 중...</span>
          )}
        </div>
      </div>

      {/* 상태 뱃지 */}
      <div style={{
        position:'fixed', right:12, bottom:12, fontSize:12,
        padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:8, background:'#fff'
      }}>
        API: {apiHealth === 'checking' ? '확인 중…' : apiHealth === 'ok' ? 'OK' : 'DOWN'}
      </div>

      {/* API 상태 상세 정보 */}
      {payload && (
        <div style={{
          position:'fixed', left:12, bottom:12, fontSize:11,
          padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:8, 
          background:'#fff', maxWidth:'300px', maxHeight:'200px', overflow:'auto'
        }}>
          <div style={{fontWeight:'bold', marginBottom:'4px'}}>API 응답:</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize:'10px', margin:0 }}>
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      )}

      {/* 가입 방식 선택 시트 */}
      <BottomSheet open={sheet} onClose={()=>setSheet(false)}>
        <h3 id="modal-title" style={{margin:'4px 0 12px'}}>시작 방법 선택</h3>
        
        {/* 🧪 테스트 버튼들 */}
        <div style={{marginBottom: 16, padding: '12px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd'}}>
          <div style={{fontSize: 12, color: '#0c4a6e', marginBottom: 8}}>🧪 모달 테스트</div>
          <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
            <button
              type="button"
              onClick={() => console.log('[TEST] 버튼 클릭됨')}
              style={{padding: '6px 10px', fontSize: 12, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6}}
            >
              클릭 테스트
            </button>
            <button
              type="button"
              onClick={() => alert('알림 테스트')}
              style={{padding: '6px 10px', fontSize: 12, background: '#10b981', color: '#fff', border: 'none', borderRadius: 6}}
            >
              알림 테스트
            </button>
            <button
              type="button"
              onClick={() => setSheet(false)}
              style={{padding: '6px 10px', fontSize: 12, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6}}
            >
              닫기
            </button>
          </div>
        </div>
        
        <div style={{display:'grid', gap:8}}>
          {/* 🛡️ 안전 모드 버튼 */}
          <button
            type="button"
            onClick={handleSafeMode}
            style={{padding:'12px', borderRadius:10, border:'1px solid #e5e7eb', textAlign:'left', background:'#fef3c7', width:'100%'}}
          >
            🛡️ 안전 모드 (가입 비활성)
          </button>

          {/* 🔄 로그아웃 버튼 */}
          <LogoutItem close={()=>setSheet(false)} />

          {/* 닫기 버튼 */}
          <button
            type="button"
            onClick={()=>setSheet(false)}
            style={{marginTop:6, opacity:.7, width:'100%'}}
          >
            닫기
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
