import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Phone, User2, ShieldCheck, Loader2, ChevronDown } from "lucide-react";

// 프로젝트의 훅/유틸 가져오기 (경로는 프로젝트 구조에 맞게 조정)
import { usePttStt } from "../hooks/usePttStt";
import { extractName, extractPhone, digitsFromSpeech } from "../lib/parse";
import { sendSms, verifySmsCode } from "../lib/sms";
import { auth, db } from "../firebase";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function OneShotVoiceSignupModern() {
  // =============== STT & PTT ===============
  const {
    ok, listening, partial, finalText, setFinalText,
    start, stop,              // ✅ 추가
    snapshotAfterStop,        // ✅ 스냅샷 함수 추가
  } = usePttStt("ko-KR");

  // 최근 인식 고정 & 로그
  const [lastUtterance, setLastUtterance] = useState("");
  const [history, setHistory] = useState<Array<{ t: number; text: string }>>([]);
  const [showDebug, setShowDebug] = useState(false);

  // 폼 상태
  const [name, setName] = useState("");
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [digits, setDigits] = useState("");
  const [busy, setBusy] = useState(false);

  // ✅ 누적 텍스트 상태 추가
  const ACCUM_LIMIT = 1000;                  // 최대 보관 글자 수
  const [accumText, setAccumText] = useState("");
  const [accumOn, setAccumOn] = useState(true); // 켜기/끄기 토글

  // ✅ 부분 완료 이어받기 상태 추가
  const [pendingDigits, setPendingDigits] = useState<string>(""); // 01x로 시작해서 11자리 미만인 중간 결과

  // 전역 pointerup 방식 (안정적인 PTT)
  const micOkRef = useRef(false);
  const downRef = useRef(false);
  const prevListening = useRef(false);
  const snapRef = useRef({ final: "", partial: "" });

  useEffect(() => { snapRef.current = { final: finalText || "", partial: partial || "" }; }, [finalText, partial]);

  // 손을 떼면 1회 파싱 (여러 소스 묶어 재시도)
  useEffect(() => {
    if (prevListening.current && !listening) {
      setTimeout(() => {
        const snap = snapshotAfterStop?.() ?? { final: finalText || "", partial: partial || "", alts: [] };
        const text = (snap.final.trim() || snap.partial.trim() || snap.alts?.[0] || "").trim();
        if (!text) { alert("음성이 인식되지 않았어요. 다시 한 번에 말씀해 주세요."); return; }

        // ✅ 누적 업데이트
        if (accumOn && text) {
          setAccumText(prev => {
            // 같은 문장을 바로 연속으로 쌓는 건 방지
            if (prev.endsWith(text)) return prev;
            const next = prev ? `${prev}\n${text}` : text;   // 줄바꿈 누적
            return next.length > ACCUM_LIMIT ? next.slice(-ACCUM_LIMIT) : next;
          });
        }

        // (기존) 최근 1건 고정/히스토리/파싱
        setLastUtterance(text);
        setHistory(h => [{ t: Date.now(), text }, ...h].slice(0, 50));

        // 1) 이름
        const n = extractName(text);
        if (n) setName(n);

        // 2) 전화번호는 이어받기 로직으로
        const okPhone = handlePhoneWithPending(text);
      }, 150);
    }
    prevListening.current = listening;
  }, [listening, snapshotAfterStop, finalText, partial]);

  async function ensureMic() {
    if (micOkRef.current) return;
    await navigator.mediaDevices.getUserMedia({ audio: true });
    micOkRef.current = true;
  }

  const handlers = useMemo(() => ({
    onPointerDown: async (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      // ★ await 하기 전에 타깃/포인터ID를 먼저 잡아둡니다
      const el = e.currentTarget as HTMLElement | null;
      const id = (e as any).pointerId ?? 0;

      // (선택) 캡처를 먼저 시도 — 지원 안 하면 그냥 무시
      try { el?.setPointerCapture?.(id); } catch {}

      // 마이크 권한
      try { await ensureMic(); } catch {
        alert("마이크 권한을 허용해 주세요.");
        try { el?.releasePointerCapture?.(id); } catch {}
        return;
      }

      // ✅ 여기서 STT 시작
      console.log("[PTT] start()");
      start();

      const onUp = () => {
        console.log("[PTT] stop()");
        stop(); // ✅ 손 떼면 STT 종료
        try { el?.releasePointerCapture?.(id); } catch {}
        window.removeEventListener("pointerup", onUp, true);
        window.removeEventListener("pointercancel", onUp, true);
        window.removeEventListener("blur", onUp, true);
        document.removeEventListener("visibilitychange", onHide, true);
      };
      const onHide = () => onUp();

      window.addEventListener("pointerup", onUp, true);
      window.addEventListener("pointercancel", onUp, true);
      window.addEventListener("blur", onUp, true);
      document.addEventListener("visibilitychange", onHide, true);
    },

    onClick: (e) => e.preventDefault(),
  }), [start, stop, ok]);  // ✅ deps에 start/stop 포함

  // =============== 파싱 & 제출 ===============
  // ✅ handleOneShot은 더 이상 사용되지 않음 (useEffect에서 직접 처리)
  // 전화번호 재확인 UX는 useEffect 내에서 처리

  // ✅ 부분 완료 이어받기 로직
  function handlePhoneWithPending(text: string) {
    // 이번 문장 숫자만 뽑기
    const dsNow = digitsFromSpeech(text); // ← parse.ts에서 export 해둠
    let merged = dsNow;

    // 이전에 모아둔 게 있으면 이어붙이기
    if (pendingDigits) merged = pendingDigits + dsNow;

    // 최종 추출 시도
    const p = extractPhone(merged);
    if (p && p.digits.length >= 10) {
      setPhoneDisplay(p.display);
      setDigits(p.digits);
      setPendingDigits(""); // 완료
      return true;
    }

    // 아직 부족: 01x로 시작하고 7~10자리면 대기 상태로 저장
    const head = merged.match(/^01[016789]\d{4,8}/)?.[0];
    if (head && head.length >= 7 && head.length < 11) {
      setPendingDigits(head);
      // UI로 남은 자리 안내(선택)
      const remain = 11 - head.length;
      console.log(`[전화번호] 앞 ${head.length}자리 확보. 남은 ${remain}자리만 말씀해 주세요.`);
    }
    return false;
  }

  const canSubmit = !!name && digits.length >= 10 && !busy;

  async function onSendSms() {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const conf = await sendSms(auth, digits);
      const code = window.prompt("문자 인증번호 6자리를 입력하세요");
      if (!code) { setBusy(false); return; }
      const cred = await verifySmsCode(conf, code.trim());
      if (cred.user && name) await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid, name, phone: phoneDisplay, createdAt: serverTimestamp(),
      }, { merge: true });
      alert("✅ 가입 완료!");
      setFinalText("");
    } catch (e: any) {
      console.error(e);
      alert("인증 실패: " + (e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900">
      <div className="mx-auto max-w-[720px] px-4 py-10">
        {/* 헤더 */}
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-6">음성 원샷 가입</h1>
            <p className="text-sm text-slate-500">길게 누르고 한 번에 말하면 이름/전화가 자동 인식됩니다.</p>
          </div>
        </div>

        {/* 카드 */}
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
          {/* 폼 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="group relative">
              <label className="mb-1 block text-sm text-slate-600">이름</label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-inner focus-within:ring-2 focus-within:ring-indigo-500">
                <User2 className="h-4 w-4 text-slate-400" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="group relative">
              <label className="mb-1 block text-sm text-slate-600">전화번호</label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-inner focus-within:ring-2 focus-within:ring-indigo-500">
                <Phone className="h-4 w-4 text-slate-400" />
                <input
                  value={phoneDisplay}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, "");
                    const disp = d.length >= 10
                      ? `${d.slice(0,3)}-${d.slice(3, d.length===10?6:7)}-${d.slice(-4)}`
                      : e.target.value;
                    setPhoneDisplay(disp);
                    setDigits(d);
                  }}
                  inputMode="numeric"
                  placeholder="010-1234-5678"
                  className="flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
                                 />
               </div>
               {/* ✅ 진행상황 표시 */}
               {pendingDigits && (
                 <div className="mt-1 text-xs text-slate-500">
                   앞자리 인식됨: {pendingDigits.replace(/^(\d{3})(\d{0,4})(\d{0,4})$/, (m,a,b,c)=>[a,b,c].filter(Boolean).join("-"))}
                   {`  → 남은 ${Math.max(0, 11 - pendingDigits.length)}자리`}
                 </div>
               )}
             </div>
           </div>

          {/* PTT 버튼 */}
          <div className="mt-5">
            <motion.button
              type="button"
              disabled={!ok}
              {...handlers}
              onContextMenu={(e)=>e.preventDefault()}
              onDragStart={(e)=>e.preventDefault()}
              aria-pressed={listening}
              className={`relative flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-white shadow-lg transition ${
                ok ? (listening ? "bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-700") : "bg-slate-300"
              }`}
              style={{ touchAction: "none", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
            >
              <AnimatePresence>
                {listening && (
                  <motion.span
                    key="pulse"
                    className="absolute inset-0 -z-10 rounded-2xl bg-emerald-500/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 0.1, 0.4] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  />
                )}
              </AnimatePresence>
              {listening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              {ok ? (listening ? "듣는 중… (떼면 처리)" : "길게 누르고 한 번에 말하기") : "브라우저가 음성 인식을 지원하지 않음"}
            </motion.button>

            {/* 최근 인식 */}
            <div className="mt-3 text-sm text-slate-600">
              <div className="mb-1 flex items-center gap-2 opacity-70">
                <span>최근 인식 (누적)</span>
                <label className="ml-auto flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={accumOn}
                    onChange={e => setAccumOn(e.target.checked)}
                  />
                  누적
                </label>
                <button
                  type="button"
                  onClick={() => setAccumText("")}
                  className="rounded-md border px-2 py-1 text-xs"
                >
                  지우기
                </button>
              </div>

              <div
                className="min-h-[64px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }} // 줄바꿈 유지
              >
                {accumOn
                  ? (accumText || "—")
                  : (listening ? (partial || lastUtterance || "…") : (lastUtterance || "—"))}
              </div>

              {/* 디버그 버튼/히스토리 UI는 기존 그대로 두면 됩니다 */}
              <button
                type="button"
                onClick={() => setShowDebug(v=>!v)}
                className="mt-2 text-xs text-slate-500 underline underline-offset-4"
              >
                {showDebug ? "디버그 숨기기" : "디버그 보기"}
              </button>
              {showDebug && (
                <div className="mt-2 max-h-40 overflow-auto rounded-xl border border-dashed border-slate-300 bg-white p-2 text-xs">
                  {history.length === 0 ? (
                    <div className="opacity-60">로그 없음</div>
                  ) : (
                    <ul className="space-y-1">
                      {history.map(h => (
                        <li key={h.t} className="flex gap-2">
                          <span className="w-20 shrink-0 opacity-50">{new Date(h.t).toLocaleTimeString()}</span>
                          <span>{h.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 제출 */}
          <div className="mt-5">
            <button
              type="button"
              onClick={onSendSms}
              disabled={!canSubmit}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-white shadow-md transition ${
                canSubmit ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300"
              }`}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} 인증 문자 받기
            </button>
            <div id="recaptcha-container" style={{ display: "none" }} />
          </div>
        </div>
      </div>
    </div>
  );
} 