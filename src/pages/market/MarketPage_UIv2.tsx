import React, { useState, useEffect, useRef } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../../lib/firebase";
import ChatRoom from "./ChatRoom";
import ReviewModal from "./ReviewModal";
import BottomTabNav from "../../components/BottomTabNav";
import FAB from "../../components/FAB";
import { CardSkeleton } from "../../components/Skeleton";

declare global {
  interface Window {
    kakao: any;
  }
}

export default function MarketPage_UIv2() {
  const db = getFirestore(app);
  const storage = getStorage(app);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeChat, setActiveChat] = useState<{ id: string; target: string } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const currentUser = "user_jaeman"; // ?„ì‹œ ë¡œê·¸??? ì? ?„ì´??(?˜ì¤‘??Firebase Auth ?°ë™)

  // ??ì¹´ì¹´?¤ë§µ SDK ë¡œë“œ
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${
      import.meta.env.VITE_KAKAO_MAP_KEY
    }&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        console.log("[ì¹´ì¹´?¤ë§µ] SDK ë¡œë“œ ?±ê³µ");
        getUserLocation();
      });
    };
    document.head.appendChild(script);
  }, []);

  // ???¬ìš©???„ì¹˜ ê°€?¸ì˜¤ê¸?  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn("?„ì¹˜ ?•ë³´ ?‘ê·¼ ê±°ë???", err);
          setUserLocation({ lat: 37.5665, lng: 126.978 }); // ?œìš¸ ì¤‘ì‹¬ ì¢Œí‘œ ê¸°ë³¸ê°?        }
      );
    }
  };

  // ???í’ˆ ?±ë¡
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = "";
      if (image) {
        const storageRef = ref(storage, `products/${Date.now()}_${image.name}`);
        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);
      }

      let locationData = userLocation
        ? { lat: userLocation.lat, lng: userLocation.lng }
        : null;

      await addDoc(collection(db, "products"), {
        title,
        price: Number(price),
        description,
        imageUrl,
        location: locationData,
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setPrice("");
      setDescription("");
      setImage(null);
      fetchProducts();
    } catch (err) {
      console.error("?±ë¡ ?¤ë¥˜:", err);
    } finally {
      setLoading(false);
    }
  };

  // ???í’ˆ ë¶ˆëŸ¬?¤ê¸°
  const fetchProducts = async () => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
    setProducts(list);
    setInitialLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ??ì§€???Œë”ë§?  useEffect(() => {
    if (!userLocation || !mapRef.current || !window.kakao?.maps) return;
    const map = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng),
      level: 5,
    });

    // ???„ì¹˜ ??    new window.kakao.maps.Circle({
      center: new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng),
      radius: 3000,
      strokeWeight: 2,
      strokeColor: "#FF7E36",
      strokeOpacity: 0.8,
      fillColor: "#FF7E36",
      fillOpacity: 0.1,
      map,
    });

    // ?í’ˆ ë§ˆì»¤
    products.forEach((p) => {
      if (p.location) {
        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(p.location.lat, p.location.lng),
          map,
        });

        const iwContent = `
          <div style="padding:8px;">
            <b>${p.title}</b><br/>
            ${p.price?.toLocaleString()}??          </div>`;
        const infowindow = new window.kakao.maps.InfoWindow({ content: iwContent });

        window.kakao.maps.event.addListener(marker, "click", function () {
          infowindow.open(map, marker);
        });
      }
    });
  }, [userLocation, products]);

  // ??ê²€???„í„°
  const filtered = products.filter((item) => {
    const t = (item.title || "").toLowerCase();
    const d = (item.description || "").toLowerCase();
    return t.includes(search.toLowerCase()) || d.includes(search.toLowerCase());
  });

  return (
    <div className="bg-[#FFF8F0] min-h-screen font-sans pb-20">
      <header className="bg-white shadow p-4 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#FF7E36]">YAGO ë§ˆì¼“</h1>
        <span className="text-sm text-gray-500">?“ ??ì£¼ë? ì¤‘ê³  ê±°ë˜</span>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-6">
        {/* ?í’ˆ ?±ë¡ */}
        <section className="bg-white rounded-2xl p-4 shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">?“¦ ?í’ˆ ?±ë¡</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="?í’ˆëª?
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border rounded-lg p-3 text-base focus:ring-2 focus:ring-[#FF7E36]"
              inputMode="text"
            />
            <input
              type="number"
              placeholder="ê°€ê²?(??"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full border rounded-lg p-3 text-base focus:ring-2 focus:ring-[#FF7E36]"
              inputMode="numeric"
            />
            <textarea
              placeholder="?í’ˆ ?¤ëª…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg p-3 text-base focus:ring-2 focus:ring-[#FF7E36]"
              rows={3}
            />
            <input
              type="file"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full text-base"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF7E36] text-white py-3 rounded-lg font-semibold hover:bg-[#ff6716] active:scale-95"
              aria-label="?í’ˆ ?±ë¡"
            >
              {loading ? "?±ë¡ ì¤?.." : "?”¥ ?í’ˆ ?±ë¡?˜ê¸°"}
            </button>
          </form>
        </section>

        {/* ê²€??*/}
        <div className="flex items-center bg-white rounded-full px-4 py-2 shadow">
          <span className="text-gray-400 mr-2">?”</span>
          <input
            type="text"
            placeholder="?í’ˆëª? ?¤ëª…?¼ë¡œ ê²€??.."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-gray-700"
          />
        </div>

        {/* ?í’ˆ ëª©ë¡ */}
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            ?í’ˆ ëª©ë¡ ({filtered.length}ê°?
          </h2>

          {!initialLoading && filtered.length === 0 && (
            <p className="text-gray-500 text-center bg-white p-4 rounded-xl shadow">
              ?±ë¡???í’ˆ???†ìŠµ?ˆë‹¤ ?˜¢
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 select-none">
            {initialLoading &&
              Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
            {!initialLoading &&
              filtered.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow hover:shadow-md transition p-3 cursor-pointer active:scale-[0.995]"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full aspect-square object-cover rounded-xl mb-2"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                      ?´ë?ì§€ ?†ìŒ
                    </div>
                  )}

                <h3 className="font-semibold text-gray-800 text-lg truncate">
                  {item.title}
                </h3>
                <p className="text-[#FF7E36] font-bold text-lg">
                  {item.price?.toLocaleString()} ??                </p>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {item.description}
                </p>

                {/* ê±°ë˜ ?íƒœ ?œì‹œ */}
                <p
                  className={`text-sm font-medium mt-2 ${
                    item.status === "done"
                      ? "text-green-600"
                      : item.status === "pending"
                      ? "text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  {item.status === "done"
                    ? "??ê±°ë˜?„ë£Œ"
                    : item.status === "pending"
                    ? "?•“ ê±°ë˜ì¤?
                    : "?“¦ ?ë§¤ì¤?}
                </p>

                <div className="flex gap-2 mt-2">
                  {item.status !== "done" ? (
                    <>
                      <button
                        onClick={async () => {
                          await updateDoc(doc(db, "products", item.id), { status: "done" });
                          fetchProducts();
                        }}
                        className="flex-1 border border-green-500 text-green-600 py-1 rounded-lg text-sm hover:bg-green-50"
                      >
                        ê±°ë˜ ?„ë£Œ
                      </button>
                      <button
                        onClick={() => setActiveChat({ id: item.id, target: item.title })}
                        className="flex-1 border border-[#FF7E36] text-[#FF7E36] rounded-lg py-1 text-sm hover:bg-[#FFF3EC]"
                      >
                        ?’¬ ì±„íŒ…?˜ê¸°
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setSelectedProduct(item.id)}
                      className="w-full border border-[#FF7E36] text-[#FF7E36] py-1 rounded-lg text-sm hover:bg-[#FFF3EC]"
                    >
                      â­?ë¦¬ë·° ?‘ì„±
                    </button>
                  )}
                </div>

                {/* ë¦¬ë·° ?œì‹œ */}
                {item.reviews && item.reviews.length > 0 && (
                  <div className="mt-2 bg-gray-50 p-2 rounded-lg text-sm">
                    <p className="font-semibold mb-1">â­?ë¦¬ë·° ({item.reviews.length})</p>
                    {item.reviews.map((r: any, i: number) => (
                      <div key={i} className="text-gray-600">
                        {"â­?.repeat(r.rating)} ??{r.comment}
                      </div>
                    ))}
                  </div>
                )}
                </div>
              ))}
          </div>
        </section>

        {/* ì§€??*/}
        <section className="pb-2">
          <h2 className="text-lg font-semibold text-gray-700 mt-4 mb-2">?—ºï¸???ì£¼ë? ?í’ˆ ì§€??/h2>
          <div ref={mapRef} className="w-full h-[360px] rounded-2xl shadow bg-gray-200"></div>
        </section>
      </main>

      {/* ì±„íŒ…ì°??œì‹œ */}
      {activeChat && (
        <ChatRoom
          chatId={activeChat.id}
          currentUser={currentUser}
          targetUser={activeChat.target}
          onClose={() => setActiveChat(null)}
        />
      )}

      {/* ë¦¬ë·° ëª¨ë‹¬ */}
      {selectedProduct && (
        <ReviewModal
          productId={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <FAB onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
      <BottomTabNav />
    </div>
  );
}
