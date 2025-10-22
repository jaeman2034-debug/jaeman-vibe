import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * ?벀 Storage ?대?吏 ?낅줈?????먮룞 ?쒓렇 ?앹꽦 諛?Firestore ?낅뜲?댄듃
 * 
 * ?몃━嫄? Storage onFinalize
 * 湲곕뒫:
 * 1. market-uploads 臾몄꽌?먯꽌 caption_ko 濡쒕뱶
 * 2. ?쒓뎅??罹≪뀡?먯꽌 ?ㅼ썙??異붿텧
 * 3. tags 諛곗뿴 ?꾨뱶 ?낅뜲?댄듃
 * 4. searchKeywords ?꾨뱶 ?앹꽦 (寃??理쒖쟻??
 */
export const autoGenerateTags = functions.firestore
  .document("market-uploads/{uploadId}")
  .onWrite(async (change, context) => {
    const uploadId = context.params.uploadId;

    // 臾몄꽌 ??젣??寃쎌슦 臾댁떆
    if (!change.after.exists) {
      console.log(`??臾몄꽌 ??젣?? ?쒓렇 ?앹꽦 ?ㅽ궢:`, uploadId);
      return null;
    }

    const data = change.after.data();
    const caption_ko = data?.caption_ko;
    const caption_en = data?.caption_en;

    // caption???놁쑝硫??쒓렇 ?앹꽦 遺덇?
    if (!caption_ko && !caption_en) {
      console.log(`?좑툘 caption???놁뼱???쒓렇 ?앹꽦 遺덇?:`, uploadId);
      return null;
    }

    console.log(`?뤇截??먮룞 ?쒓렇 ?앹꽦 ?쒖옉:`, uploadId);

    try {
      // 1截뤴깵 ?쒓뎅??罹≪뀡?먯꽌 ?쒓렇 異붿텧
      const koreanTags = caption_ko
        ? caption_ko
            .split(/[\s,\.!?]+/) // 怨듬갚, ?쇳몴, 留덉묠???깆쑝濡?遺꾨━
            .filter((word: string) => word.length > 1) // 1湲?먮뒗 ?쒖쇅
            .filter((word: string) => !/^[0-9]+$/.test(word)) // ?レ옄留??덈뒗 寃??쒖쇅
            .slice(0, 10) // 理쒕? 10媛?        : [];

      // 2截뤴깵 ?곸뼱 罹≪뀡?먯꽌 ?쒓렇 異붿텧 (?좏깮)
      const englishTags = caption_en
        ? caption_en
            .toLowerCase()
            .split(/[\s,\.!?]+/)
            .filter((word: string) => word.length > 2)
            .filter((word: string) => !/^[0-9]+$/.test(word))
            .slice(0, 5)
        : [];

      // 3截뤴깵 以묐났 ?쒓굅
      const allTags = Array.from(new Set([...koreanTags, ...englishTags]));

      // 4截뤴깵 ?ㅽ룷痢?愿???ㅼ썙???꾪꽣留?諛??곗꽑?쒖쐞 吏??      const sportsKeywords = [
        "異뺢뎄", "異뺢뎄怨?, "異뺢뎄??, "?좊땲??, "?대룞蹂?, "?대룞??,
        "?쇨뎄", "?띻뎄", "諛곌뎄", "?뚮땲??, "怨⑦궎??, "怨⑤?",
        "soccer", "football", "ball", "shoes", "uniform", "sports",
        "jersey", "boots", "goalkeeper", "goal", "field", "stadium"
      ];

      const priorityTags = allTags.filter(tag =>
        sportsKeywords.some(keyword => tag.includes(keyword))
      );

      const otherTags = allTags.filter(tag =>
        !sportsKeywords.some(keyword => tag.includes(keyword))
      );

      const finalTags = [...priorityTags, ...otherTags].slice(0, 15);

      // 5截뤴깵 寃??理쒖쟻?붿슜 ?ㅼ썙???앹꽦 (?뚮Ц??蹂?? 以묐났 ?쒓굅)
      const searchKeywords = Array.from(
        new Set(
          finalTags.map(tag => tag.toLowerCase()).concat(
            data?.title?.toLowerCase().split(/[\s,\.!?]+/) || []
          )
        )
      ).filter(kw => kw.length > 1);

      console.log(`???앹꽦???쒓렇:`, finalTags);
      console.log(`?뵇 寃???ㅼ썙??`, searchKeywords);

      // 6截뤴깵 Firestore ?낅뜲?댄듃
      await db.collection("market-uploads").doc(uploadId).update({
        tags: finalTags,
        searchKeywords: searchKeywords,
        tagsGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`?럦 ?쒓렇 ?앹꽦 ?꾨즺:`, uploadId);
      return null;

    } catch (error) {
      console.error(`???쒓렇 ?앹꽦 ?ㅻ쪟 [${uploadId}]:`, error);
      return null;
    }
  });

/**
 * ?쭬 AI 湲곕컲 ?먯뿰??寃?됱뼱 ???쒓렇 蹂??(Callable Function)
 * 
 * ?ъ슜?먭? "異뺢뎄?????좉린 醫뗭? ?좊컻" 媛숈? ?먯뿰?대줈 寃?됲븯硫? * GPT媛 ?듭떖 ?ㅼ썙??2-3媛쒕? 異붿텧?댁꽌 諛섑솚
 */
export const refineSearchKeyword = functions.https.onCall(async (data, context) => {
  const { query } = data;

  if (!query || typeof query !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "query ?뚮씪誘명꽣媛 ?꾩슂?⑸땲??"
    );
  }

  console.log(`?쭬 ?먯뿰??寃?됱뼱 遺꾩꽍:`, query);

  try {
    const apiKey = functions.config().openai?.api_key || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.warn("?좑툘 OpenAI API ?ㅺ? ?놁뼱???먮낯 荑쇰━ 諛섑솚");
      return { keywords: [query] };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `?뱀떊? ?ㅽ룷痢??⑺뭹 寃???ㅼ썙??異붿텧 ?꾨Ц媛?낅땲??
?ъ슜?먯쓽 ?먯뿰??寃?됱뼱?먯꽌 ?듭떖 ?ㅼ썙??2-3媛쒕쭔 異붿텧?섏꽭??
?쇳몴濡?援щ텇?섏뿬 諛섑솚?섏꽭??

?덉떆:
?낅젰: "異뺢뎄?????좉린 醫뗭? ?좊컻"
異쒕젰: "異뺢뎄?? ?좊컻, 異뺢뎄"

?낅젰: "怨⑦궎?쇨? 李⑹슜?섎뒗 ?κ컩"
異쒕젰: "怨⑦궎?? ?κ컩"`,
          },
          { role: "user", content: query },
        ],
        max_tokens: 50,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error("??OpenAI API ?ㅻ쪟:", response.status);
      return { keywords: [query] };
    }

    const result = await response.json();
    const rawKeywords = result.choices?.[0]?.message?.content?.trim() || query;

    // ?쇳몴濡?遺꾨━ 諛??뺣━
    const keywords = rawKeywords
      .split(",")
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 0)
      .slice(0, 3); // 理쒕? 3媛?
    console.log(`??異붿텧???ㅼ썙??`, keywords);

    return { keywords };

  } catch (error: any) {
    console.error("???ㅼ썙??異붿텧 ?ㅻ쪟:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

