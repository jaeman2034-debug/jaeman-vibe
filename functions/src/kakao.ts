/**
 * ?렎 Kakao Mini ?ㅽ궗 - ?쇨퀬 釉뚮━???꾩꽦?? * "?쇨퀬 釉뚮━????댁쨾" ??理쒖떊 AI ?뚯꽦 由ы룷???먮룞 ?ъ깮
 */

import * as functions from "firebase-functions";
import { getFirestore } from "firebase-admin/firestore";

// Firestore ?몄뒪?댁뒪
const db = getFirestore();

// Kakao i ?ㅽ뵂鍮뚮뜑 ?묐떟 ?щ㎎
interface KakaoResponse {
  version: string;
  template: {
    outputs: Array<{
      simpleText?: { text: string };
      media?: {
        type: string;
        content: {
          title: string;
          description: string;
          url: string;
        };
      };
    }>;
  };
}

export const kakaoBriefing = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    // CORS ?ㅼ젙
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(200).send("");
      return;
    }

    try {
      console.log("?렎 Kakao Mini 釉뚮━???붿껌:", req.body);

      // 理쒖떊 由ы룷??議고쉶 (ai_voice_reports 而щ젆???ъ슜)
      const snap = await db
        .collection("ai_voice_reports")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (snap.empty) {
        const response: KakaoResponse = {
          version: "2.0",
          template: {
            outputs: [
              {
                simpleText: {
                  text: "?뱤 ?쇨퀬 釉뚮━??n\n?ㅻ뒛? ?앹꽦??AI 釉뚮━?묒씠 ?놁뼱?? 留ㅼ씪 00:00???먮룞?쇰줈 ?앹꽦?⑸땲?? ?댁씪 ?ㅼ떆 ?쒕룄?대낫?몄슂! ?렒"
                }
              }
            ]
          }
        };
        res.json(response);
        return;
      }

      const doc = snap.docs[0].data();
      const audioUrl = doc.audioUrl;
      const summary = doc.summary || doc.ttsSummary || "AI ?뚯꽦 由ы룷??;
      const reportDate = doc.reportDate || "?ㅻ뒛";
      const totalCount = doc.stats?.totalCount || 0;
      const totalValue = doc.stats?.totalValue || 0;

      // ?ㅻ뵒??URL???덈뒗 寃쎌슦
      if (audioUrl) {
        const title = `?렒 ${reportDate} ?쇨퀬 釉뚮━??;
        const description = `珥?${totalCount}嫄?嫄곕옒, ${(totalValue / 10000).toFixed(0)}留뚯썝 嫄곕옒??;

        const response: KakaoResponse = {
          version: "2.0",
          template: {
            outputs: [
              {
                simpleText: {
                  text: `?뱤 ?ㅻ뒛???쇨퀬 釉뚮━??n\n${summary.slice(0, 80)}...\n\n${description}\n\n?ъ깮???쒖옉?⑸땲?? ?렦`
                }
              },
              {
                media: {
                  type: "audio",
                  content: {
                    title: "YAGO VIBE AI 由ы룷??,
                    description: description,
                    url: audioUrl
                  }
                }
              }
            ]
          }
        };

        console.log("??Kakao Mini ?묐떟 ?꾩넚:", title);
        res.json(response);
      } else {
        // ?ㅻ뵒??URL???녿뒗 寃쎌슦
        const response: KakaoResponse = {
          version: "2.0",
          template: {
            outputs: [
              {
                simpleText: {
                  text: `?뱤 ${reportDate} ?쇨퀬 釉뚮━??n\n${summary.slice(0, 150)}...\n\n?ㅻ뵒???뚯씪??以鍮꾨릺吏 ?딆븯?듬땲?? ????쒕낫?쒖뿉???뺤씤?대낫?몄슂!`
                }
              }
            ]
          }
        };
        res.json(response);
      }
    } catch (error) {
      console.error("??Kakao Mini ?ㅽ궗 ?ㅻ쪟:", error);
      
      const errorResponse: KakaoResponse = {
        version: "2.0",
        template: {
          outputs: [
            {
              simpleText: {
                text: "二꾩넚?댁슂. 釉뚮━?묒쓣 遺덈윭?ㅻ뒗 以??ㅻ쪟媛 諛쒖깮?덉뼱?? ?좎떆 ???ㅼ떆 ?쒕룄?대낫?몄슂. ?렒"
              }
            }
          ]
        }
      };
      res.json(errorResponse);
    }
  });

