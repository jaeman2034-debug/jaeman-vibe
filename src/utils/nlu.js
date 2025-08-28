import { normalizeSpeechKoreanToEmail } from './normalizeSpeech';
async function callOpenAIAsJson(prompt) { const apiKey = import.meta.env.VITE_OPENAI_API_KEY; try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0, messages: [{ role: 'system', content: 'You are a JSON extractor. Return ONLY a JSON object like {"email":"...","password":"..."}; use null if unknown.', }, { role: 'user', content: prompt },], }), });
    const data = await res.json();
    const aiText = data?.choices?.[0]?.message?.content ?? '';
    if (typeof aiText === 'string' && aiText.trim()) {
        try {
            return { __aiText: aiText, ...JSON.parse(aiText) };
        }
        catch {
            const start = aiText.indexOf('{');
            const end = aiText.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
                return { __aiText: aiText, ...JSON.parse(aiText.slice(start, end + 1)) };
            }
        }
    }
    return null;
}
catch (e) {
    console.warn('OpenAI ?�출 ?�패:', e);
    return null;
} }
export async function parseSignupFromSpeech(raw) { const normalized = normalizeSpeechKoreanToEmail(raw); const ai = await callOpenAIAsJson(`?�음 ?�국??문장?�서 ?�원가?�용 ?�메?�과 비�?번호�?찾아�?문장: "${normalized}"반드??{"email":"...","password":"..."} ?�식??JSON�??�공?�고, 모르�?null�?반환??`); if (ai && (ai.email || ai.password)) {
    return { email: ai.email ?? undefined, password: ai.password ?? undefined, _debug: { normalized, aiText: ai.__aiText }, };
} const compact = normalized.replace(/\s*@\s*/g, '@').replace(/\s*\.\s*/g, '.').replace(/\s+/g, ' '); const email = compact.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0] ?? undefined; const pwToken = compact.match(/(?:비번|비�?번호|?�스?�드)(?:?�|???[\s:]*["']?([^\s"'.,:]{4,})/i)?.[1] ?? undefined; return { email, password: pwToken, _debug: { normalized } }; }
export const parseSignUpInfo = parseSignupFromSpeech;
