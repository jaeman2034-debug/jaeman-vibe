import React, { useState } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Link, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

interface AcademyForm {
  name: string;
  intro: string;
  location: string;
  contact: string;
  website: string;
  sns: string;
  ownerName: string;
  ownerMessage: string;
  ownerTitle: string;
  slogan: string;
  ownerCredentials: string[];
}

export default function AcademyNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [ownerPhotoFile, setOwnerPhotoFile] = useState<File | null>(null);
  
  const [academy, setAcademy] = useState<AcademyForm>({
    name: "",
    intro: "",
    location: "",
    contact: "",
    website: "",
    sns: "",
    ownerName: "",
    ownerMessage: "",
    ownerTitle: "",
    slogan: "",
    ownerCredentials: []
  });

  const handleChange = (field: keyof AcademyForm, value: string) => {
    setAcademy(prev => ({ ...prev, [field]: value }));
  };

  const handleCredentialsChange = (value: string) => {
    const credentials = value.split(",").map(c => c.trim()).filter(c => c);
    setAcademy(prev => ({ ...prev, ownerCredentials: credentials }));
  };

  // ?��?지 ?�로??공통 ?�수
  const uploadImage = async (file: File, path: string): Promise<string> => {
    // ?�일 ?�기 체크 (5MB ?�한)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("?�일 ?�기??5MB ?�하�??�한?�니??");
    }

    // ?�일 ?�??체크
    if (!file.type.startsWith('image/')) {
      throw new Error("?��?지 ?�일�??�로??가?�합?�다.");
    }

    // 고유???�일�??�성
    const fileName = `${path}_${uuidv4()}_${file.name}`;
    const storageRef = ref(storage, `academy/${path}/${fileName}`);
    
    // ?�일 ?�로??    await uploadBytes(storageRef, file);
    
    // ?�운로드 URL 가?�오�?    return await getDownloadURL(storageRef);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
  };

  const handleOwnerPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOwnerPhotoFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!academy.name) return alert("?�카?��?명을 ?�력?�세??);
    if (!academy.ownerName) return alert("?�?�자명을 ?�력?�세??);
    if (!academy.location) return alert("?�치�??�력?�세??);
    if (!academy.contact) return alert("?�락처�? ?�력?�세??);

    setLoading(true);
    try {
      let logoUrl = "";
      let ownerPhotoUrl = "";

      // ?��?지 ?�로??      if (logoFile) {
        logoUrl = await uploadImage(logoFile, 'logo');
      }
      if (ownerPhotoFile) {
        ownerPhotoUrl = await uploadImage(ownerPhotoFile, 'owner');
      }

      // Firestore???�카?��? 문서 ?�성
      const docRef = await addDoc(collection(db, "academy"), {
        ...academy,
        logoUrl,
        ownerPhoto: ownerPhotoUrl,
        isPublished: true, // 공개 ?�태�?기본 ?�정
        status: "?�영�?, // 기본 ?�태 ?�정
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      alert("?????�카?��? 블로그�? ?�성?�었?�니??");
      
      // ?�성???�카?��? 블로�??�이지�??�동
      navigate(`/academy/${docRef.id}`);
      
    } catch (error) {
      console.error("?�카?��? ?�성 ?�류:", error);
      alert("???�카?��? ?�성???�패?�습?�다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* ?�더 */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/academy/courses"
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                ???�?�보?�로 ?�아가�?              </Link>
              <h1 className="text-2xl font-bold text-gray-800">
                ?�� ???�카?��? 블로�?만들�?              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ?�내 메시지 */}
        <div className="bg-gradient-to-r from-blue-500/10 to-emerald-500/10 backdrop-blur-sm rounded-3xl p-6 mb-8 border border-blue-200/30">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            ?�� ?�카?��? 블로�??�성 ?�내
          </h2>
          <p className="text-gray-600">
            ?�로???�카?��????�립??블로�??�이지�??�성?�니?? 
            ?�록???�보???�당 ?�카?��????�용 ?�이지?�서 ?�시?�며, 
            강좌 관�? 공�??�항, ?�진�??�의 기능???�용?????�습?�다.
          </p>
        </div>

        {/* ?�록 ??*/}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 기본 ?�보 */}
          <div className="relative backdrop-blur-sm bg-white/80 rounded-3xl shadow-xl p-8 border border-white/30">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              ?�� 기본 ?�보
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ?�� ?�카?��?�?*
                </label>
                <input
                  type="text"
                  value={academy.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="?? FC88 ?�카?��?"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ?�� ?�카?��? ?�개 *
                </label>
                <textarea
                  value={academy.intro}
                  onChange={(e) => handleChange('intro', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="?�카?��????�???�세???�개�??�력?�세??
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ?�� ?�치 *
                </label>
                <input
                  type="text"
                  value={academy.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="?? 경기???�천???�○ 체육공원"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ?�️ ?�락�?*
                </label>
                <input
                  type="tel"
                  value={academy.contact}
                  onChange={(e) => handleChange('contact', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="?? 010-0000-0000"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ?�� ?�사?�트
                </label>
                <input
                  type="url"
                  value={academy.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="https://yago-vibe.com/academy/fc88"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ?�� SNS
                </label>
                <input
                  type="text"
                  value={academy.sns}
                  onChange={(e) => handleChange('sns', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="@fc88_academy"
                />
              </div>
            </div>
          </div>

          {/* ?�?�자 ?�보 */}
          <div className="relative backdrop-blur-sm bg-white/80 rounded-3xl shadow-xl p-8 border border-white/30">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              ?��?��??�?�자 ?�보
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ?�� ?�?�자�?*
                </label>
                <input
                  type="text"
                  value={academy.ownerName}
                  onChange={(e) => handleChange('ownerName', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="?? ?�길???�장"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ?�� 직책
                </label>
                <input
                  type="text"
                  value={academy.ownerTitle}
                  onChange={(e) => handleChange('ownerTitle', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="?? FC88 ?�카?��? ?�장"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ?�� ?�?�자 ?�사�?                </label>
                <textarea
                  value={academy.ownerMessage}
                  onChange={(e) => handleChange('ownerMessage', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="?��?모�? ?�생?�에�??�하�??��? ?�사말을 ?�력?�세??
                  rows={3}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ?�� ?�격/경력 ?�보 (?�표�?구분)
                </label>
                <input
                  type="text"
                  value={academy.ownerCredentials.join(", ")}
                  onChange={(e) => handleCredentialsChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="축구지?�자 ?�격�? ?�소??지??경력 10?? ?�???�상 경력"
                />
                <p className="text-xs text-gray-500">
                  ?? 축구지?�자 ?�격�? ?�소??지??경력 10?? ?�???�상 경력
                </p>
              </div>
            </div>
          </div>

          {/* ?�보 ?�보 */}
          <div className="relative backdrop-blur-sm bg-white/80 rounded-3xl shadow-xl p-8 border border-white/30">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              ?�� ?�보 ?�보
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ?�� ?�보 ?�로�?                </label>
                <input
                  type="text"
                  value={academy.slogan}
                  onChange={(e) => handleChange('slogan', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="???�께 ?�고 ?�장?�는 즐거?� ??
                />
                <p className="text-xs text-gray-500">
                  ?�카?��? 블로�??�단??강조 ?�시?�는 ?�보 문구?�니??
                </p>
              </div>

              {/* ?��?지 ?�로??*/}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    ?���??�카?��? 로고
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {logoFile && (
                    <p className="text-sm text-green-600">??{logoFile.name} ?�택??/p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    ?�� ?�?�자 ?�진
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleOwnerPhotoUpload}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {ownerPhotoFile && (
                    <p className="text-sm text-green-600">??{ownerPhotoFile.name} ?�택??/p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ?�출 버튼 */}
          <div className="flex gap-4 justify-center">
            <Link
              to="/academy/courses"
              className="bg-gray-100 text-gray-700 px-8 py-4 rounded-xl hover:bg-gray-200 transition-colors font-medium shadow-md"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "?�성 �?.." : "?�� ?�카?��? 블로�??�성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
