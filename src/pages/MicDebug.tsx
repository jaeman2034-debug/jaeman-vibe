import { useEffect, useRef, useState } from "react";
import { ensureMicPermission, listenOnceP } from "../utils/mic";

export default function MicDebug() {
  const [support, setSupport] = useState<string>("-");
  const [perm, setPerm] = useState<string>("unknown");
  const [log, setLog] = useState<string[]>([]);
  const [lang, setLang] = useState("ko-KR");
  const busyRef = useRef(false);

  const add = (s: string) => setLog((prev) => [...prev.slice(-30), `${new Date().toLocaleTimeString()} ${s}`]);

  useEffect(() => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupport(SR ? (SR.name || "SpeechRecognition OK") : "NOT SUPPORTED");
    navigator.permissions?.query?.({ name: "microphone" as any }).then(
      (st) => {
        setPerm(st.state);
        st.onchange = () => setPerm((st as any).state);
      },
      () => setPerm("unknown")
    );
  }, []);

  const testPerm = async () => {
    const ok = await ensureMicPermission();
    add(`ensureMicPermission: ${ok}`);
  };

  const testOnce = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    add("listenOnceP start");
    try {
      const txt = await listenOnceP(lang, 20000, 10000, 10000);
      add(`RESULT: "${txt}"`);
    } catch (e: any) {
      add(`ERROR: ${e?.message || e}`);
    } finally {
      busyRef.current = false;
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "24px auto", fontFamily: "system-ui,Segoe UI,Roboto,Apple SD Gothic Neo,Noto Sans KR,Arial" }}>
      <h2>Mic Debug</h2>
      <div>Recognition: <b>{support}</b></div>
      <div>Permission: <b>{perm}</b></div>
      <div style={{ marginTop: 8 }}>
        언어:
        <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ marginLeft: 8 }}>
          <option value="ko-KR">ko-KR</option>
          <option value="en-US">en-US</option>
          <option value="ja-JP">ja-JP</option>
          <option value="zh-CN">zh-CN</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={testPerm}>권한 확인</button>
        <button onClick={testOnce}>한 번 듣기</button>
      </div>
      <pre style={{ background: "#0b1020", color: "#cfe4ff", padding: 12, borderRadius: 8, marginTop: 16, height: 280, overflow: "auto" }}>
        {log.join("\n")}
      </pre>
      <p style={{ color: "#64748b" }}>
        * 주소창 왼쪽 🔒에서 마이크를 "허용"으로 두고, Windows 입력 장치(소리 설정)의 기본 마이크가 올바른지 확인하세요.
      </p>
    </div>
  );
} 