// ?뿎截??댁젣 釉뚮━???ㅽ궗
export const kakaoYesterdayBriefing = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(200).send("");
      return;
    }

    try {
      // ?댁젣 ?좎쭨 怨꾩궛
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // ?댁젣 由ы룷??議고쉶
      const snap = await db
        .collection("ai_voice_reports")
        .where("reportDate", ">=", yesterdayStr)
        .where("reportDate", "<", new Date().toISOString().split('T')[0])
        .orderBy("reportDate", "desc")
        .limit(1)
        .get();

      if (snap.empty) {
        const response: KakaoResponse = {
          version: "2.0",
          template: {
            outputs: [
              {
                simpleText: {
                  text: "?뿎截??댁젣 ?쇨퀬 釉뚮━??n\n?댁젣???앹꽦??釉뚮━?묒씠 ?놁뼱?? ?ㅻ뒛 釉뚮━?묒쓣 ?ㅼ뼱蹂댁떆寃좎뼱?? ?렒"
                }
              }
            ]
          }
        };
        res.json(response);
        return;
      }

      const doc = snap.docs[0].data();
      const audioUrl = doc.audioUrl;
      const summary = doc.summary || doc.ttsSummary || "?댁젣 AI ?뚯꽦 由ы룷??;

      if (audioUrl) {
        const response: KakaoResponse = {
          version: "2.0",
          template: {
            outputs: [
              {
                simpleText: {
                  text: `?뿎截??댁젣 ?쇨퀬 釉뚮━??n\n${summary.slice(0, 80)}...\n\n?ъ깮???쒖옉?⑸땲?? ?렦`
                }
              },
              {
                media: {
                  type: "audio",
                  content: {
                    title: "?뿎截??댁젣 ?쇨퀬 釉뚮━??,
                    description: "?댁젣??AI ?뚯꽦 由ы룷??,
                    url: audioUrl
                  }
                }
              }
            ]
          }
        };
        res.json(response);
      } else {
        const response: KakaoResponse = {
          version: "2.0",
          template: {
            outputs: [
              {
                simpleText: {
                  text: `?뿎截??댁젣 ?쇨퀬 釉뚮━??n\n${summary.slice(0, 150)}...\n\n?ㅻ뵒???뚯씪??以鍮꾨릺吏 ?딆븯?듬땲??`
                }
              }
            ]
          }
        };
        res.json(response);
      }
    } catch (error) {
      console.error("???댁젣 釉뚮━???ㅻ쪟:", error);
      res.json({
        version: "2.0",
        template: {
          outputs: [
            {
              simpleText: {
                text: "?댁젣 釉뚮━?묒쓣 遺덈윭?ㅻ뒗 以??ㅻ쪟媛 諛쒖깮?덉뼱?? ?렒"
              }
            }
          ]
        }
      });
    }
  });

// ?뱤 ?쇱＜???붿빟 ?ㅽ궗
export const kakaoWeeklySummary = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(200).send("");
      return;
    }

    try {
      // 理쒓렐 7??由ы룷??議고쉶
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const snap = await db
        .collection("ai_voice_reports")
        .where("createdAt", ">=", weekAgo)
        .orderBy("createdAt", "desc")
        .get();

      if (snap.empty) {
        const response: KakaoResponse = {
          version: "2.0",
          template: {
            outputs: [
              {
                simpleText: {
                  text: "?뱤 ?쇱＜???쇨퀬 ?붿빟\n\n理쒓렐 ?쇱＜?쇨컙 ?앹꽦??釉뚮━?묒씠 ?놁뼱?? 留ㅼ씪 00:00???먮룞?쇰줈 ?앹꽦?⑸땲?? ?렒"
                }
              }
            ]
          }
        };
        res.json(response);
        return;
      }

      // ?듦퀎 怨꾩궛
      let totalReports = 0;
      let totalTransactions = 0;
      let totalValue = 0;
      const areas: { [key: string]: number } = {};

      snap.forEach(doc => {
        const data = doc.data();
        totalReports++;
        totalTransactions += data.stats?.totalCount || 0;
        totalValue += data.stats?.totalValue || 0;
        
        const area = data.stats?.topArea || "湲고?";
        areas[area] = (areas[area] || 0) + 1;
      });

      const topArea = Object.entries(areas)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || "?뺣낫 ?놁쓬";

      const summary = `?뱤 ?쇱＜???쇨퀬 釉뚮━???붿빟\n\n` +
        `??珥?釉뚮━?? ${totalReports}媛?n` +
        `??珥?嫄곕옒: ${totalTransactions}嫄?n` +
        `??珥?嫄곕옒?? ${(totalValue / 10000).toFixed(0)}留뚯썝\n` +
        `??二쇱슂 吏?? ${topArea}\n\n` +
        `理쒓렐 7?쇨컙 ?쒕컻??嫄곕옒媛 ?덉뿀?ㅼ슂! ?럦`;

      const response: KakaoResponse = {
        version: "2.0",
        template: {
          outputs: [
            {
              simpleText: {
                text: summary
              }
            }
          ]
        }
      };

      res.json(response);
    } catch (error) {
      console.error("???쇱＜???붿빟 ?ㅻ쪟:", error);
      res.json({
        version: "2.0",
        template: {
          outputs: [
            {
              simpleText: {
                text: "?쇱＜???붿빟??遺덈윭?ㅻ뒗 以??ㅻ쪟媛 諛쒖깮?덉뼱?? ?렒"
              }
            }
          ]
        }
      });
    }
  });
