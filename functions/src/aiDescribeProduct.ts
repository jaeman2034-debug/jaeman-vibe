import * as functions from "firebase-functions";
import fetch from "node-fetch";

export const aiDescribeProduct = functions.https.onCall(async (data, context) => {
  const { imageUrl } = data;

  if (!imageUrl) {
    throw new functions.https.HttpsError("invalid-argument", "imageUrl???꾩슂?⑸땲??");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new functions.https.HttpsError("failed-precondition", "OpenAI API ?ㅺ? ?ㅼ젙?섏? ?딆븯?듬땲??");
  }

  const body = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "???대?吏??以묎퀬 ?ㅽ룷痢??⑺뭹?낅땲?? ?ㅼ쓬 ?뺤떇?쇰줈 ?쒓뎅?대줈 ?붿빟?댁쨾:\n\n?쒕ぉ: [?곹뭹紐?\n?ㅻ챸: [?곹뭹 ?ㅻ챸]\n移댄뀒怨좊━: [異뺢뎄/?쇨뎄/?띻뎄/?뚮땲??怨⑦봽/湲고?]\n?뱀쭠: [二쇱슂 ?뱀쭠]"
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl
            }
          }
        ]
      }
    ],
    max_tokens: 500,
    temperature: 0.7
  };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`OpenAI API ?ㅻ쪟: ${res.status} ${res.statusText}`);
    }

    const responseData = await res.json();
    const aiText = responseData?.choices?.[0]?.message?.content || "AI ?ㅻ챸 ?앹꽦 ?ㅽ뙣";
    
    // AI ?묐떟???뚯떛?섏뿬 援ъ“?붾맂 ?곗씠?곕줈 蹂??    const parsedData = parseAIResponse(aiText);
    
    return {
      success: true,
      rawText: aiText,
      ...parsedData
    };
  } catch (err) {
    console.error("AI 泥섎━ ?ㅻ쪟:", err);
    throw new functions.https.HttpsError("internal", "AI 泥섎━ 以??ㅻ쪟 諛쒖깮");
  }
});

// AI ?묐떟 ?뚯떛 ?⑥닔
function parseAIResponse(text: string) {
  const lines = text.split('\n').filter(line => line.trim());
  let title = "";
  let description = "";
  let category = "湲고?";
  let features = "";

  lines.forEach(line => {
    if (line.includes('?쒕ぉ:')) {
      title = line.replace('?쒕ぉ:', '').trim();
    } else if (line.includes('?ㅻ챸:')) {
      description = line.replace('?ㅻ챸:', '').trim();
    } else if (line.includes('移댄뀒怨좊━:')) {
      const cat = line.replace('移댄뀒怨좊━:', '').trim();
      if (['異뺢뎄', '?쇨뎄', '?띻뎄', '?뚮땲??, '怨⑦봽', '湲고?'].includes(cat)) {
        category = cat;
      }
    } else if (line.includes('?뱀쭠:')) {
      features = line.replace('?뱀쭠:', '').trim();
    }
  });

  return {
    title: title || "?곹뭹紐?,
    description: description || "?곹뭹 ?ㅻ챸???놁뒿?덈떎.",
    category: category,
    features: features || ""
  };
}
