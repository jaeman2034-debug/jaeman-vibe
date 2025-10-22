import React, { useState, useEffect, useRef } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../../lib/firebase";

declare global {
  interface Window {
    kakao: any;
  }
}

export default function MarketPage_UIv2_Final() {
  const db = getFirestore(app);
  const storage = getStorage(app);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // ?ÅÌíà Î∂àÎü¨?§Í∏∞
  const fetchProducts = async () => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
    setProducts(list);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Ïπ¥Ïπ¥?§Îßµ SDK Î°úÎìú
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${
      import.meta.env.VITE_KAKAO_MAP_KEY
    }&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        console.log("[Ïπ¥Ïπ¥?§Îßµ] SDK Î°úÎìú ?±Í≥µ");
        getUserLocation();
      });
    };
    document.head.appendChild(script);
  }, []);

  // ?¨Ïö©???ÑÏπò Í∞Ä?∏Ïò§Í∏?  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn("?ÑÏπò ?ïÎ≥¥ ?ëÍ∑º Í±∞Î???", err);
          setUserLocation({ lat: 37.5665, lng: 126.978 }); // ?úÏö∏ Ï§ëÏã¨ Ï¢åÌëú Í∏∞Î≥∏Í∞?        }
      );
    }
  };

  // ÏßÄ???åÎçîÎß?  useEffect(() => {
    if (viewMode !== "map" || !userLocation || !mapRef.current || !window.kakao?.maps) return;
    
    const map = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng),
      level: 5,
    });

    // ???ÑÏπò ??    new window.kakao.maps.Circle({
      center: new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng),
      radius: 3000,
      strokeWeight: 2,
      strokeColor: "#FF7E36",
      strokeOpacity: 0.8,
      fillColor: "#FF7E36",
      fillOpacity: 0.1,
      map,
    });

    // ?ÅÌíà ÎßàÏª§
    products.forEach((p) => {
      if (p.location) {
        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(p.location.lat, p.location.lng),
          map,
        });

        const iwContent = `
          <div style="padding:8px; width:200px;">
            <b>${p.title}</b><br/>
            ${p.price?.toLocaleString()}??br/>
            <small>${p.description}</small>
          </div>`;
        const infowindow = new window.kakao.maps.InfoWindow({ content: iwContent });

        window.kakao.maps.event.addListener(marker, "click", function () {
          infowindow.open(map, marker);
        });
      }
    });
  }, [viewMode, userLocation, products]);

  // ?ÅÌíà ?±Î°ù
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = "";
      if (image) {
        const imageRef = ref(storage, `market/${Date.now()}_${image.name}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }
      await addDoc(collection(db, "products"), {
        title,
        price: Number(price),
        description,
        imageUrl,
        location: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null,
        createdAt: serverTimestamp(),
        status: "?êÎß§Ï§?,
      });
      setTitle("");
      setPrice("");
      setDescription("");
      setImage(null);
      await fetchProducts();
      alert("???ÅÌíà???±Î°ù?òÏóà?µÎãà??");
    } catch (err) {
      console.error(err);
      alert("?±Î°ù Ï§??§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.");
    } finally {
      setLoading(false);
    }
  };

  // Í≤Ä???ÑÌÑ∞
  const filtered = products.filter(
    (p) =>
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#FFF8F0] min-h-screen font-sans pb-10">
      {/* ?§Îçî */}
      <header className="bg-white p-4 shadow flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-[#FF7E36]">YAGO ÎßàÏºì ?õí</h1>
        <span className="text-sm text-gray-500">?ìç ??Ï£ºÎ? Ï§ëÍ≥† Í±∞Îûò</span>
      </header>

      {/* ?ÅÌíà ?±Î°ù */}
      <main className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
        <section className="bg-white rounded-2xl shadow p-5">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">?ì¶ ?ÅÌíà ?±Î°ù</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="?ÅÌíàÎ™?
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-[#FF7E36]"
            />
            <input
              type="number"
              placeholder="Í∞ÄÍ≤?(??"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-[#FF7E36]"
            />
            <textarea
              placeholder="?ÅÌíà ?§Î™Ö"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-[#FF7E36]"
              rows={3}
            />
            <input
              type="file"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF7E36] text-white py-3 rounded-lg font-semibold hover:bg-[#ff6716] active:scale-95"
            >
              {loading ? "?±Î°ù Ï§?.." : "?î• ?ÅÌíà ?±Î°ù?òÍ∏∞"}
            </button>
          </form>
        </section>

        {/* Í≤Ä??*/}
        <section>
          <input
            type="text"
            placeholder="?îç ?ÅÌíàÎ™? ?§Î™Ö?ºÎ°ú Í≤Ä??.."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-[#FF7E36]"
          />
        </section>

        {/* ?ÅÌíà Î™©Î°ù / ÏßÄ??*/}
        {viewMode === "list" ? (
          <section className="bg-white rounded-2xl shadow p-5">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              ?ß∫ ?ÅÌíà Î™©Î°ù ({filtered.length}Í∞?
            </h2>
            <div className="space-y-4">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center bg-white border rounded-xl shadow-sm hover:shadow-md transition p-3 active:scale-[0.995]"
                >
                  {/* Ï¢åÏ∏° ?¥Î?ÏßÄ */}
                  <div className="w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        ?¥Î?ÏßÄ ?ÜÏùå
                      </div>
                    )}
                  </div>

                  {/* ?∞Ï∏° ?ïÎ≥¥ */}
                  <div className="flex flex-col justify-between ml-4 flex-1">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800 truncate">
                        {item.title}
                      </h3>
                      <p className="text-[#FF7E36] font-bold text-lg mt-1">
                        {item.price?.toLocaleString()} ??                      </p>
                      <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          item.status === "?êÎß§Ï§?
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {item.status}
                      </span>
                      <button className="text-xs text-[#FF7E36] font-medium hover:underline">
                        Ï±ÑÌåÖ?òÍ∏∞ ?í¨
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  ?±Î°ù???ÅÌíà???ÜÏäµ?àÎã§ ?ò¢
                </p>
              )}
            </div>
          </section>
        ) : (
          <section className="bg-white rounded-2xl shadow p-5">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              ?ó∫Ô∏???Ï£ºÎ? ?ÅÌíà ÏßÄ??            </h2>
            <div ref={mapRef} className="w-full h-[500px] rounded-xl bg-gray-200"></div>
          </section>
        )}
      </main>

      {/* ?åÎ°ú???ÑÌôò Î≤ÑÌäº (?πÍ∑ºÎßàÏºì ?§Ì??? */}
      <button
        onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
        className="fixed bottom-6 right-6 bg-[#FF7E36] text-white rounded-full shadow-xl p-4 z-50 hover:bg-[#ff6716] transition-colors active:scale-95"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        aria-label={viewMode === "list" ? "ÏßÄ??Î≥¥Í∏∞" : "Î¶¨Ïä§??Î≥¥Í∏∞"}
      >
        {viewMode === "list" ? (
          <span className="text-2xl">?ó∫Ô∏?/span>
        ) : (
          <span className="text-2xl">?ìã</span>
        )}
      </button>
    </div>
  );
}
