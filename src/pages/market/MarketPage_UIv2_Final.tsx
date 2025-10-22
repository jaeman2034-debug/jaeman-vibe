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

  // ?�품 불러?�기
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

  // 카카?�맵 SDK 로드
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${
      import.meta.env.VITE_KAKAO_MAP_KEY
    }&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        console.log("[카카?�맵] SDK 로드 ?�공");
        getUserLocation();
      });
    };
    document.head.appendChild(script);
  }, []);

  // ?�용???�치 가?�오�?  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn("?�치 ?�보 ?�근 거�???", err);
          setUserLocation({ lat: 37.5665, lng: 126.978 }); // ?�울 중심 좌표 기본�?        }
      );
    }
  };

  // 지???�더�?  useEffect(() => {
    if (viewMode !== "map" || !userLocation || !mapRef.current || !window.kakao?.maps) return;
    
    const map = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng),
      level: 5,
    });

    // ???�치 ??    new window.kakao.maps.Circle({
      center: new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng),
      radius: 3000,
      strokeWeight: 2,
      strokeColor: "#FF7E36",
      strokeOpacity: 0.8,
      fillColor: "#FF7E36",
      fillOpacity: 0.1,
      map,
    });

    // ?�품 마커
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

  // ?�품 ?�록
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
        status: "?�매�?,
      });
      setTitle("");
      setPrice("");
      setDescription("");
      setImage(null);
      await fetchProducts();
      alert("???�품???�록?�었?�니??");
    } catch (err) {
      console.error(err);
      alert("?�록 �??�류가 발생?�습?�다.");
    } finally {
      setLoading(false);
    }
  };

  // 검???�터
  const filtered = products.filter(
    (p) =>
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#FFF8F0] min-h-screen font-sans pb-10">
      {/* ?�더 */}
      <header className="bg-white p-4 shadow flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-[#FF7E36]">YAGO 마켓 ?��</h1>
        <span className="text-sm text-gray-500">?�� ??주�? 중고 거래</span>
      </header>

      {/* ?�품 ?�록 */}
      <main className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
        <section className="bg-white rounded-2xl shadow p-5">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">?�� ?�품 ?�록</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="?�품�?
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-[#FF7E36]"
            />
            <input
              type="number"
              placeholder="가�?(??"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-[#FF7E36]"
            />
            <textarea
              placeholder="?�품 ?�명"
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
              {loading ? "?�록 �?.." : "?�� ?�품 ?�록?�기"}
            </button>
          </form>
        </section>

        {/* 검??*/}
        <section>
          <input
            type="text"
            placeholder="?�� ?�품�? ?�명?�로 검??.."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-[#FF7E36]"
          />
        </section>

        {/* ?�품 목록 / 지??*/}
        {viewMode === "list" ? (
          <section className="bg-white rounded-2xl shadow p-5">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              ?�� ?�품 목록 ({filtered.length}�?
            </h2>
            <div className="space-y-4">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center bg-white border rounded-xl shadow-sm hover:shadow-md transition p-3 active:scale-[0.995]"
                >
                  {/* 좌측 ?��?지 */}
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
                        ?��?지 ?�음
                      </div>
                    )}
                  </div>

                  {/* ?�측 ?�보 */}
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
                          item.status === "?�매�?
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {item.status}
                      </span>
                      <button className="text-xs text-[#FF7E36] font-medium hover:underline">
                        채팅?�기 ?��
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  ?�록???�품???�습?�다 ?��
                </p>
              )}
            </div>
          </section>
        ) : (
          <section className="bg-white rounded-2xl shadow p-5">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              ?���???주�? ?�품 지??            </h2>
            <div ref={mapRef} className="w-full h-[500px] rounded-xl bg-gray-200"></div>
          </section>
        )}
      </main>

      {/* ?�로???�환 버튼 (?�근마켓 ?��??? */}
      <button
        onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
        className="fixed bottom-6 right-6 bg-[#FF7E36] text-white rounded-full shadow-xl p-4 z-50 hover:bg-[#ff6716] transition-colors active:scale-95"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        aria-label={viewMode === "list" ? "지??보기" : "리스??보기"}
      >
        {viewMode === "list" ? (
          <span className="text-2xl">?���?/span>
        ) : (
          <span className="text-2xl">?��</span>
        )}
      </button>
    </div>
  );
}
