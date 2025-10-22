import React, { useEffect, useMemo, useRef, useState } from "react";
import { db, auth, storage } from "@/lib/firebase";
import {
  collection, onSnapshot, query, orderBy,
  addDoc, serverTimestamp, updateDoc, doc, type Firestore, type DocumentData,
} from "firebase/firestore";
import {
  ref as sRef, uploadBytes, getDownloadURL, type FirebaseStorage,
} from "firebase/storage";
import { onAuthStateChanged, type User } from "firebase/auth";

/* ======================
  ?�� ENV (.env)
==========================
VITE_KAKAO_MAP_APP_KEY=카카?�JS??VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
# OpenAI API Key??Firebase Functions?�서 관�?(보안)

# ?�이브리??공개/관리자 ?�환
VITE_MARKET_REQUIRE_AUTH=true
VITE_MARKET_ADMIN_UIDS=uidA,uidB
*/
type MarketItem = {
  id: string;
  title: string;
  price?: number | null;
  imageUrl?: string;          // ?�???�네??  imageUrls?: string[];       // ?�중 ?��?지
  status?: "open" | "reserved" | "sold" | string;
  createdAt?: any;
  location?: { lat: number; lng: number; address?: string } | null;
  desc?: string;
  phone?: string;
  kakaoId?: string;
  sellerUid?: string | null;
  // AI 분석 결과 (Cloud Function?�서 ?�데?�트)
  aiTags?: string[];          // AI가 ?�성???�그??  aiCategory?: string;        // AI가 분류??카테고리
  aiBrand?: string;           // AI가 ?�식??브랜??  aiColor?: string;           // AI가 ?�식??주요 ?�상
  aiCondition?: string;       // AI가 ?��????�품 ?�태
  aiSuggestedPrice?: {        // AI가 추천?�는 가�?    hint: string;             // 가�??�트 ?�스??    analyzedAt: any;          // 분석 ?�간
  };
  aiAnalysisCompleted?: boolean; // AI 분석 ?�료 ?��?
  aiError?: string;           // AI 분석 ?�류 메시지
  aiAnalyzedAt?: any;         // AI 분석 ?�간
};

declare global { interface Window { kakao?: any } }

/* Kakao SDK Loader (clusterer ?�함) */
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

/* Firebase bootstrap - ?�합 관리됨 */

/* Cloud Function ?�출 */
async function callAiAutoTag(imageUrl: string, docId: string): Promise<{ success: boolean; aiResult?: any; error?: string }> {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const functionUrl = `https://asia-northeast3-${projectId}.cloudfunctions.net/aiAutoTag`;
  
  try {
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl,
        docId
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return { success: true, aiResult: data.aiResult };
  } catch (error) {
    console.error("AI Auto Tag Cloud Function ?�출 ?�패:", error);
    return { success: false, error: String(error) };
  }
}

