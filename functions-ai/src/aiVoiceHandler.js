const admin = require("firebase-admin");
const OpenAI = require("openai");

admin.initializeApp();
const db = admin.firestore();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const handleVoiceInput = async (req, res) => {
  // CORS 설정
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).send("Missing transcript");

    console.log(`[AI Voice Auto] Processing transcript: ${transcript}`);

    const prompt = `
사용자의 음성 텍스트를 분석해서 중고상품 정보를 구조화하세요.

예시:
- "나이키 축구화 만원에 팔아요" → { "title": "나이키 축구화", "price": 10000, "category": "축구화", "desc": "나이키 축구화 판매", "status": "open" }
- "아디다스 유니폼 5만원" → { "title": "아디다스 유니폼", "price": 50000, "category": "유니폼", "desc": "아디다스 유니폼 판매", "status": "open" }
- "축구공 싸게 팔아요" → { "title": "축구공", "price": null, "category": "공", "desc": "축구공 싸게 판매", "status": "open" }

규칙:
- 단가는 숫자로 추정 (만원=10000, 천원=1000, 십만원=100000)
- 명확한 가격이 없으면 null
- 분류는 (축구화, 유니폼, 공, 용품, 기타) 중 하나
- 설명은 자연스럽게 완성 문장으로 작성
- status는 항상 "open"
- JSON만 반환하고 다른 설명은 포함하지 마세요
`;

    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an assistant that extracts product info from voice text for a Korean marketplace." },
        { role: "user", content: `${prompt}\n\n사용자 입력: ${transcript}` },
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    const raw = result.choices[0].message.content;
    
    if (!raw) {
      throw new Error("OpenAI API returned empty response");
    }

    // JSON 파싱 시도
    let parsed;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError);
      console.error("Raw response:", raw);
      
      // 파싱 실패 시 기본값 반환
      parsed = {
        title: transcript,
        price: null,
        category: "기타",
        desc: `음성 입력: ${transcript}`,
        status: "open"
      };
    }

    // Firestore에 문서 생성
    const docRef = await db.collection("marketItems").add({
      ...parsed,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      voiceInput: transcript,
      aiProcessed: true,
      aiProcessedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`[AI Voice Auto] Document created: ${docRef.id}`, parsed);

    res.json({ 
      ok: true, 
      data: parsed, 
      docId: docRef.id,
      message: "음성 기반 상품 등록이 완료되었습니다."
    });
  } catch (err) {
    console.error("Voice AI Error:", err);
    res.status(500).json({ 
      ok: false, 
      error: String(err),
      message: "음성 처리 중 오류가 발생했습니다."
    });
  }
};

module.exports = { handleVoiceInput };
