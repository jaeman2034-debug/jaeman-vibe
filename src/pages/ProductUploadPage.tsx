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
  const [category, setCategory] = useState("기�?");
  const [locationText, setLocationText] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationAdmin, setLocationAdmin] = useState("");

  // Google Maps API ??(?�경변?�에??가?�오�?
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

  // 주소 ??좌표 + ?�정??변???�수
  const getLocationData = async (address: string): Promise<{ adminDistrict: string; coordinates: { lat: number; lng: number } | null }> => {
    if (!GOOGLE_API_KEY) {
      console.warn("Google Maps API ?��? ?�정?��? ?�았?�니??");
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

        // 좌표 추출
        const coordinates = {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        };

        // ?�정????�??? �?�? ???? 추출
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

        // 최종 ?�기 (?? "경기???�천???�흘??)
        const adminDistrict = `${province || ""} ${city || ""} ${district || ""}`.trim();
        
        console.log("주소 변??결과:", {
          ?�본: address,
          변?? adminDistrict,
          좌표: coordinates,
          components: { province, city, district }
        });

        return {
          adminDistrict: adminDistrict || address,
          coordinates
        };
      } else {
        console.warn("Geocoding API ?�답 ?�류:", data.status);
        return { adminDistrict: address, coordinates: null };
      }
    } catch (error) {
      console.error("주소 변???�패:", error);
      return { adminDistrict: address, coordinates: null };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("로그?�이 ?�요?�니??");
      return;
    }

    setLoading(true);

    try {
      // 1. 주소 ??좌표 + ?�정??변??      const locationData = await getLocationData(locationText);
      setLocationAdmin(locationData.adminDistrict);

      // 2. ?��?지 ?�로??      let imageUrls: string[] = [];
      if (images) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const storageRef = ref(storage, `products/${currentUser.uid}/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          imageUrls.push(url);
        }
      }

      // 3. Firestore???�품 문서 추�?
      await addDoc(collection(db, "products"), {
        title,
        description,
        price: Number(price),
        category,
        locationText, // ???�용?��? ?�력???�세 주소
        locationAdmin: locationData.adminDistrict, // ??변?�된 ?�정???�위 주소
        lat: locationData.coordinates?.lat || null, // ???�도 (GeoQuery??
        lng: locationData.coordinates?.lng || null, // ??경도 (GeoQuery??
        images: imageUrls,
        status: "분석�?, // ??AI 분석 ?��??�태
        sellerId: currentUser.uid,
        sellerName: currentUser.displayName || "?�명",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("?�품???�록?�었?�니????);
      navigate("/market");

    } catch (err) {
      console.error(err);
      alert("?�품 ?�록 �??�류가 발생?�습?�다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow p-6 mt-6 rounded-lg">
      <h1 className="text-xl font-bold mb-4">?�품 ?�록</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ?�품�?*/}
        <input
          type="text"
          placeholder="?�품�?
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border rounded-md px-3 py-2 w-full"
          required
        />

        {/* ?�명 */}
        <textarea
          placeholder="?�품 ?�명"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border rounded-md px-3 py-2 w-full h-24"
          required
        />

        {/* 가�?*/}
        <input
          type="number"
          placeholder="가�?
          value={price}
          onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
          className="border rounded-md px-3 py-2 w-full"
          required
        />

        {/* 카테고리 */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded-md px-3 py-2 w-full"
        >
          <option value="축구??>축구??/option>
          <option value="?�니??>?�니??/option>
          <option value="�?>�?/option>
          <option value="기�?">기�?</option>
        </select>

        {/* ?�치 */}
        <div>
          <input
            type="text"
            placeholder="거래 ?�치 (?? ?�흘 체육공원)"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            className="border rounded-md px-3 py-2 w-full"
            required
          />
          {locationAdmin && (
            <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
              ?�� 변?�된 주소: {locationAdmin}
            </div>
          )}
        </div>

        {/* ?��?지 ?�로??*/}
        <input
          type="file"
          multiple
          onChange={(e) => setImages(e.target.files)}
          className="w-full"
        />

        {/* ?�록 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "?�록 �?.." : "?�록?�기"}
        </button>
      </form>
    </div>
  );
}