/* utils */
const money = (n?: number | null) => (typeof n === "number" ? n.toLocaleString("ko-KR") + "?? : "가격문??);
function labelStatus(s?: string) { switch (s) { case "open": return "?�매�?; case "reserved": return "?�약�?; case "sold": return "거래?�료"; default: return s || "기�?"; } }
function statusBadgeColor(s?: string) { switch (s) { case "open": return "bg-emerald-100 text-emerald-700"; case "reserved": return "bg-amber-100 text-amber-700"; case "sold": return "bg-gray-200 text-gray-600"; default: return "bg-slate-100 text-slate-700"; } }
function haversineKm(a:{lat:number;lng:number}, b:{lat:number;lng:number}) { const R=6371, dLat=((b.lat-a.lat)*Math.PI)/180, dLng=((b.lng-a.lng)*Math.PI)/180; const lat1=(a.lat*Math.PI)/180, lat2=(b.lat*Math.PI)/180; const h=Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2; return 2*R*Math.atan2(Math.sqrt(h), Math.sqrt(1-h)); }
function escapeHtml(s: string) { return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;"); }
function escapeAttr(s: string) { return s.replaceAll('"',"&quot;").replaceAll("'","&#39;"); }
const isProd = () => location.hostname !== "localhost" && !location.hostname.startsWith("127.");
const REQUIRE_AUTH = String(import.meta.env.VITE_MARKET_REQUIRE_AUTH || "true").toLowerCase() === "true";
const ADMIN_UIDS = String(import.meta.env.VITE_MARKET_ADMIN_UIDS || "").split(",").map(s=>s.trim()).filter(Boolean);

type SortKey = "latest" | "distance" | "priceLow" | "priceHigh";

const MarketPage_AI_CloudFunction: React.FC = () => {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);

  // auth
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // my pos
  const [myPos, setMyPos] = useState<{lat:number;lng:number} | null>(null);
  const [geoErr, setGeoErr] = useState<string | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) { setGeoErr("??브라?��????�치 ?�보가 지?�되지 ?�습?�다."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos)=>{ setMyPos({lat:pos.coords.latitude, lng:pos.coords.longitude}); setGeoErr(null); },
      ()=> setGeoErr("?�치 권한 거�? ?�는 불�?"),
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
          aiError: data.aiError ?? null,
          aiAnalyzedAt: data.aiAnalyzedAt ?? null,
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
        return list; // ?��? createdAt desc 구독
    }
  }, [items, statusFilter, textQuery, myPos, radiusKm, sortKey]);

  // map render with clusterer
  useEffect(() => {
    if (!showMap) return;
    const appkey = import.meta.env.VITE_KAKAO_MAP_APP_KEY as string;
    if (!appkey) { console.warn("VITE_KAKAO_MAP_APP_KEY ?�락"); return; }
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
            ${it.aiCategory ? `<div style="font-size:10px;color:#666;margin-bottom:2px;">?�� ${escapeHtml(it.aiCategory)}</div>` : ""}
            ${it.aiTags && it.aiTags.length > 0 ? `<div style="font-size:10px;color:#888;">?���?${escapeHtml(it.aiTags.slice(0,3).join(", "))}</div>` : ""}
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

  // create with multi-upload + Cloud Function AI analysis
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      const limited = files.slice(0, 3);
      const uploaded: string[] = [];
      
      // ?��?지 ?�로??      for (const f of limited) {
        const path = `market/${Date.now()}_${Math.random().toString(36).slice(2)}_${f.name}`;
        const r = sRef(storage, path);
        await uploadBytes(r, f);
        uploaded.push(await getDownloadURL(r));
      }
      
      const imageUrl = uploaded[0] || "";
      const location = myPos ? { lat: myPos.lat, lng: myPos.lng } : null;

      // Firestore??기본 ?�보 ?�??      const docRef = await addDoc(collection(getFirestore(), "marketItems"), {
        title: title.trim() || "?�목 ?�음",
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

      // Cloud Function?�로 AI 분석 ?�작 (비동�?
      if (uploaded.length > 0) {
        setAiAnalyzing(true);
        try {
          const result = await callAiAutoTag(uploaded[0], docRef.id);
          
          if (result.success) {
            console.log("Cloud Function AI 분석 ?�료:", result.aiResult);
            alert("?�록 ?�료! ?�� AI 분석???�료?�었?�니??");
          } else {
            console.error("Cloud Function AI 분석 ?�패:", result.error);
            alert("?�록 ?�료! (AI 분석?� ?�패?�습?�다)");
          }
        } catch (aiError) {
          console.error("AI 분석 �??�류:", aiError);
          alert("?�록 ?�료! (AI 분석?� ?�패?�습?�다)");
        } finally {
          setAiAnalyzing(false);
        }
      } else {
        alert("?�록 ?�료!");
      }

      // reset
      setTitle(""); setPrice(undefined); setDesc(""); setPhone(""); setKakaoId(""); setFiles([]);
    } catch (err) {
      console.error(err);
      alert("?�록 �??�류가 발생?�습?�다.");
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
        <h1 className="text-2xl font-extrabold">?�️ AI 중고거래 마켓 (Cloud Function)</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowMap(s=>!s)} className="rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm border hover:bg-slate-50">
            {showMap ? "?�� 목록�?보기" : "?���?지???�러?�터) 보기"}
          </button>

          <div className="flex items-center gap-2 rounded-2xl border px-3 py-2">
            <span className="text-xs text-slate-500">반경</span>
            <input type="range" min={1} max={50} step={1} value={radiusKm} onChange={e=>setRadiusKm(Number(e.target.value))} />
            <span className="text-xs font-medium">{radiusKm}km</span>
          </div>

          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value as any)} className="rounded-2xl border px-3 py-2 text-sm">
            <option value="all">?�체 ?�태</option>
            <option value="open">?�매�?/option>
            <option value="reserved">?�약�?/option>
            <option value="sold">거래?�료</option>
          </select>

          <select value={sortKey} onChange={e=>setSortKey(e.target.value as SortKey)} className="rounded-2xl border px-3 py-2 text-sm">
            <option value="latest">최신??/option>
            <option value="distance" disabled={!myPos}>거리??!myPos ? " (?�치 ?�요)" : ""}</option>
            <option value="priceLow">가격↑</option>
            <option value="priceHigh">가격↓</option>
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="mt-3">
        <input placeholder="?�품�? ?�명, AI ?�그�?검?��? value={textQuery} onChange={e=>setTextQuery(e.target.value)}
          className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300" />
      </div>

      {/* Position status */}
      <div className="mt-2 text-xs text-slate-500">
        {myPos ? <span>???�치 기�? 반경 {radiusKm}km</span> : geoErr ? <span>?�치 미사?? {geoErr}</span> : <span>???�치 ?�인 중�?/span>}
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
          <div className="rounded-2xl border p-4 text-sm text-slate-600">?�영 ?�경?�서??관리자�??�품???�록?????�습?�다. (로그???�요)</div>
        ) : (
          <form onSubmit={handleCreate} className="rounded-2xl border p-4 grid gap-3">
            <div className="text-sm font-semibold">?�� ?�품 ?�록 (최�? 3???�로??+ ?�️ Cloud Function AI 분석)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="?�목" value={title} onChange={e=>setTitle(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" required />
              <input placeholder="가�?(?�자)" value={price ?? ""} onChange={e=>setPrice(e.target.value? Number(e.target.value) : undefined)} type="number" min={0} className="rounded-xl border px-3 py-2 text-sm" />
            </div>
            <textarea placeholder="?�명" value={desc} onChange={e=>setDesc(e.target.value)} className="rounded-xl border px-3 py-2 text-sm h-24" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="?�락�??�화) ?? 010-1234-5678" value={phone} onChange={e=>setPhone(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" />
              <input placeholder="카카?�ID ?�는 ?�픈채팅 ???�택)" value={kakaoId} onChange={e=>setKakaoId(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" />
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
              {submitting ? "?�록 중�? : aiAnalyzing ? "?�️ Cloud Function AI 분석 중�? : "?�록?�기"}
            </button>
            <div className="text-xs text-slate-500">
              * ?�치 권한???�용?�면 ?�재 ?�치가 ?�께 ?�?�됩?�다. (거�? ???�치 ?�이 ?�??<br/>
              * ?�️ Cloud Function???�해 OpenAI Vision API�??��?지�??�동 분석?�니?? (API ??보안 강화)
            </div>
          </form>
        )}
      </div>

      {/* List */}
      <div className="mt-6">
        {loading ? (
          <div className="rounded-2xl border p-6 text-sm text-slate-500">불러?�는 중�?/div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border p-6 text-sm text-slate-500">조건??맞는 ?�품???�습?�다.</div>
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
                        <h3 className="line-clamp-1 text-base font-semibold">{it.title || "?�목 ?�음"}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${statusBadgeColor(it.status)}`}>{labelStatus(it.status)}</span>
                        {it.aiAnalysisCompleted && <span className="rounded-full px-2 py-0.5 text-[10px] bg-blue-100 text-blue-700">?�️ AI</span>}
                        {it.aiError && <span className="rounded-full px-2 py-0.5 text-[10px] bg-red-100 text-red-700">??AI ?�류</span>}
                      </div>
                      <div className="mt-1 text-sm font-bold">{money(it.price)}</div>
                      {it.aiCategory && (
                        <div className="mt-1 text-xs text-blue-600">?�� {it.aiCategory}</div>
                      )}
                      {it.aiTags && it.aiTags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {it.aiTags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">#{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-slate-500">
                        {myPos && it.location ? `???�치로�?????${haversineKm(myPos, it.location).toFixed(1)}km`
                          : it.location?.address || "?�치 ?�보 ?�음"}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {it.phone && (
                        <a href={`tel:${String(it.phone).replaceAll(/\D/g, "")}`} className="rounded-xl border px-3 py-1 text-xs hover:bg-slate-50" onClick={(e)=>e.stopPropagation()}>?�화?�기</a>
                      )}
                      {it.kakaoId && (
                        <a href={`https://open.kakao.com/o/${encodeURIComponent(it.kakaoId)}`} target="_blank" rel="noreferrer"
                           className="rounded-xl border px-3 py-1 text-xs hover:bg-slate-50" onClick={(e)=>e.stopPropagation()}>카카?�톡</a>
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

            {/* ?��?지 ?�라?�드 */}
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
            <p className="text-sm text-slate-600 mb-3">{selected.desc || "?�명 ?�음"}</p>
            <div className="text-base font-bold mb-3">?�� {money(selected.price)}</div>

            {/* AI 분석 결과 */}
            {selected.aiAnalysisCompleted && (
              <div className="mb-4 p-3 bg-blue-50 rounded-xl">
                <div className="text-sm font-semibold text-blue-800 mb-2">?�️ Cloud Function AI 분석 결과</div>
                {selected.aiCategory && (
                  <div className="text-xs text-blue-700 mb-1">?�� 카테고리: {selected.aiCategory}</div>
                )}
                {selected.aiBrand && (
                  <div className="text-xs text-blue-700 mb-1">?���?브랜?? {selected.aiBrand}</div>
                )}
                {selected.aiColor && (
                  <div className="text-xs text-blue-700 mb-1">?�� ?�상: {selected.aiColor}</div>
                )}
                {selected.aiCondition && (
                  <div className="text-xs text-blue-700 mb-1">�??�태: {selected.aiCondition}</div>
                )}
                {selected.aiTags && selected.aiTags.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-blue-700 mb-1">?���??�그:</div>
                    <div className="flex flex-wrap gap-1">
                      {selected.aiTags.map((tag, i) => (
                        <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selected.aiSuggestedPrice && (
                  <div className="mt-2 p-2 bg-white rounded-lg">
                    <div className="text-xs font-semibold text-blue-800">?�� AI 추천 가�?/div>
                    <div className="text-sm font-bold text-blue-700">{selected.aiSuggestedPrice.hint}</div>
                    <div className="text-xs text-blue-600">분석 ?�간: {selected.aiAnalyzedAt?.toDate?.()?.toLocaleString() || "?????�음"}</div>
                  </div>
                )}
              </div>
            )}

            {/* AI 분석 ?�류 */}
            {selected.aiError && (
              <div className="mb-4 p-3 bg-red-50 rounded-xl">
                <div className="text-sm font-semibold text-red-800 mb-2">??AI 분석 ?�류</div>
                <div className="text-xs text-red-700">{selected.aiError}</div>
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
                <a href={`tel:${String(selected.phone).replaceAll(/\D/g, "")}`} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">?�� ?�화</a>
              )}
              {selected.kakaoId && (
                <a href={`https://open.kakao.com/o/${encodeURIComponent(selected.kakaoId)}`} target="_blank" rel="noreferrer"
                   className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">?�� 카카?�톡</a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketPage_AI_CloudFunction;
