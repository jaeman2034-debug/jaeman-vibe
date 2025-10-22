import React, { useEffect, useMemo, useRef, useState } from "react";
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore, collection, onSnapshot, query, orderBy,
  addDoc, serverTimestamp, updateDoc, doc, type Firestore, type DocumentData,
} from "firebase/firestore";
import {
  getStorage, ref as sRef, uploadBytes, getDownloadURL, type FirebaseStorage,
} from "firebase/storage";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";

/* ======================
  ?”§ ENV (.env)
==========================
VITE_KAKAO_MAP_APP_KEY=ì¹´ì¹´?¤JS??VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_OPENAI_API_KEY=sk-********

# ?˜ì´ë¸Œë¦¬??ê³µê°œ/ê´€ë¦¬ì ?„í™˜
VITE_MARKET_REQUIRE_AUTH=true
VITE_MARKET_ADMIN_UIDS=uidA,uidB
*/
type MarketItem = {
  id: string;
  title: string;
  price?: number | null;
  imageUrl?: string;          // ?€???¸ë„¤??  imageUrls?: string[];       // ?¤ì¤‘ ?´ë?ì§€
  status?: "open" | "reserved" | "sold" | string;
  createdAt?: any;
  location?: { lat: number; lng: number; address?: string } | null;
  desc?: string;
  phone?: string;
  kakaoId?: string;
  sellerUid?: string | null;
  // AI ë¶„ì„ ê²°ê³¼
  aiTags?: string[];          // AIê°€ ?ì„±???œê·¸??  aiCategory?: string;        // AIê°€ ë¶„ë¥˜??ì¹´í…Œê³ ë¦¬
  aiBrand?: string;           // AIê°€ ?¸ì‹??ë¸Œëœ??  aiColor?: string;           // AIê°€ ?¸ì‹??ì£¼ìš” ?‰ìƒ
  aiCondition?: string;       // AIê°€ ?‰ê????í’ˆ ?íƒœ
  aiSuggestedPrice?: {        // AIê°€ ì¶”ì²œ?˜ëŠ” ê°€ê²?    min: number;
    max: number;
    confidence: number;       // ? ë¢°??(0-1)
    reasoning: string;        // ê°€ê²?ì¶”ì • ê·¼ê±°
  };
  aiAnalysisCompleted?: boolean; // AI ë¶„ì„ ?„ë£Œ ?¬ë?
};

declare global { interface Window { kakao?: any } }

