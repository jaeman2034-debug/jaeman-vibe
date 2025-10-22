import React, { useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, updateDoc, doc, type DocumentData } from "firebase/firestore";
import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "@/firebase";

/* ---------------------------
  ?”§ ENV (.env)
------------------------------
VITE_KAKAO_MAP_APP_KEY=ì¹´ì¹´?¤JS??VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# ?˜ì´ë¸Œë¦¬??ëª¨ë“œ ?œì–´(? íƒ)
# prod?ì„œë§?ê´€ë¦¬ì ?œí•œ???? true
VITE_MARKET_REQUIRE_AUTH=true
# ê´€ë¦¬ì UID ëª©ë¡ (ì½¤ë§ˆ êµ¬ë¶„)
VITE_MARKET_ADMIN_UIDS=uidA,uidB
*/
type MarketItem = {
  id: string;
  title: string;
  price?: number;
  imageUrl?: string;
  status?: "open" | "reserved" | "sold" | string;
  createdAt?: any;
  location?: { lat: number; lng: number; address?: string } | null;
  desc?: string;
  phone?: string;     // ?ë§¤???°ë½ì²?? íƒ)
  kakaoId?: string;   // ì¹´í†¡ID/?¤í”ˆì±„íŒ… ??? íƒ)
  sellerUid?: string; // ?‘ì„±??UID(? íƒ)
};

declare global { interface Window { kakao?: any } }

