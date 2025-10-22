import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import fetch from "node-fetch";

// ??Firebase Admin 珥덇린??(以묐났 諛⑹?)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * AI ?ㅼ떆媛??댁긽 ?먯? ?쒖뒪?? * - Firestore metrics 而щ젆??蹂寃?媛먯?
 * - ?????곗씠??鍮꾧탳 諛?蹂?붿쑉 怨꾩궛
 * - AI 遺꾩꽍 諛?Slack 寃쎈낫 諛쒖넚
 */
export const aiAnomalyWatcher = functions
  .region("asia-northeast3")
  .firestore.document("metrics/{docId}")
  .onWrite(async (change, context) => {
    console.log("?뵇 [AI ALERT] Anomaly detection triggered");

    const after = change.after.data();
    const before = change.before.data();

    // ???곗씠?곌? ?녾굅???댁쟾 ?곗씠???놁쑝硫?醫낅즺
    if (!after) {
      console.log("??툘  [AI ALERT] No new data, skipping");
      return null;
    }

    if (!before) {
      console.log("??툘  [AI ALERT] No previous data, skipping (first write)");
      return null;
    }

    // 媛먯떆 ????꾨뱶
    const fields = ["sales", "signups", "activities"];
    const diffs: Array<{
      field: string;
      diff: number;
      value: number;
      prevValue: number;
    }> = [];

    // 蹂?붿쑉 怨꾩궛
    for (const field of fields) {
      if (typeof after[field] === "number" && typeof before[field] === "number") {
        const diff = before[field] !== 0 
          ? ((after[field] - before[field]) / before[field]) * 100 
          : 0;
        
        diffs.push({
          field,
          diff: Math.round(diff * 10) / 10, // ?뚯닔??1?먮━
          value: after[field],
          prevValue: before[field],
        });
      }
    }

    console.log("?뱤 [AI ALERT] Calculated diffs:", diffs);

    // 10% ?댁긽 蹂?숇쭔 遺꾩꽍 ??곸쑝濡??꾪꽣留?    const anomalies = diffs.filter((d) => Math.abs(d.diff) >= 10);

    if (anomalies.length === 0) {
      console.log("??[AI ALERT] No significant anomalies detected");
      return null;
    }

    console.log("?좑툘  [AI ALERT] Anomalies detected:", anomalies);

    // AI 遺꾩꽍
    const openaiKey = functions.config().openai?.key || process.env.VITE_OPENAI_API_KEY;
    const slackWebhook = functions.config().slack?.webhook || process.env.VITE_SLACK_WEBHOOK_URL;

    if (!openaiKey) {
      console.error("??[AI ALERT] OpenAI API Key not configured");
      return null;
    }

    const prompt = `
?뱀떊? YAGO VIBE ?뚮옯?쇱쓽 ?ㅼ떆媛?紐⑤땲?곕쭅 AI?낅땲??
?ㅼ쓬 ?섏튂 蹂?붾? 遺꾩꽍?섍퀬 寃쎄퀬 硫붿떆吏瑜?留뚮뱾?댁＜?몄슂.

?곗씠??蹂??
${anomalies.map((a) => `- ${a.field}: ${a.prevValue} ??${a.value} (${a.diff > 0 ? '+' : ''}${a.diff}%)`).join('\n')}

?붽뎄?ы빆:
1截뤴깵 媛???ぉ??湲됰벑/湲됰씫 ?먯씤??異붿젙
2截뤴깵 鍮꾩쫰?덉뒪 ?곹뼢??遺꾩꽍
3截뤴깵 1~2以??붿빟 寃쎄퀬 臾몄옣 ?앹꽦
4截뤴깵 Slack 怨듭??⑹쑝濡?媛꾧껐?섍쾶 ?щ㎎??
異쒕젰 ?뺤떇:
[?붿빟] ??以??붿빟
[遺꾩꽍] ?곸꽭 遺꾩꽍 (媛꾧껐?섍쾶)
[議곗튂] 沅뚯옣 議곗튂?ы빆 (?좏깮??
`;

    try {
      const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
          max_tokens: 500,
        }),
      });

      const aiData = await aiResp.json();
      const summary = aiData.choices?.[0]?.message?.content || "AI 遺꾩꽍 ?ㅽ뙣";

      console.log("?쭬 [AI ALERT] AI analysis completed");

      // Slack ?뚮┝ 硫붿떆吏
      if (slackWebhook) {
        const slackMessage = {
          text: `?좑툘 *YAGO VIBE ?ㅼ떆媛?寃쎈낫*`,
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "?좑툘 YAGO VIBE ?ㅼ떆媛?寃쎈낫",
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*?쒓컙:* ${new Date().toLocaleString("ko-KR")}\n*臾몄꽌 ID:* ${context.params.docId}`,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*?뱤 媛먯????댁긽 吏뺥썑:*\n${anomalies
                  .map(
                    (a) =>
                      `??*${a.field}*: ${a.prevValue} ??${a.value} (${
                        a.diff > 0 ? "+" : ""
                      }${a.diff}%)`
                  )
                  .join("\n")}`,
              },
            },
            {
              type: "divider",
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*?쭬 AI 遺꾩꽍:*\n${summary}`,
              },
            },
          ],
        };

        await fetch(slackWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(slackMessage),
        });

        console.log("?뮠 [AI ALERT] Slack notification sent");
      } else {
        console.warn("?좑툘  [AI ALERT] Slack webhook not configured");
      }

      // Firestore??寃쎈낫 湲곕줉
      await db.collection("alerts").add({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        docId: context.params.docId,
        summary,
        anomalies,
        severity: anomalies.some((a) => Math.abs(a.diff) >= 30) ? "high" : "medium",
      });

      console.log("??[AI ALERT] Alert saved to Firestore");
      return { success: true, anomalies: anomalies.length };
    } catch (error) {
      console.error("??[AI ALERT] Error:", error);
      return null;
    }
  });

