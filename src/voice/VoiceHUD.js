import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useVoice } from './VoiceContext';
export default function VoiceHUD() {
    const { supported, listening, lastText, interimText, toggle } = useVoice();
    if (!supported)
        return null;
    return (_jsxs("div", { style: { position: 'fixed', right: 16, bottom: 16, zIndex: 1000, display: 'grid', gap: 8, maxWidth: 360 }, children: [_jsxs("button", { onClick: toggle, style: { padding: '10px 14px', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', background: listening ? '#d32' : '#222', color: '#fff' }, children: ["\uD83C\uDFA4 ", listening ? '듣는 중… (클릭하여 중지)' : '음성 시작'] }), (interimText || lastText) && (_jsxs("div", { style: { background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 12, fontSize: 12, color: '#333' }, children: [_jsx("div", { style: { opacity: 0.6 }, children: "\uBA85\uB839" }), _jsx("div", { children: _jsx("b", { children: interimText || lastText }) })] }))] }));
}