/* Kakao SDK Loader */
async function loadKakaoSdk(appkey: string): Promise<typeof window.kakao> {
  if (window.kakao?.maps) return window.kakao;
  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("kakao-map-sdk");
    if (existing) { window.kakao?.maps?.load(() => resolve()); return; }
    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&libraries=services&autoload=false`;
    script.onload = () => window.kakao.maps.load(() => resolve());
    script.onerror = () => reject(new Error("Kakao SDK load failed"));
    document.head.appendChild(script);
  });
  return window.kakao!;
}

/* utils */
const money = (n?: number) => (typeof n === "number" ? n.toLocaleString("ko-KR") + "?? : "ê°€ê²©ë¬¸??);
function labelStatus(s?: string) {
  switch (s) { case "open": return "?ë§¤ì¤?; case "reserved": return "?ˆì•½ì¤?; case "sold": return "ê±°ë˜?„ë£Œ"; default: return s || "ê¸°í?"; }
}
function statusBadgeColor(s?: string) {
  switch (s) { case "open": return "bg-emerald-100 text-emerald-700";
    case "reserved": return "bg-amber-100 text-amber-700";
    case "sold": return "bg-gray-200 text-gray-600"; default: return "bg-slate-100 text-slate-700"; }
}
function haversineKm(a:{lat:number;lng:number}, b:{lat:number;lng:number}) {
  const R=6371, dLat=((b.lat-a.lat)*Math.PI)/180, dLng=((b.lng-a.lng)*Math.PI)/180;
  const lat1=(a.lat*Math.PI)/180, lat2=(b.lat*Math.PI)/180;
  const h=Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2*R*Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
}
const isProd = () => location.hostname !== "localhost" && !location.hostname.startsWith("127.");

const REQUIRE_AUTH = String(import.meta.env.VITE_MARKET_REQUIRE_AUTH || "true").toLowerCase() === "true";
const ADMIN_UIDS = String(import.meta.env.VITE_MARKET_ADMIN_UIDS || "").split(",").map(s=>s.trim()).filter(Boolean);

/* --------------------------------------
  Component
-------------------------------------- */
const MarketPage_UIv5_CreateUpload_Contact: React.FC = () => {
  const storage = useMemo(() => {
    // Storage??ë³„ë„ë¡?ì´ˆê¸°???„ìš”
    return null; // ?„ì‹œë¡?null ë°˜í™˜
  }, []);
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);

  // auth state (for prod/admin mode)
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => onAuthStateChanged(getAuth(), setUser), []);

  // my position
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

  // filters
  const [radiusKm, setRadiusKm] = useState(50);
  const [statusFilter, setStatusFilter] = useState<"all"|"open"|"reserved"|"sold">("all");
  const [textQuery, setTextQuery] = useState("");

  // map toggle & refs
  const [showMap, setShowMap] = useState(false);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoRef = useRef<any | null>(null);

  // detail modal
  const [selected, setSelected] = useState<MarketItem | null>(null);

  // create form state
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [desc, setDesc] = useState("");
  const [phone, setPhone] = useState("");
  const [kakaoId, setKakaoId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // realtime subscribe
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
          price: data.price ?? undefined,
          imageUrl: data.imageUrl ?? undefined,
          status: data.status ?? "open",
          createdAt: data.createdAt ?? null,
          location: data.location ?? null,
          desc: data.desc ?? "",
          phone: data.phone ?? "",
          kakaoId: data.kakaoId ?? "",
          sellerUid: data.sellerUid ?? "",
        });
      });
      setItems(arr);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [db]);

  // filtered list
  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter !== "all") list = list.filter(i => i.status === statusFilter);
    if (textQuery.trim()) {
      const t = textQuery.trim().toLowerCase();
      list = list.filter(i => (i.title||"").toLowerCase().includes(t));
    }
    if (myPos) {
      list = list.filter(i => i.location ? haversineKm(myPos, i.location) <= radiusKm : true);
    }
    return list;
  }, [items, statusFilter, textQuery, myPos, radiusKm]);

  // map render
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
      }
      // clear markers
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];

      const map = mapRef.current;
      const bounds = new kakao.maps.LatLngBounds();

      filtered.forEach((it) => {
        if (!it.location) return;
        const pos = new kakao.maps.LatLng(it.location.lat, it.location.lng);
        const marker = new kakao.maps.Marker({ position: pos });
        marker.setMap(map);
        markersRef.current.push(marker);
        bounds.extend(pos);

        const html = `
          <div style="padding:8px 10px;">
            <div style="font-weight:600;margin-bottom:4px;">${escapeHtml(it.title || "")}</div>
            <div style="font-size:12px;margin-bottom:4px;">${money(it.price)}</div>
            ${it.imageUrl ? `<img src="${escapeAttr(it.imageUrl)}" style="width:180px;height:120px;object-fit:cover;border-radius:8px;" />` : ""}
          </div>`;
        window.kakao.maps.event.addListener(marker, "click", () => {
          infoRef.current?.setContent(html);
          infoRef.current?.open(map, marker);
        });
      });

      if (!bounds.isEmpty()) map.setBounds(bounds, 20, 20, 20, 20);
      else if (myPos) { map.setCenter(new kakao.maps.LatLng(myPos.lat, myPos.lng)); map.setLevel(5); }
    })();
    return () => { canceled = true; };
  }, [showMap, filtered, myPos]);

  // status change
  const updateStatus = async (item: MarketItem, st: "open"|"reserved"|"sold") => {
    await updateDoc(doc(getFirestore(), "marketItems", item.id), { status: st });
  };

  // create item (with Storage)
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);

      // upload image if exists
      let imageUrl: string | undefined = undefined;
      if (file) {
        const path = `market/${Date.now()}_${file.name}`;
        const r = sRef(storage, path);
        await uploadBytes(r, file);
        imageUrl = await getDownloadURL(r);
      }

      const location = myPos ? { lat: myPos.lat, lng: myPos.lng } : null;
      await addDoc(collection(getFirestore(), "marketItems"), {
        title: title.trim() || "?œëª© ?†ìŒ",
        price: typeof price === "number" ? price : null,
        desc: desc.trim() || "",
        phone: phone.trim() || "",
        kakaoId: kakaoId.trim() || "",
        imageUrl: imageUrl || "",
        status: "open",
        createdAt: serverTimestamp(),
        location,
        sellerUid: user?.uid || null,
      });

      // reset
      setTitle(""); setPrice(undefined); setDesc(""); setPhone(""); setKakaoId(""); setFile(null);
      alert("?±ë¡ ?„ë£Œ!");
    } catch (err) {
      console.error(err);
      alert("?±ë¡ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    } finally {
      setSubmitting(false);
    }
  };

  // guard (hybrid): prod + REQUIRE_AUTH=true => only admins
  const mustBeAdmin = isProd() && REQUIRE_AUTH;
  const isAdmin = user && (ADMIN_UIDS.length === 0 || ADMIN_UIDS.includes(user.uid));

  return (
    <div className="mx-auto max-w-4xl p-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold">ì¤‘ê³ ê±°ë˜ ë§ˆì¼“</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowMap(s=>!s)} className="rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm border hover:bg-slate-50">
            {showMap ? "?“¦ ëª©ë¡ë§?ë³´ê¸°" : "?—ºï¸?ì¹´ì¹´?¤ë§µ ë³´ê¸°"}
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
        </div>
      </div>

      {/* Search */}
      <div className="mt-3">
        <input placeholder="?í’ˆëª…ìœ¼ë¡?ê²€?‰â€? value={textQuery} onChange={e=>setTextQuery(e.target.value)}
          className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300" />
      </div>

      {/* Position status */}
      <div className="mt-2 text-xs text-slate-500">
        {myPos ? <span>???„ì¹˜ ê¸°ì? ë°˜ê²½ {radiusKm}km</span> : geoErr ? <span>?„ì¹˜ ë¯¸ì‚¬?? {geoErr}</span> : <span>???„ì¹˜ ?•ì¸ ì¤‘â€?/span>}
      </div>

      {/* Map */}
      {showMap && (
        <div className="mt-4 overflow-hidden rounded-2xl border">
          <div ref={mapDivRef} style={{ width: "100%", height: 360 }} />
        </div>
      )}

      {/* Create Form (Hybrid: dev=always, prod=admins) */}
      <div className="mt-6">
        {mustBeAdmin && !isAdmin ? (
          <div className="rounded-2xl border p-4 text-sm text-slate-600">
            ?´ì˜ ?˜ê²½?ì„œ??ê´€ë¦¬ìë§??í’ˆ???±ë¡?????ˆìŠµ?ˆë‹¤. (ë¡œê·¸???„ìš”)
          </div>
        ) : (
          <form onSubmit={handleCreate} className="rounded-2xl border p-4 grid gap-3">
            <div className="text-sm font-semibold">?“¦ ?í’ˆ ?±ë¡</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="?œëª©" value={title} onChange={e=>setTitle(e.target.value)}
                className="rounded-xl border px-3 py-2 text-sm" required />
              <input placeholder="ê°€ê²?(?«ì)" value={price ?? ""} onChange={e=>setPrice(e.target.value? Number(e.target.value) : undefined)}
                type="number" min={0} className="rounded-xl border px-3 py-2 text-sm" />
            </div>
            <textarea placeholder="?¤ëª…" value={desc} onChange={e=>setDesc(e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm h-24" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="?°ë½ì²??„í™”) ?? 010-1234-5678" value={phone} onChange={e=>setPhone(e.target.value)}
                className="rounded-xl border px-3 py-2 text-sm" />
              <input placeholder="ì¹´ì¹´?¤ID ?ëŠ” ?¤í”ˆì±„íŒ… ??? íƒ)" value={kakaoId} onChange={e=>setKakaoId(e.target.value)}
                className="rounded-xl border px-3 py-2 text-sm" />
            </div>
            <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0] ?? null)} className="text-sm" />
            <button disabled={submitting} className="w-max rounded-xl border px-4 py-2 text-sm bg-slate-900 text-white disabled:opacity-60">
              {submitting ? "?±ë¡ ì¤‘â€? : "?±ë¡?˜ê¸°"}
            </button>
            <div className="text-xs text-slate-500">
              * ?„ì¹˜ ê¶Œí•œ???ˆìš©?˜ë©´ ?„ì¬ ?„ì¹˜ê°€ ?¨ê»˜ ?€?¥ë©?ˆë‹¤. (ê±°ë? ???„ì¹˜ ?†ì´ ?€??
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
                  <img src={it.imageUrl || "https://via.placeholder.com/300x200?text=No+Image"} alt=""
                    className="h-[100px] w-[120px] sm:h-[120px] sm:w-[160px] rounded-xl object-cover" loading="lazy" />
                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="line-clamp-1 text-base font-semibold">{it.title || "?œëª© ?†ìŒ"}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${statusBadgeColor(it.status)}`}>{labelStatus(it.status)}</span>
                      </div>
                      <div className="mt-1 text-sm font-bold">{money(it.price)}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {myPos && it.location ? `???„ì¹˜ë¡œë?????${haversineKm(myPos, it.location).toFixed(1)}km`
                          : it.location?.address || "?„ì¹˜ ?•ë³´ ?†ìŒ"}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {it.phone && (
                        <a href={`tel:${it.phone.replaceAll(/\D/g, "")}`} className="rounded-xl border px-3 py-1 text-xs hover:bg-slate-50"
                           onClick={(e)=>e.stopPropagation()}>?„í™”?˜ê¸°</a>
                      )}
                      {it.kakaoId && (
                        <a href={`https://open.kakao.com/o/${encodeURIComponent(it.kakaoId)}`}
                           target="_blank" rel="noreferrer"
                           className="rounded-xl border px-3 py-1 text-xs hover:bg-slate-50"
                           onClick={(e)=>e.stopPropagation()}>
                          ì¹´ì¹´?¤í†¡
                        </a>
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
          <div className="bg-white rounded-2xl p-5 w-[90%] max-w-md relative" onClick={(e)=>e.stopPropagation()}>
            <button onClick={()=>setSelected(null)} className="absolute top-3 right-3 text-slate-500 hover:text-slate-700">??/button>
            <img src={selected.imageUrl || "https://via.placeholder.com/400x300"} alt=""
                 className="rounded-xl w-full h-[200px] object-cover mb-3" />
            <h2 className="text-lg font-bold mb-1">{selected.title}</h2>
            <p className="text-sm text-slate-600 mb-3">{selected.desc || "?¤ëª… ?†ìŒ"}</p>
            <div className="text-base font-bold mb-3">?’° {money(selected.price)}</div>
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
                <a href={`tel:${selected.phone.replaceAll(/\D/g, "")}`}
                   className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">?“ ?„í™”</a>
              )}
              {selected.kakaoId && (
                <a href={`https://open.kakao.com/o/${encodeURIComponent(selected.kakaoId)}`}
                   target="_blank" rel="noreferrer"
                   className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">?’¬ ì¹´ì¹´?¤í†¡</a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketPage_UIv5_CreateUpload_Contact;

/* XSS-safe for InfoWindow content */
function escapeHtml(s: string) { return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;"); }
function escapeAttr(s: string) { return s.replaceAll('"',"&quot;").replaceAll("'","&#39;"); }
