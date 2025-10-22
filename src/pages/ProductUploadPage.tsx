import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { getAuth } from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

export default function ProductUploadPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const storage = getStorage();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [category, setCategory] = useState("ê¸°í?");
  const [locationText, setLocationText] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationAdmin, setLocationAdmin] = useState("");

  // Google Maps API ??(?˜ê²½ë³€?˜ì—??ê°€?¸ì˜¤ê¸?
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

  // ì£¼ì†Œ ??ì¢Œí‘œ + ?‰ì •??ë³€???¨ìˆ˜
  const getLocationData = async (address: string): Promise<{ adminDistrict: string; coordinates: { lat: number; lng: number } | null }> => {
    if (!GOOGLE_API_KEY) {
      console.warn("Google Maps API ?¤ê? ?¤ì •?˜ì? ?Šì•˜?µë‹ˆ??");
      return { adminDistrict: address, coordinates: null };
    }

    try {
      const url = `/gapi/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_API_KEY}&language=ko`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];
        const components = result.address_components;

        // ì¢Œí‘œ ì¶”ì¶œ
        const coordinates = {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        };

        // ?‰ì •????ë©??? êµ?êµ? ???? ì¶”ì¶œ
        const district = components.find((c: any) =>
          c.types.includes("sublocality_level_1") || 
          c.types.includes("sublocality_level_2") ||
          c.types.includes("sublocality_level_3")
        )?.long_name;

        const city = components.find((c: any) =>
          c.types.includes("locality") ||
          c.types.includes("administrative_area_level_2")
        )?.long_name;

        const province = components.find((c: any) =>
          c.types.includes("administrative_area_level_1")
        )?.long_name;

        // ìµœì¢… ?œê¸° (?? "ê²½ê¸°???¬ì²œ???Œí˜??)
        const adminDistrict = `${province || ""} ${city || ""} ${district || ""}`.trim();
        
        console.log("ì£¼ì†Œ ë³€??ê²°ê³¼:", {
          ?ë³¸: address,
          ë³€?? adminDistrict,
          ì¢Œí‘œ: coordinates,
          components: { province, city, district }
        });

        return {
          adminDistrict: adminDistrict || address,
          coordinates
        };
      } else {
        console.warn("Geocoding API ?‘ë‹µ ?¤ë¥˜:", data.status);
        return { adminDistrict: address, coordinates: null };
      }
    } catch (error) {
      console.error("ì£¼ì†Œ ë³€???¤íŒ¨:", error);
      return { adminDistrict: address, coordinates: null };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??");
      return;
    }

    setLoading(true);

    try {
      // 1. ì£¼ì†Œ ??ì¢Œí‘œ + ?‰ì •??ë³€??      const locationData = await getLocationData(locationText);
      setLocationAdmin(locationData.adminDistrict);

      // 2. ?´ë?ì§€ ?…ë¡œ??      let imageUrls: string[] = [];
      if (images) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const storageRef = ref(storage, `products/${currentUser.uid}/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          imageUrls.push(url);
        }
      }

      // 3. Firestore???í’ˆ ë¬¸ì„œ ì¶”ê?
      await addDoc(collection(db, "products"), {
        title,
        description,
        price: Number(price),
        category,
        locationText, // ???¬ìš©?ê? ?…ë ¥???ì„¸ ì£¼ì†Œ
        locationAdmin: locationData.adminDistrict, // ??ë³€?˜ëœ ?‰ì •???¨ìœ„ ì£¼ì†Œ
        lat: locationData.coordinates?.lat || null, // ???„ë„ (GeoQuery??
        lng: locationData.coordinates?.lng || null, // ??ê²½ë„ (GeoQuery??
        images: imageUrls,
        status: "ë¶„ì„ì¤?, // ??AI ë¶„ì„ ?€ê¸??íƒœ
        sellerId: currentUser.uid,
        sellerName: currentUser.displayName || "?µëª…",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("?í’ˆ???±ë¡?˜ì—ˆ?µë‹ˆ????);
      navigate("/market");

    } catch (err) {
      console.error(err);
      alert("?í’ˆ ?±ë¡ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow p-6 mt-6 rounded-lg">
      <h1 className="text-xl font-bold mb-4">?í’ˆ ?±ë¡</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ?í’ˆëª?*/}
        <input
          type="text"
          placeholder="?í’ˆëª?
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border rounded-md px-3 py-2 w-full"
          required
        />

        {/* ?¤ëª… */}
        <textarea
          placeholder="?í’ˆ ?¤ëª…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border rounded-md px-3 py-2 w-full h-24"
          required
        />

        {/* ê°€ê²?*/}
        <input
          type="number"
          placeholder="ê°€ê²?
          value={price}
          onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
          className="border rounded-md px-3 py-2 w-full"
          required
        />

        {/* ì¹´í…Œê³ ë¦¬ */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded-md px-3 py-2 w-full"
        >
          <option value="ì¶•êµ¬??>ì¶•êµ¬??/option>
          <option value="? ë‹ˆ??>? ë‹ˆ??/option>
          <option value="ê³?>ê³?/option>
          <option value="ê¸°í?">ê¸°í?</option>
        </select>

        {/* ?„ì¹˜ */}
        <div>
          <input
            type="text"
            placeholder="ê±°ë˜ ?„ì¹˜ (?? ?Œí˜ ì²´ìœ¡ê³µì›)"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            className="border rounded-md px-3 py-2 w-full"
            required
          />
          {locationAdmin && (
            <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
              ?“ ë³€?˜ëœ ì£¼ì†Œ: {locationAdmin}
            </div>
          )}
        </div>

        {/* ?´ë?ì§€ ?…ë¡œ??*/}
        <input
          type="file"
          multiple
          onChange={(e) => setImages(e.target.files)}
          className="w-full"
        />

        {/* ?±ë¡ ë²„íŠ¼ */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "?±ë¡ ì¤?.." : "?±ë¡?˜ê¸°"}
        </button>
      </form>
    </div>
  );
}
