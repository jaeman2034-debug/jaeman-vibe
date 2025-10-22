import * as functions from "firebase-functions";
import fetch from "node-fetch";

export const getKakaoDirections = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    // CORS ?ㅼ젙
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    const { origin, destination } = req.query;
    if (!origin || !destination) {
      return res.status(400).json({ error: "origin, destination ?꾩슂" });
    }

    const [ox, oy] = (origin as string).split(",");
    const [dx, dy] = (destination as string).split(",");

    if (!ox || !oy || !dx || !dy) {
      return res.status(400).json({ error: "醫뚰몴 ?뺤떇???щ컮瑜댁? ?딆뒿?덈떎" });
    }

    // Kakao Mobility Directions API ?몄텧 (?꾨줈?뺤뀡 理쒖쟻??
    const url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${ox},${oy}&destination=${dx},${dy}&priority=RECOMMEND&car_fuel=GASOLINE&car_hipass=false&alternatives=false&road_details=true`;
    
    const headers = {
      Authorization: `KakaoAK ${functions.config().kakao.key}`,
      "Content-Type": "application/json",
    };

    try {
      console.log("?뿺截?Kakao Directions API ?몄텧 (?꾨줈?뺤뀡):", url);
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        console.error("??API ?묐떟 ?ㅻ쪟:", response.status, response.statusText);
        
        // n8n ?뚮┝ (?듭뀡)
        const n8nWebhook = functions.config().n8n?.webhook;
        if (n8nWebhook) {
          fetch(n8nWebhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "route_error",
              payload: { origin, destination, status: response.status, error: response.statusText }
            })
          }).catch(() => {}); // ?뚮┝ ?ㅽ뙣??臾댁떆
        }
        
        return res.status(response.status).json({ 
          error: "Kakao Directions API ?ㅻ쪟", 
          status: response.status 
        });
      }

      const data = await response.json();
      console.log("??寃쎈줈 ?곗씠???섏떊:", data.routes?.length || 0, "媛?寃쎈줈");
      
      // ?꾨줈?뺤뀡 紐⑤컮???ㅻ퉬寃뚯씠?섏슜 ?곗씠??媛怨?      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // ?대컮?댄꽩 ?덈궡瑜??꾪븳 媛?대뱶 ?뺣낫 媛뺥솕
        const processedRoute = {
          ...route,
          sections: route.sections.map((section: any) => ({
            ...section,
            guides: section.guides.map((guide: any) => ({
              ...guide,
              // 紐⑤컮??TTS??理쒖쟻?붾맂 ?덈궡 臾몄옣
              mobileGuidance: guide.guidance.replace(/\./g, "").trim(),
              // 嫄곕━蹂??덈궡 ??대컢 (諛고꽣由?理쒖쟻??
              announcementDistance: guide.distance <= 100 ? 50 : guide.distance <= 300 ? 100 : 200,
              // ?덈궡 ?곗꽑?쒖쐞
              priority: guide.distance <= 50 ? "high" : guide.distance <= 200 ? "medium" : "low"
            }))
          }))
        };
        
        data.routes[0] = processedRoute;
      }
      
      res.json(data);
    } catch (error) {
      console.error("??Kakao Directions API ?몄텧 ?ㅽ뙣:", error);
      
      // n8n ?뚮┝ (?듭뀡)
      const n8nWebhook = functions.config().n8n?.webhook;
      if (n8nWebhook) {
        fetch(n8nWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "route_error",
            payload: { origin, destination, error: (error as Error).message }
          })
        }).catch(() => {}); // ?뚮┝ ?ㅽ뙣??臾댁떆
      }
      
      res.status(500).json({ error: "API ?몄텧 ?ㅽ뙣", details: (error as Error).message });
    }
  });
