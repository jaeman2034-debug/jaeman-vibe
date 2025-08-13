import { normalizeSpeechKoreanToEmail } from './normalizeSpeech';

export type ParsedSignup = {
  email?: string;
  password?: string;
  _debug?: { normalized: string; aiText?: string };
};

async function callOpenAIAsJson(prompt: string): Promise<Record<string, any> | null> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        messages: [
          {
            role: 'system',
            content:
              'You are a JSON extractor. Return ONLY a JSON object like {"email":"...","password":"..."}; use null if unknown.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });
    const data = await res.json();
    const aiText = data?.choices?.[0]?.message?.content ?? '';

    if (typeof aiText === 'string' && aiText.trim()) {
      try {
        return { __aiText: aiText, ...JSON.parse(aiText) };
      } catch {
        const start = aiText.indexOf('{');
        const end = aiText.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          return { __aiText: aiText, ...JSON.parse(aiText.slice(start, end + 1)) };
        }
      }
    }
    return null;
  } catch (e) {
    console.warn('OpenAI 호출 실패:', e);
    return null;
  }
}

export async function parseSignupFromSpeech(raw: string): Promise<ParsedSignup> {
  const normalized = normalizeSpeechKoreanToEmail(raw);

  const ai = await callOpenAIAsJson(
    `다음 한국어 문장에서 회원가입용 이메일과 비밀번호를 찾아줘.
문장: "${normalized}"
반드시 {"email":"...","password":"..."} 형식의 JSON만 제공하고, 모르면 null로 반환해.`,
  );

  if (ai && (ai.email || ai.password)) {
    return {
      email: ai.email ?? undefined,
      password: ai.password ?? undefined,
      _debug: { normalized, aiText: ai.__aiText },
    };
  }

  const compact = normalized
    .replace(/\s*@\s*/g, '@')
    .replace(/\s*\.\s*/g, '.')
    .replace(/\s+/g, ' ');

  const email =
    compact.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0] ?? undefined;

  const pwToken =
    compact.match(/(?:비번|비밀번호|패스워드)(?:은|는)?[\s:]*["']?([^\s"'.,:]{4,})/i)?.[1] ??
    undefined;

  return { email, password: pwToken, _debug: { normalized } };
}

export const parseSignUpInfo = parseSignupFromSpeech;
