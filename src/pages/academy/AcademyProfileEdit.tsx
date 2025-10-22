import React, { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Link, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

interface Academy {
  id: string;
  name: string;
  intro: string;
  logoUrl?: string;
  location: string;
  contact: string;
  website: string;
  sns: string;
  // ?�?�자 ?�보 (?�뢰 ?�인??
  ownerName?: string;
  ownerPhoto?: string;
  ownerMessage?: string;
  ownerTitle?: string;
  ownerCredentials?: string[];
  // ?�보 ?�보
  slogan?: string; // ?�보 ?�로�?}

export default function AcademyProfileEdit() {
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAcademy = async () => {
      try {
        const ref = doc(db, "academy", "academy_001");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setAcademy({ id: snap.id, ...snap.data() } as Academy);
        } else {
          // 기본�??�정
          setAcademy({
            id: "academy_001",
            name: "?�흘 축구 ?�카?��?",
            intro: "?�소??축구�??�문?�으�?지?�하???�카?��??�니??",
            logoUrl: "",
            location: "경기 ?�천???�흘 체육공원 A구장",
            contact: "010-1234-5678",
            website: "https://yago-vibe.com/academy",
            sns: "@socheol_fc_official",
            // ?�?�자 ?�보 기본�?            ownerName: "김코치 ?�장",
            ownerPhoto: "",
            ownerMessage: "?�이?�의 ?�장�?꿈을 최우?�으�??�각?�며, 체계?�인 지?��? ?�해 ?�성�??�력???�께 ?�워?��?겠습?�다.",
            ownerTitle: "?�흘 축구 ?�카?��? ?�장",
            ownerCredentials: ["축구지?�자 ?�격�?, "?�소??지??경력 10??],
            // ?�보 ?�보 기본�?            slogan: "???�이?�의 꿈을 ?�우??축구 ?�카?��? ??
          });
        }
      } catch (error) {
        console.error("?�카?��? ?�보 불러?�기 ?�류:", error);
        alert("?�카?��? ?�보�?불러?�는???�패?�습?�다.");
      } finally {
        setLoading(false);
      }
    };
    fetchAcademy();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAcademy((prev: Academy | null) => {
      if (!prev) return null;
      return { ...prev, [name]: value };
    });
  };

  // ?��?지 ?�로??공통 ?�수
  const uploadImage = async (file: File, path: string, fieldName: keyof Academy) => {
    // ?�일 ?�기 체크 (5MB ?�한)
    if (file.size > 5 * 1024 * 1024) {
      alert("???�일 ?�기??5MB ?�하�??�한?�니??");
      return;
    }

    // ?�일 ?�??체크
    if (!file.type.startsWith('image/')) {
      alert("???��?지 ?�일�??�로??가?�합?�다.");
      return;
    }

    setUploading(true);
    try {
      // 고유???�일�??�성
      const fileName = `${path}_${uuidv4()}_${file.name}`;
      const storageRef = ref(storage, `academy/${path}/${fileName}`);
      
      // ?�일 ?�로??      await uploadBytes(storageRef, file);
      
      // ?�운로드 URL 가?�오�?      const downloadURL = await getDownloadURL(storageRef);
      
      // ?�카?��? ?�보 ?�데?�트
      setAcademy((prev: Academy | null) => {
        if (!prev) return null;
        return { ...prev, [fieldName]: downloadURL };
      });
      
      alert(`??${fieldName === 'logoUrl' ? '로고' : '?�?�자 ?�진'}???�로?�되?�습?�다!`);
    } catch (error) {
      console.error("?��?지 ?�로???�류:", error);
      alert("???��?지 ?�로??�??�류가 발생?�습?�다.");
    } finally {
      setUploading(false);
    }
  };

  // 로고 ?�로??  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file, 'logo', 'logoUrl');
  };

  // ?�?�자 ?�진 ?�로??  const handleOwnerPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file, 'owner', 'ownerPhoto');
  };

  const handleSave = async () => {
    if (!academy) return;
    
    setSaving(true);
    try {
      const ref = doc(db, "academy", academy.id);
      await updateDoc(ref, {
        name: academy.name,
        intro: academy.intro,
        logoUrl: academy.logoUrl,
        location: academy.location,
        contact: academy.contact,
        website: academy.website,
        sns: academy.sns,
        // ?�?�자 ?�보
        ownerName: academy.ownerName,
        ownerPhoto: academy.ownerPhoto,
        ownerMessage: academy.ownerMessage,
        ownerTitle: academy.ownerTitle,
        ownerCredentials: academy.ownerCredentials,
        // ?�보 ?�보
        slogan: academy.slogan,
        updatedAt: new Date(),
      });
      
      alert("???�카?��? ?�로?�이 ?�?�되?�습?�다!");
      
      // 2�????�동?�로 ?�로가�?      setTimeout(() => {
        navigate("/academy/courses");
      }, 2000);
    } catch (error) {
      console.error("?�???�류:", error);
      alert("???�??�??�류가 발생?�습?�다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">?�카?��? ?�보�?불러?�는 �?..</p>
        </div>
      </div>
    );
  }

  if (!academy) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">?�카?��? ?�보�?불러?????�습?�다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ?�더 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Link 
                  to="/academy/courses"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  ???�로가�?                </Link>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                  ?�� ?�카?��? ?�로??관�?                </h1>
              </div>
              <p className="text-gray-600 mt-2">
                ?�원??기본 ?�보�??�정?�고 관리할 ???�습?�다.
              </p>
            </div>
            <div className="text-sm text-gray-500">
              마�?�??�데?�트: {academy.updatedAt ? new Date(academy.updatedAt).toLocaleString() : "?�음"}
            </div>
          </div>
        </div>

        {/* ?�로??미리보기 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            ?���?미리보기
          </h2>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <img
                src={academy.logoUrl || "/default-academy.png"}
                alt="?�원 로고"
                className="w-16 h-16 rounded-full object-cover border-2 border-blue-100"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23e5f3ff'/%3E%3Ctext x='32' y='35' text-anchor='middle' font-size='24' fill='%233b82f6'%3E??3C/text%3E%3C/svg%3E";
                }}
              />
              <div>
                <h3 className="font-bold text-lg">{academy.name}</h3>
                <p className="text-gray-600 text-sm">{academy.intro}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ?�집 ??*/}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center">
            ?�️ ?�보 ?�집
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ?�원�?*/}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?�� ?�원�?*
              </label>
              <input
                type="text"
                name="name"
                value={academy.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="?�원명을 ?�력?�세??
                required
              />
            </div>

            {/* ?�치 */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?�� ?�치 *
              </label>
              <input
                type="text"
                name="location"
                value={academy.location}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="?�원 ?�치�??�력?�세??
                required
              />
            </div>

            {/* ?�락�?*/}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?�️ ?�락�?*
              </label>
              <input
                type="text"
                name="contact"
                value={academy.contact}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="?�락처�? ?�력?�세??
                required
              />
            </div>

            {/* ?�페?��? */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?�� ?�페?��?
              </label>
              <input
                type="url"
                name="website"
                value={academy.website}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="https://example.com"
              />
            </div>

            {/* SNS */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?�� SNS 계정
              </label>
              <input
                type="text"
                name="sns"
                value={academy.sns}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="@username"
              />
            </div>

            {/* 로고 ?�로??*/}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">
                ?���??�원 로고
              </label>
              
              {/* ?�재 로고 미리보기 */}
              {academy.logoUrl && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <img
                    src={academy.logoUrl}
                    alt="로고 미리보기"
                    className="w-16 h-16 rounded-lg object-cover border-2 border-blue-200"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23e5f3ff'/%3E%3Ctext x='32' y='40' text-anchor='middle' font-size='24' fill='%233b82f6'%3E??3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">?�재 로고</p>
                    <p className="text-xs text-gray-500 truncate">{academy.logoUrl}</p>
                  </div>
                </div>
              )}
              
              {/* ?�일 ?�로??*/}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">?�로??�?..</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500">
                <p>??권장 ?�기: 200x200px ?�상 (?�사각형)</p>
              </div>
            </div>
          </div>

          {/* ?�개 */}
          <div className="mt-6 space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              ?�� ?�원 ?�개 *
            </label>
            <textarea
              name="intro"
              value={academy.intro}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="?�원???�???�개�??�력?�세??
              required
            />
          </div>
        </div>

        {/* ?�?�자 ?�보 ?�션 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-6 flex items-center">
            ?��?��??�?�자 ?�보 (?�뢰 ?�인??
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ?�?�자 ?�름 */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?�� ?�?�자 ?�름
              </label>
              <input
                type="text"
                name="ownerName"
                value={academy.ownerName || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="김코치 ?�장"
              />
            </div>

            {/* 직책 */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?���?직책/?�칭
              </label>
              <input
                type="text"
                name="ownerTitle"
                value={academy.ownerTitle || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="?�흘 축구 ?�카?��? ?�장"
              />
            </div>

            {/* ?�?�자 ?�진 ?�로??*/}
            <div className="space-y-4 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?�� ?�?�자 ?�진
              </label>
              
              {/* ?�재 ?�진 미리보기 */}
              {academy.ownerPhoto && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <img
                    src={academy.ownerPhoto}
                    alt="?�?�자 ?�진 미리보기"
                    className="w-20 h-20 rounded-full object-cover border-2 border-blue-200"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23e5f3ff'/%3E%3Ctext x='40' y='45' text-anchor='middle' font-size='24' fill='%233b82f6'%3E?��?��?3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">?�재 ?�?�자 ?�진</p>
                    <p className="text-xs text-gray-500 truncate">{academy.ownerPhoto}</p>
                  </div>
                </div>
              )}
              
              {/* ?�일 ?�로??*/}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleOwnerPhotoUpload}
                  disabled={uploading}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">?�로??�?..</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>???��?지 ?�일�??�로??가??(JPG, PNG, GIF ??</p>
                <p>???�일 ?�기: 최�? 5MB</p>
                <p>??권장 ?�기: 400x400px ?�상 (?�사각형)</p>
              </div>
            </div>

            {/* ?�?�자 ?�사�?*/}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?�� ?�?�자 ?�사�?              </label>
              <textarea
                name="ownerMessage"
                value={academy.ownerMessage || ""}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="?��?모�? ?�생?�에�??�하�??��? ?�사말을 ?�력?�세??
              />
            </div>

            {/* ?�격/경력 ?�보 */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?�� ?�격/경력 ?�보 (?�표�?구분)
              </label>
              <input
                type="text"
                value={academy.ownerCredentials ? academy.ownerCredentials.join(", ") : ""}
                onChange={(e) => {
                  const credentials = e.target.value.split(",").map(c => c.trim()).filter(c => c);
                  setAcademy((prev: Academy | null) => {
                    if (!prev) return null;
                    return { ...prev, ownerCredentials: credentials };
                  });
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="축구지?�자 ?�격�? ?�소??지??경력 10?? ?�???�상 경력"
              />
              <p className="text-xs text-gray-500">
                ?? 축구지?�자 ?�격�? ?�소??지??경력 10?? ?�???�상 경력
              </p>
            </div>

            {/* ?�보 ?�로�?*/}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?�� ?�보 ?�로�?              </label>
              <input
                type="text"
                value={academy.slogan || ""}
                onChange={(e) => handleChange('slogan', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="???�이?�의 꿈을 ?�우??축구 ?�카?��? ??
              />
              <p className="text-xs text-gray-500">
                ?�?�보???�단??강조 ?�시?�는 ?�보 문구?�니??
              </p>
            </div>
          </div>
        </div>

        {/* ?�집 ??계속 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">

          {/* ?�??버튼 */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || !academy.name || !academy.intro || !academy.location || !academy.contact}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ?�??�?..
                </>
              ) : (
                <>
                  ?�� ?�?�하�?                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
