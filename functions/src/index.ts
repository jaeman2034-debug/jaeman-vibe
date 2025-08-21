import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import fetch from 'node-fetch';

// Firebase Secrets 정의
const KAKAO_REST_KEY = defineSecret('KAKAO_REST_KEY');

export const analyzeProduct = onRequest(
  { secrets: [KAKAO_REST_KEY] },
  async (req, res) => {
    try {
      const { images, hint } = req.body as { images: string[]; hint?: string };

      // --- OpenAI 경로(키가 있으면 사용)
      const OPENAI = process.env.OPENAI_API_KEY;
      if (OPENAI && images?.length) {
        const payload = {
          model: "gpt-4o-mini",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: `이미지의 카테고리/브랜드/색상/상태(A/B/C)/태그 5개/제목을 JSON으로.
hint: ${hint ?? ""}` },
              ...images.map(u => ({ type: "image_url", image_url: { url: u } }))
            ]
          }],
          temperature: 0.3
        };
        const r = await fetch("https://api.openai.com/v1/chat/completions", {
          method:"POST",
          headers: { "Authorization":`Bearer ${OPENAI}`, "Content-Type":"application/json" },
          body: JSON.stringify(payload)
        });
        const j:any = await r.json();
        const text = j.choices?.[0]?.message?.content ?? "{}";
        return res.json({ ok:true, provider:"openai", result: JSON.parse(text) });
      }

      // --- 모의 결과(키 없을 때)
      const guessTitle = hint?.slice(0,30) || "중고 스포츠용품";
      return res.json({
        ok:true, provider:"mock",
        result: {
          category:"sports",
          brand:"unknown",
          color:"mixed",
          condition:"B",
          tags:["sports","used","good-condition","deal","local"],
          title: guessTitle
        }
      });
    } catch (e:any) {
      console.error(e);
      res.status(500).json({ ok:false, error:e.message });
    }
  }
);

export const reverseGeocode = onRequest(
  { secrets: [KAKAO_REST_KEY] },
  async (req, res) => {
    const { lat, lng } = req.body;
    const key = KAKAO_REST_KEY.value();
    const url = `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}`;
    const r = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` } });
    res.json(await r.json());
  }
); 