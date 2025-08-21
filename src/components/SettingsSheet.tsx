import React, { useEffect, useState } from "react";
import { useSettings } from "../settings/SettingsContext";
import "./settings.css";

const VOICES_FALLBACK = [{ name: "자동 선택", value: "auto" }];

export default function SettingsSheet() {
  const { locale, setLocale, autoFillWhileListening, setAutoFillWhileListening } = useSettings();
  const [open, setOpen] = useState(false);
  const [voices, setVoices] = useState<{ name: string; value: string }[]>(VOICES_FALLBACK);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => {
      const list = window.speechSynthesis.getVoices();
      const items = [{ name: "자동 선택", value: "auto" }].concat(
        list.map(v => ({ name: `${v.name} (${v.lang})`, value: v.name }))
      );
      setVoices(items);
    };
    load();
    const id = setInterval(load, 300);
    setTimeout(() => clearInterval(id), 1500);
  }, []);

  return (
    <>
      {/* 고정된 설정 버튼 */}
      <button className="gear-btn" onClick={() => setOpen(true)} aria-label="설정 열기">⚙</button>

      {open && (
        <div className="sheet-backdrop" onClick={() => setOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-header">
              <h3>설정</h3>
              <button className="icon" onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className="sheet-group">
              <h4>트랙</h4>
              <label className="row">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => {}}
                />
                <span>음성 명령 사용</span>
              </label>
              <label className="row">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => {}}
                />
                <span>텍스트 명령 사용</span>
              </label>
              <label className="row">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => {}}
                />
                <span>앱 진입 시 자동 시작</span>
              </label>
            </div>

            <div className="sheet-group">
              <h4>음성 인식</h4>
              <label className="row">
                <input
                  type="checkbox"
                  checked={settings.autoFillWhileListening}
                  onChange={e => update("autoFillWhileListening", e.target.checked)}
                />
                <span>듣는 중 자동 채움 (권장: 끄기)</span>
              </label>
              <p className="hint">끄면 "파싱하기" 버튼을 눌러야 폼이 채워집니다.</p>
            </div>

            <div className="sheet-group">
              <h4>언어/음성</h4>
              <label className="row">
                <span>인식 언어</span>
                <select
                  value={locale}
                  onChange={e => setLocale(e.target.value)}
                >
                  <option value="ko-KR">한국어 (ko-KR)</option>
                  <option value="en-US">English (en-US)</option>
                  <option value="ja-JP">日本語 (ja-JP)</option>
                </select>
              </label>
              <label className="row">
                <span>TTS 음성</span>
                <select
                  value="auto"
                  onChange={() => {}}
                >
                  {voices.map(v => (
                    <option key={v.name + v.value} value={v.value}>{v.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="sheet-group">
              <h4>NLU (OpenAI)</h4>
              <label className="row">
                <span>모델</span>
                <select
                  value="gpt-4o-mini"
                  onChange={() => {}}
                >
                  <option value="gpt-4o-mini">gpt-4o-mini (권장/저비용)</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-3.5">gpt-3.5</option>
                </select>
              </label>
              <label className="row">
                <span>Temperature</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={0.4}
                  onChange={() => {}}
                />
                <span className="mono">0.40</span>
              </label>
              <p className="hint">API Key는 .env의 <code>VITE_OPENAI_API_KEY</code> 를 사용합니다.</p>
            </div>

            <div className="sheet-footer">
              <button className="ghost" onClick={() => setOpen(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