/* Kakao SDK Loader (clusterer ?¬í•¨) */
async function loadKakaoSdk(appkey: string): Promise<typeof window.kakao> {
  if (window.kakao?.maps) return window.kakao;
  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("kakao-map-sdk");
    if (existing) { window.kakao?.maps?.load(() => resolve()); return; }
    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&libraries=services,clusterer&autoload=false`;
    script.onload = () => window.kakao.maps.load(() => resolve());
    script.onerror = () => reject(new Error("Kakao SDK load failed"));
    document.head.appendChild(script);
  });
  return window.kakao!;
}

/* Firebase bootstrap */
function ensureFirebase(): { app: FirebaseApp; db: Firestore; storage: FirebaseStorage } {
  const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  };
  const app = getApps().length ? (getApps()[0] as FirebaseApp) : initializeApp(cfg);
  return { app, db: getFirestore(app), storage: getStorage(app) };
}

/* AI ?´ë?ì§€ ë¶„ì„ ?¨ìˆ˜ */
async function analyzeImageWithAI(imageUrl: string): Promise<{
  tags: string[];
  category: string;
  brand?: string;
  color?: string;
  condition?: string;
  suggestedPrice?: {
    min: number;
    max: number;
    confidence: number;
    reasoning: string;
  };
}> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OpenAI API ?¤ê? ?¤ì •?˜ì? ?Šì•˜?µë‹ˆ??");
    return {
      tags: ["AI ë¶„ì„ ë¶ˆê?"],
      category: "ê¸°í?",
      suggestedPrice: {
        min: 0,
        max: 0,
        confidence: 0,
        reasoning: "API ?¤ê? ?¤ì •?˜ì? ?ŠìŒ"
      }
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `???´ë?ì§€ë¥?ë¶„ì„?´ì„œ ì¤‘ê³ ê±°ë˜ ë§ˆì¼“???•ë³´ë¥?ì¶”ì¶œ?´ì£¼?¸ìš”. 
                
                ?¤ìŒ ?•ì‹??JSON?¼ë¡œ ?‘ë‹µ?´ì£¼?¸ìš”:
                {
                  "tags": ["?œê·¸1", "?œê·¸2", "?œê·¸3"],
                  "category": "ì¹´í…Œê³ ë¦¬ëª?,
                  "brand": "ë¸Œëœ?œëª… (?¸ì‹ ê°€?¥í•œ ê²½ìš°)",
                  "color": "ì£¼ìš” ?‰ìƒ",
                  "condition": "?í’ˆ ?íƒœ (?ˆê²ƒ/ì¢‹ìŒ/ë³´í†µ/?˜ì¨)",
                  "suggestedPrice": {
                    "min": ìµœì†Œê°€ê²?
                    "max": ìµœë?ê°€ê²?
                    "confidence": 0.0-1.0,
                    "reasoning": "ê°€ê²?ì¶”ì • ê·¼ê±°"
                  }
                }
                
                ?œê·¸???í’ˆ???¹ì§•, ?©ë„, ?¬ì§ˆ ?±ì„ ?¬í•¨?´ì£¼?¸ìš”.
                ì¹´í…Œê³ ë¦¬??"?˜ë¥˜", "?„ì?œí’ˆ", "ê°€êµ?, "?„ì„œ", "?¤í¬ì¸ ìš©??, "ê¸°í?" ì¤??˜ë‚˜ë¡?ë¶„ë¥˜?´ì£¼?¸ìš”.
                ê°€ê²©ì? ?œêµ­ ì¤‘ê³ ê±°ë˜ ?œì¥ ê¸°ì??¼ë¡œ ?„ì‹¤?ìœ¼ë¡?ì¶”ì •?´ì£¼?¸ìš”.`
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
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API ?¤ë¥˜: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("AI ?‘ë‹µ??ë¹„ì–´?ˆìŠµ?ˆë‹¤.");
    }

    // JSON ?Œì‹± ?œë„
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          tags: parsed.tags || [],
          category: parsed.category || "ê¸°í?",
          brand: parsed.brand,
          color: parsed.color,
          condition: parsed.condition,
          suggestedPrice: parsed.suggestedPrice
        };
      }
    } catch (parseError) {
      console.warn("AI ?‘ë‹µ JSON ?Œì‹± ?¤íŒ¨:", parseError);
    }

    // JSON ?Œì‹± ?¤íŒ¨ ??ê¸°ë³¸ê°?ë°˜í™˜
    return {
      tags: ["AI ë¶„ì„ ?„ë£Œ"],
      category: "ê¸°í?",
      suggestedPrice: {
        min: 0,
        max: 0,
        confidence: 0,
        reasoning: "AI ?‘ë‹µ ?Œì‹± ?¤íŒ¨"
      }
    };

  } catch (error) {
    console.error("AI ?´ë?ì§€ ë¶„ì„ ?¤ë¥˜:", error);
    return {
      tags: ["ë¶„ì„ ?¤ë¥˜"],
      category: "ê¸°í?",
      suggestedPrice: {
        min: 0,
        max: 0,
        confidence: 0,
        reasoning: `ë¶„ì„ ?¤ë¥˜: ${error instanceof Error ? error.message : "?????†ëŠ” ?¤ë¥˜"}`
      }
    };
  }
}

/* utils */
const money = (n?: number | null) => (typeof n === "number" ? n.toLocaleString("ko-KR") + "?? : "ê°€ê²©ë¬¸??);
function labelStatus(s?: string) { switch (s) { case "open": return "?ë§¤ì¤?; case "reserved": return "?ˆì•½ì¤?; case "sold": return "ê±°ë˜?„ë£Œ"; default: return s || "ê¸°í?"; } }
function statusBadgeColor(s?: string) { switch (s) { case "open": return "bg-emerald-100 text-emerald-700"; case "reserved": return "bg-amber-100 text-amber-700"; case "sold": return "bg-gray-200 text-gray-600"; default: return "bg-slate-100 text-slate-700"; } }
function haversineKm(a:{lat:number;lng:number}, b:{lat:number;lng:number}) { const R=6371, dLat=((b.lat-a.lat)*Math.PI)/180, dLng=((b.lng-a.lng)*Math.PI)/180; const lat1=(a.lat*Math.PI)/180, lat2=(b.lat*Math.PI)/180; const h=Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2; return 2*R*Math.atan2(Math.sqrt(h), Math.sqrt(1-h)); }
function escapeHtml(s: string) { return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;"); }
function escapeAttr(s: string) { return s.replaceAll('"',"&quot;").replaceAll("'","&#39;"); }
const isProd = () => location.hostname !== "localhost" && !location.hostname.startsWith("127.");
const REQUIRE_AUTH = String(import.meta.env.VITE_MARKET_REQUIRE_AUTH || "true").toLowerCase() === "true";
const ADMIN_UIDS = String(import.meta.env.VITE_MARKET_ADMIN_UIDS || "").split(",").map(s=>s.trim()).filter(Boolean);

type SortKey = "latest" | "distance" | "priceLow" | "priceHigh";

const MarketPage_AI_AutoTag: React.FC = () => {
  const { db, storage } = useMemo(() => ensureFirebase(), []);
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);

  // auth
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => onAuthStateChanged(getAuth(), setUser), []);

  // my pos
  const [myPos, setMyPos] = useState<{lat:number;lng:number} | null>(null);
  const [geoErr, setGeoErr] = useState<string | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) { setGeoErr("??ë¸Œë¼?°ì????„ì¹˜ ?•ë³´ê°€ ì§€?ë˜ì§€ ?ŠìŠµ?ˆë‹¤."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos)=>{ setMyPos({lat:pos.coords.latitude, lng:pos.coords.longitude}); setGeoErr(null); },
      ()=> setGeoErr("?„ì¹˜ ê¶Œí•œ ê±°ë? ?ëŠ” ë¶ˆê?"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // filters & sort
  const [radiusKm, setRadiusKm] = useState(50);
  const [statusFilter, setStatusFilter] = useState<"all"|"open"|"reserved"|"sold">("all");
  const [textQuery, setTextQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("latest");

  // map
  const [showMap, setShowMap] = useState(false);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const infoRef = useRef<any | null>(null);
  const clustererRef = useRef<any | null>(null);

  // detail modal
  const [selected, setSelected] = useState<MarketItem | null>(null);

  // create form
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [desc, setDesc] = useState("");
  const [phone, setPhone] = useState("");
  const [kakaoId, setKakaoId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // subscribe
  useEffect(() => {
    setLoading(true);
    const qy = query(collection(db, "marketItems"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(qy, (snap) => {
      const arr: MarketItem[] = [];
      snap.forEach((d) => {
        const data = d.data() as DocumentData;
        arr.push({
          id: d.id,
          title: data.title ?? "",
          price: data.price ?? null,
          imageUrl: data.imageUrl ?? "",
          imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : (data.imageUrl ? [data.imageUrl] : []),
          status: data.status ?? "open",
          createdAt: data.createdAt ?? null,
          location: data.location ?? null,
          desc: data.desc ?? "",
          phone: data.phone ?? "",
          kakaoId: data.kakaoId ?? "",
          sellerUid: data.sellerUid ?? null,
          aiTags: data.aiTags ?? [],
          aiCategory: data.aiCategory ?? "",
          aiBrand: data.aiBrand ?? "",
          aiColor: data.aiColor ?? "",
          aiCondition: data.aiCondition ?? "",
          aiSuggestedPrice: data.aiSuggestedPrice ?? null,
          aiAnalysisCompleted: data.aiAnalysisCompleted ?? false,
        });
      });
      setItems(arr);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [db]);

  // filtered + sorted list
  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter !== "all") list = list.filter(i => i.status === statusFilter);
    if (textQuery.trim()) {
      const t = textQuery.trim().toLowerCase();
      list = list.filter(i => 
        (i.title||"").toLowerCase().includes(t) ||
        (i.desc||"").toLowerCase().includes(t) ||
        (i.aiTags||[]).some(tag => tag.toLowerCase().includes(t))
      );
    }
    if (myPos) list = list.filter(i => i.location ? haversineKm(myPos, i.location) <= radiusKm : true);

    // sort
    const withDist = list.map(i => ({
      item: i,
      dist: myPos && i.location ? haversineKm(myPos, i.location) : Infinity,
    }));
    switch (sortKey) {
      case "distance":
        return withDist.sort((a,b)=>a.dist-b.dist).map(x=>x.item);
      case "priceLow":
        return [...list].sort((a,b)=>(a.price??Infinity)-(b.price??Infinity));
      case "priceHigh":
        return [...list].sort((a,b)=>(b.price??-Infinity)-(a.price??-Infinity));
      case "latest":
      default:
        return list; // ?´ë? createdAt desc êµ¬ë…
    }
  }, [items, statusFilter, textQuery, myPos, radiusKm, sortKey]);

  // map render with clusterer
  useEffect(() => {
    if (!showMap) return;
    const appkey = import.meta.env.VITE_KAKAO_MAP_APP_KEY as string;
    if (!appkey) { console.warn("VITE_KAKAO_MAP_APP_KEY ?„ë½"); return; }
    let canceled = false;
    (async () => {
      const kakao = await loadKakaoSdk(appkey);
      if (canceled) return;

      if (!mapRef.current && mapDivRef.current) {
        const center = myPos ?? { lat: 37.5665, lng: 126.9780 };
        mapRef.current = new kakao.maps.Map(mapDivRef.current, {
          center: new kakao.maps.LatLng(center.lat, center.lng),
          level: 6,
        });
        infoRef.current = new kakao.maps.InfoWindow({ zIndex: 3 });
        clustererRef.current = new kakao.maps.MarkerClusterer({
          map: mapRef.current,
          averageCenter: true,
          minLevel: 6,
        });
      }
      const map = mapRef.current;
      const clusterer = clustererRef.current;
      clusterer.clear();

      const markers: any[] = [];
      const bounds = new kakao.maps.LatLngBounds();

      filtered.forEach((it) => {
        if (!it.location) return;
        const pos = new kakao.maps.LatLng(it.location.lat, it.location.lng);
        const marker = new kakao.maps.Marker({ position: pos });
        markers.push(marker);
        bounds.extend(pos);

        const html = `
          <div style="padding:8px 10px;">
            <div style="font-weight:600;margin-bottom:4px;">${escapeHtml(it.title || "")}</div>
            <div style="font-size:12px;margin-bottom:4px;">${money(it.price)}</div>
            ${it.aiCategory ? `<div style="font-size:10px;color:#666;margin-bottom:2px;">?“‚ ${escapeHtml(it.aiCategory)}</div>` : ""}
            ${it.aiTags && it.aiTags.length > 0 ? `<div style="font-size:10px;color:#888;">?·ï¸?${escapeHtml(it.aiTags.slice(0,3).join(", "))}</div>` : ""}
            ${it.imageUrl ? `<img src="${escapeAttr(it.imageUrl)}" style="width:180px;height:120px;object-fit:cover;border-radius:8px;" />` : ""}
          </div>`;
        window.kakao.maps.event.addListener(marker, "click", () => {
          infoRef.current?.setContent(html);
          infoRef.current?.open(map, marker);
        });
      });

      clusterer.addMarkers(markers);
      if (!bounds.isEmpty()) map.setBounds(bounds, 20, 20, 20, 20);
      else if (myPos) { map.setCenter(new kakao.maps.LatLng(myPos.lat, myPos.lng)); map.setLevel(5); }
    })();
    return () => { canceled = true; };
  }, [showMap, filtered, myPos]);

  // status change
  const updateStatus = async (item: MarketItem, st: "open"|"reserved"|"sold") => {
    await updateDoc(doc(getFirestore(), "marketItems", item.id), { status: st });
  };

  // create with multi-upload + AI analysis
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      const limited = files.slice(0, 3);
      const uploaded: string[] = [];
      
      // ?´ë?ì§€ ?…ë¡œ??      for (const f of limited) {
        const path = `market/${Date.now()}_${Math.random().toString(36).slice(2)}_${f.name}`;
        const r = sRef(storage, path);
        await uploadBytes(r, f);
        uploaded.push(await getDownloadURL(r));
      }
      
      const imageUrl = uploaded[0] || "";
      const location = myPos ? { lat: myPos.lat, lng: myPos.lng } : null;

      // Firestore??ê¸°ë³¸ ?•ë³´ ?€??      const docRef = await addDoc(collection(getFirestore(), "marketItems"), {
        title: title.trim() || "?œëª© ?†ìŒ",
        price: typeof price === "number" ? price : null,
        desc: desc.trim() || "",
        phone: phone.trim() || "",
        kakaoId: kakaoId.trim() || "",
        imageUrl,
        imageUrls: uploaded,
        status: "open",
        createdAt: serverTimestamp(),
        location,
        sellerUid: user?.uid ?? null,
        aiAnalysisCompleted: false,
      });

      // AI ë¶„ì„ ?œì‘ (ë¹„ë™ê¸?
      if (uploaded.length > 0) {
        setAiAnalyzing(true);
        try {
          const aiResult = await analyzeImageWithAI(uploaded[0]);
          
          // AI ë¶„ì„ ê²°ê³¼ë¥?Firestore???…ë°?´íŠ¸
          await updateDoc(docRef, {
            aiTags: aiResult.tags,
            aiCategory: aiResult.category,
            aiBrand: aiResult.brand || "",
            aiColor: aiResult.color || "",
            aiCondition: aiResult.condition || "",
            aiSuggestedPrice: aiResult.suggestedPrice || null,
            aiAnalysisCompleted: true,
          });
          
          console.log("AI ë¶„ì„ ?„ë£Œ:", aiResult);
        } catch (aiError) {
          console.error("AI ë¶„ì„ ì¤??¤ë¥˜:", aiError);
          await updateDoc(docRef, {
            aiAnalysisCompleted: false,
            aiTags: ["ë¶„ì„ ?¤íŒ¨"]
          });
        } finally {
          setAiAnalyzing(false);
        }
      }

      // reset
      setTitle(""); setPrice(undefined); setDesc(""); setPhone(""); setKakaoId(""); setFiles([]);
      alert("?±ë¡ ?„ë£Œ!" + (uploaded.length > 0 ? " (AI ë¶„ì„ ì§„í–‰ ì¤?..)" : ""));
    } catch (err) {
      console.error(err);
      alert("?±ë¡ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    } finally {
      setSubmitting(false);
    }
  };

  // guard (hybrid)
  const mustBeAdmin = isProd() && REQUIRE_AUTH;
  const isAdmin = user && (ADMIN_UIDS.length === 0 || ADMIN_UIDS.includes(user.uid));

  return (
    <div className="mx-auto max-w-5xl p-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold">?§  AI ì¤‘ê³ ê±°ë˜ ë§ˆì¼“</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowMap(s=>!s)} className="rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm border hover:bg-slate-50">
            {showMap ? "?“¦ ëª©ë¡ë§?ë³´ê¸°" : "?—ºï¸?ì§€???´ëŸ¬?¤í„°) ë³´ê¸°"}
          </button>

          <div className="flex items-center gap-2 rounded-2xl border px-3 py-2">
            <span className="text-xs text-slate-500">ë°˜ê²½</span>
            <input type="range" min={1} max={50} step={1} value={radiusKm} onChange={e=>setRadiusKm(Number(e.target.value))} />
            <span className="text-xs font-medium">{radiusKm}km</span>
          </div>

          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value as any)} className="rounded-2xl border px-3 py-2 text-sm">
            <option value="all">?„ì²´ ?íƒœ</option>
            <option value="open">?ë§¤ì¤?/option>
            <option value="reserved">?ˆì•½ì¤?/option>
            <option value="sold">ê±°ë˜?„ë£Œ</option>
          </select>

          <select value={sortKey} onChange={e=>setSortKey(e.target.value as SortKey)} className="rounded-2xl border px-3 py-2 text-sm">
            <option value="latest">ìµœì‹ ??/option>
            <option value="distance" disabled={!myPos}>ê±°ë¦¬??!myPos ? " (?„ì¹˜ ?„ìš”)" : ""}</option>
            <option value="priceLow">ê°€ê²©â†‘</option>
            <option value="priceHigh">ê°€ê²©â†“</option>
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="mt-3">
        <input placeholder="?í’ˆëª? ?¤ëª…, AI ?œê·¸ë¡?ê²€?‰â€? value={textQuery} onChange={e=>setTextQuery(e.target.value)}
          className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300" />
      </div>

      {/* Position status */}
      <div className="mt-2 text-xs text-slate-500">
        {myPos ? <span>???„ì¹˜ ê¸°ì? ë°˜ê²½ {radiusKm}km</span> : geoErr ? <span>?„ì¹˜ ë¯¸ì‚¬?? {geoErr}</span> : <span>???„ì¹˜ ?•ì¸ ì¤‘â€?/span>}
      </div>

      {/* Map */}
      {showMap && (
        <div className="mt-4 overflow-hidden rounded-2xl border">
          <div ref={mapDivRef} style={{ width: "100%", height: 420 }} />
        </div>
      )}

      {/* Create Form */}
      <div className="mt-6">
        {mustBeAdmin && !isAdmin ? (
          <div className="rounded-2xl border p-4 text-sm text-slate-600">?´ì˜ ?˜ê²½?ì„œ??ê´€ë¦¬ìë§??í’ˆ???±ë¡?????ˆìŠµ?ˆë‹¤. (ë¡œê·¸???„ìš”)</div>
        ) : (
          <form onSubmit={handleCreate} className="rounded-2xl border p-4 grid gap-3">
            <div className="text-sm font-semibold">?“¦ ?í’ˆ ?±ë¡ (ìµœë? 3???…ë¡œ??+ ?§  AI ?ë™ ë¶„ì„)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="?œëª©" value={title} onChange={e=>setTitle(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" required />
              <input placeholder="ê°€ê²?(?«ì)" value={price ?? ""} onChange={e=>setPrice(e.target.value? Number(e.target.value) : undefined)} type="number" min={0} className="rounded-xl border px-3 py-2 text-sm" />
            </div>
            <textarea placeholder="?¤ëª…" value={desc} onChange={e=>setDesc(e.target.value)} className="rounded-xl border px-3 py-2 text-sm h-24" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="?°ë½ì²??„í™”) ?? 010-1234-5678" value={phone} onChange={e=>setPhone(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" />
              <input placeholder="ì¹´ì¹´?¤ID ?ëŠ” ?¤í”ˆì±„íŒ… ??? íƒ)" value={kakaoId} onChange={e=>setKakaoId(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" />
            </div>
            <input multiple accept="image/*" type="file" onChange={e=>setFiles(Array.from(e.target.files ?? []).slice(0,3))} className="text-sm" />
            {files.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {files.map((f, i)=>(
                  <div key={i} className="text-xs border rounded-lg px-2 py-1">{f.name}</div>
                ))}
              </div>
            )}
            <button disabled={submitting || aiAnalyzing} className="w-max rounded-xl border px-4 py-2 text-sm bg-slate-900 text-white disabled:opacity-60">
              {submitting ? "?±ë¡ ì¤‘â€? : aiAnalyzing ? "?§  AI ë¶„ì„ ì¤‘â€? : "?±ë¡?˜ê¸°"}
            </button>
            <div className="text-xs text-slate-500">
              * ?„ì¹˜ ê¶Œí•œ???ˆìš©?˜ë©´ ?„ì¬ ?„ì¹˜ê°€ ?¨ê»˜ ?€?¥ë©?ˆë‹¤. (ê±°ë? ???„ì¹˜ ?†ì´ ?€??<br/>
              * ?§  AIê°€ ?´ë?ì§€ë¥??ë™ ë¶„ì„?´ì„œ ?œê·¸, ì¹´í…Œê³ ë¦¬, ì¶”ì²œê°€ê²©ì„ ?ì„±?©ë‹ˆ??
            </div>
          </form>
        )}
      </div>

      {/* List */}
      <div className="mt-6">
        {loading ? (
          <div className="rounded-2xl border p-6 text-sm text-slate-500">ë¶ˆëŸ¬?¤ëŠ” ì¤‘â€?/div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border p-6 text-sm text-slate-500">ì¡°ê±´??ë§ëŠ” ?í’ˆ???†ìŠµ?ˆë‹¤.</div>
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map(it => (
              <li key={it.id} className="rounded-2xl border p-3 hover:shadow-sm transition" onClick={()=>setSelected(it)}>
                <div className="grid grid-cols-[120px_1fr] gap-3 sm:grid-cols-[160px_1fr]">
                  <img src={(it.imageUrl || it.imageUrls?.[0]) || "https://via.placeholder.com/300x200?text=No+Image"} alt=""
                    className="h-[100px] w-[120px] sm:h-[120px] sm:w-[160px] rounded-xl object-cover" loading="lazy" />
                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="line-clamp-1 text-base font-semibold">{it.title || "?œëª© ?†ìŒ"}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${statusBadgeColor(it.status)}`}>{labelStatus(it.status)}</span>
                        {it.aiAnalysisCompleted && <span className="rounded-full px-2 py-0.5 text-[10px] bg-blue-100 text-blue-700">?§  AI</span>}
                      </div>
                      <div className="mt-1 text-sm font-bold">{money(it.price)}</div>
                      {it.aiCategory && (
                        <div className="mt-1 text-xs text-blue-600">?“‚ {it.aiCategory}</div>
                      )}
                      {it.aiTags && it.aiTags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {it.aiTags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">#{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-slate-500">
                        {myPos && it.location ? `???„ì¹˜ë¡œë?????${haversineKm(myPos, it.location).toFixed(1)}km`
                          : it.location?.address || "?„ì¹˜ ?•ë³´ ?†ìŒ"}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {it.phone && (
                        <a href={`tel:${String(it.phone).replaceAll(/\D/g, "")}`} className="rounded-xl border px-3 py-1 text-xs hover:bg-slate-50" onClick={(e)=>e.stopPropagation()}>?„í™”?˜ê¸°</a>
                      )}
                      {it.kakaoId && (
                        <a href={`https://open.kakao.com/o/${encodeURIComponent(it.kakaoId)}`} target="_blank" rel="noreferrer"
                           className="rounded-xl border px-3 py-1 text-xs hover:bg-slate-50" onClick={(e)=>e.stopPropagation()}>ì¹´ì¹´?¤í†¡</a>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={()=>setSelected(null)}>
          <div className="bg-white rounded-2xl p-5 w-[92%] max-w-lg relative max-h-[90vh] overflow-y-auto" onClick={(e)=>e.stopPropagation()}>
            <button onClick={()=>setSelected(null)} className="absolute top-3 right-3 text-slate-500 hover:text-slate-700">??/button>

            {/* ?´ë?ì§€ ?¬ë¼?´ë“œ */}
            <div className="mb-3">
              <div className="w-full h-[220px] rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                <img
                  src={(selected.imageUrl || selected.imageUrls?.[0]) || "https://via.placeholder.com/600x400"}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              {selected.imageUrls && selected.imageUrls.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto">
                  {selected.imageUrls.map((u, i)=>(
                    <img key={i} src={u} alt="" className="h-14 w-20 object-cover rounded-lg border cursor-pointer"
                      onClick={()=>{ setSelected({ ...selected, imageUrl: u }); }} />
                  ))}
                </div>
              )}
            </div>

            <h2 className="text-lg font-bold mb-1">{selected.title}</h2>
            <p className="text-sm text-slate-600 mb-3">{selected.desc || "?¤ëª… ?†ìŒ"}</p>
            <div className="text-base font-bold mb-3">?’° {money(selected.price)}</div>

            {/* AI ë¶„ì„ ê²°ê³¼ */}
            {selected.aiAnalysisCompleted && (
              <div className="mb-4 p-3 bg-blue-50 rounded-xl">
                <div className="text-sm font-semibold text-blue-800 mb-2">?§  AI ë¶„ì„ ê²°ê³¼</div>
                {selected.aiCategory && (
                  <div className="text-xs text-blue-700 mb-1">?“‚ ì¹´í…Œê³ ë¦¬: {selected.aiCategory}</div>
                )}
                {selected.aiBrand && (
                  <div className="text-xs text-blue-700 mb-1">?·ï¸?ë¸Œëœ?? {selected.aiBrand}</div>
                )}
                {selected.aiColor && (
                  <div className="text-xs text-blue-700 mb-1">?¨ ?‰ìƒ: {selected.aiColor}</div>
                )}
                {selected.aiCondition && (
                  <div className="text-xs text-blue-700 mb-1">â­??íƒœ: {selected.aiCondition}</div>
                )}
                {selected.aiTags && selected.aiTags.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-blue-700 mb-1">?·ï¸??œê·¸:</div>
                    <div className="flex flex-wrap gap-1">
                      {selected.aiTags.map((tag, i) => (
                        <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selected.aiSuggestedPrice && (
                  <div className="mt-2 p-2 bg-white rounded-lg">
                    <div className="text-xs font-semibold text-blue-800">?’° AI ì¶”ì²œ ê°€ê²?/div>
                    <div className="text-sm font-bold text-blue-700">
                      {selected.aiSuggestedPrice.min.toLocaleString()}??~ {selected.aiSuggestedPrice.max.toLocaleString()}??                    </div>
                    <div className="text-xs text-blue-600">? ë¢°?? {Math.round(selected.aiSuggestedPrice.confidence * 100)}%</div>
                    <div className="text-xs text-blue-600 mt-1">{selected.aiSuggestedPrice.reasoning}</div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              {["open","reserved","sold"].map(st => (
                <button key={st} onClick={()=>updateStatus(selected, st as any)}
                  className={`px-3 py-1 rounded-xl border text-sm ${selected.status===st ? "bg-slate-800 text-white" : "hover:bg-slate-100"}`}>
                  {labelStatus(st)}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              {selected.phone && (
                <a href={`tel:${String(selected.phone).replaceAll(/\D/g, "")}`} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">?“ ?„í™”</a>
              )}
              {selected.kakaoId && (
                <a href={`https://open.kakao.com/o/${encodeURIComponent(selected.kakaoId)}`} target="_blank" rel="noreferrer"
                   className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">?’¬ ì¹´ì¹´?¤í†¡</a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketPage_AI_AutoTag;
