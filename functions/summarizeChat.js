// Firebase Functions - 채팅 메시지 자동 요약 & 감정 분석
// 배포: firebase deploy --only functions:summarizeChat

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

// Firebase Admin 초기화 (최초 1회만)
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.summarizeChat = functions.firestore
  .document("chats/{chatId}/messages/{msgId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const { text, transcript, sender, createdAt } = data;

    // 텍스트나 음성 변환 텍스트가 없으면 스킵
    if (!text && !transcript) {
      console.log("⏭️ 텍스트/음성 없음 - 요약 생략");
      return null;
    }

    const content = transcript || text;
    console.log("🔍 요약 대상 텍스트:", content);

    try {
      // 🔥 ChatGPT API로 요약 + 감정 분석
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `당신은 스포츠 커뮤니티 대화 분석가입니다.
아래 텍스트를 분석하여 JSON 형식으로 반환하세요:

{
  "summary": "핵심 내용 1-2줄 요약",
  "sentiment": "positive 또는 neutral 또는 negative",
  "keywords": ["키워드1", "키워드2"]
}

감정 판단 기준:
- positive: 긍정적, 만족, 칭찬, 기쁨
- neutral: 중립적, 사실 전달, 질문
- negative: 불만, 비판, 걱정, 슬픔`,
            },
            {
              role: "user",
              content: content,
            },
          ],
        }),
      });

      const result = await res.json();
      const aiResponse = result.choices[0]?.message?.content || "요약 실패";

      console.log("✅ AI 응답:", aiResponse);

      // JSON 파싱 시도
      let summary = aiResponse;
      let sentiment = "neutral";
      let keywords = [];

      try {
        const parsed = JSON.parse(aiResponse);
        summary = parsed.summary || aiResponse;
        sentiment = parsed.sentiment || "neutral";
        keywords = parsed.keywords || [];
      } catch (e) {
        // JSON 파싱 실패 시 텍스트에서 추출
        if (aiResponse.includes("긍정") || aiResponse.includes("positive")) sentiment = "positive";
        if (aiResponse.includes("부정") || aiResponse.includes("negative")) sentiment = "negative";
      }

      console.log("✅ AI 요약 완료:", { summary, sentiment, keywords });

      // Firestore chat_summaries에 저장
      await admin.firestore().collection("chat_summaries").add({
        chatId: context.params.chatId,
        messageId: context.params.msgId,
        summary,
        sentiment,
        emotion: sentiment, // 호환성
        keywords,
        original: content,
        sender,
        createdAt: createdAt || admin.firestore.FieldValue.serverTimestamp(),
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("✅ 요약 Firestore 저장 완료");
      return { success: true };
    } catch (error) {
      console.error("❌ 요약 생성 오류:", error);
      return { success: false, error: error.message };
    }
  });

