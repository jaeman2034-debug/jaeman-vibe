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

  // ?´ë?ì§€ ?…ë¡œ??ê³µí†µ ?¨ìˆ˜
  const uploadImage = async (file: File, path: string): Promise<string> => {
    // ?Œì¼ ?¬ê¸° ì²´í¬ (5MB ?œí•œ)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("?Œì¼ ?¬ê¸°??5MB ?´í•˜ë¡??œí•œ?©ë‹ˆ??");
    }

    // ?Œì¼ ?€??ì²´í¬
    if (!file.type.startsWith('image/')) {
      throw new Error("?´ë?ì§€ ?Œì¼ë§??…ë¡œ??ê°€?¥í•©?ˆë‹¤.");
    }

    // ê³ ìœ ???Œì¼ëª??ì„±
    const fileName = `${path}_${uuidv4()}_${file.name}`;
    const storageRef = ref(storage, `academy/${path}/${fileName}`);
    
    // ?Œì¼ ?…ë¡œ??    await uploadBytes(storageRef, file);
    
    // ?¤ìš´ë¡œë“œ URL ê°€?¸ì˜¤ê¸?    return await getDownloadURL(storageRef);
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
    
    if (!academy.name) return alert("?„ì¹´?°ë?ëª…ì„ ?…ë ¥?˜ì„¸??);
    if (!academy.ownerName) return alert("?€?œìëª…ì„ ?…ë ¥?˜ì„¸??);
    if (!academy.location) return alert("?„ì¹˜ë¥??…ë ¥?˜ì„¸??);
    if (!academy.contact) return alert("?°ë½ì²˜ë? ?…ë ¥?˜ì„¸??);

    setLoading(true);
    try {
      let logoUrl = "";
      let ownerPhotoUrl = "";

      // ?´ë?ì§€ ?…ë¡œ??      if (logoFile) {
        logoUrl = await uploadImage(logoFile, 'logo');
      }
      if (ownerPhotoFile) {
        ownerPhotoUrl = await uploadImage(ownerPhotoFile, 'owner');
      }

      // Firestore???„ì¹´?°ë? ë¬¸ì„œ ?ì„±
      const docRef = await addDoc(collection(db, "academy"), {
        ...academy,
        logoUrl,
        ownerPhoto: ownerPhotoUrl,
        isPublished: true, // ê³µê°œ ?íƒœë¡?ê¸°ë³¸ ?¤ì •
        status: "?´ì˜ì¤?, // ê¸°ë³¸ ?íƒœ ?¤ì •
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      alert("?????„ì¹´?°ë? ë¸”ë¡œê·¸ê? ?ì„±?˜ì—ˆ?µë‹ˆ??");
      
      // ?ì„±???„ì¹´?°ë? ë¸”ë¡œê·??˜ì´ì§€ë¡??´ë™
      navigate(`/academy/${docRef.id}`);
      
    } catch (error) {
      console.error("?„ì¹´?°ë? ?ì„± ?¤ë¥˜:", error);
      alert("???„ì¹´?°ë? ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* ?¤ë” */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/academy/courses"
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                ???€?œë³´?œë¡œ ?Œì•„ê°€ê¸?              </Link>
              <h1 className="text-2xl font-bold text-gray-800">
                ?« ???„ì¹´?°ë? ë¸”ë¡œê·?ë§Œë“¤ê¸?              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ?ˆë‚´ ë©”ì‹œì§€ */}
        <div className="bg-gradient-to-r from-blue-500/10 to-emerald-500/10 backdrop-blur-sm rounded-3xl p-6 mb-8 border border-blue-200/30">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            ?¯ ?„ì¹´?°ë? ë¸”ë¡œê·??ì„± ?ˆë‚´
          </h2>
          <p className="text-gray-600">
            ?ˆë¡œ???„ì¹´?°ë????…ë¦½??ë¸”ë¡œê·??˜ì´ì§€ë¥??ì„±?©ë‹ˆ?? 
            ?±ë¡???•ë³´???´ë‹¹ ?„ì¹´?°ë????„ìš© ?˜ì´ì§€?ì„œ ?œì‹œ?˜ë©°, 
            ê°•ì¢Œ ê´€ë¦? ê³µì??¬í•­, ?¬ì§„ì²??±ì˜ ê¸°ëŠ¥???¬ìš©?????ˆìŠµ?ˆë‹¤.
          </p>
        </div>

        {/* ?±ë¡ ??*/}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* ê¸°ë³¸ ?•ë³´ */}
          <div className="relative backdrop-blur-sm bg-white/80 rounded-3xl shadow-xl p-8 border border-white/30">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              ?“‹ ê¸°ë³¸ ?•ë³´
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ?« ?„ì¹´?°ë?ëª?*
                </label>
                <input
                  type="text"
                  value={academy.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="?? FC88 ?„ì¹´?°ë?"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ?“ ?„ì¹´?°ë? ?Œê°œ *
                </label>
                <textarea
                  value={academy.intro}
                  onChange={(e) => handleChange('intro', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="?„ì¹´?°ë????€???ì„¸???Œê°œë¥??…ë ¥?˜ì„¸??
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ?“ ?„ì¹˜ *
                </label>
                <input
                  type="text"
                  value={academy.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="?? ê²½ê¸°???¬ì²œ???‹â—‹ ì²´ìœ¡ê³µì›"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ?ï¸ ?°ë½ì²?*
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
                  ?Œ ?¹ì‚¬?´íŠ¸
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
                  ?“¢ SNS
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

          {/* ?€?œì ?•ë³´ */}
          <div className="relative backdrop-blur-sm bg-white/80 rounded-3xl shadow-xl p-8 border border-white/30">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              ?‘¨?ğŸ??€?œì ?•ë³´
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ?‘¤ ?€?œìëª?*
                </label>
                <input
                  type="text"
                  value={academy.ownerName}
                  onChange={(e) => handleChange('ownerName', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="?? ?ê¸¸???ì¥"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ?’¼ ì§ì±…
                </label>
                <input
                  type="text"
                  value={academy.ownerTitle}
                  onChange={(e) => handleChange('ownerTitle', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="?? FC88 ?„ì¹´?°ë? ?ì¥"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ?’¬ ?€?œì ?¸ì‚¬ë§?                </label>
                <textarea
                  value={academy.ownerMessage}
                  onChange={(e) => handleChange('ownerMessage', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="?™ë?ëª¨ì? ?™ìƒ?¤ì—ê²??„í•˜ê³??¶ì? ?¸ì‚¬ë§ì„ ?…ë ¥?˜ì„¸??
                  rows={3}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ?† ?ê²©/ê²½ë ¥ ?•ë³´ (?¼í‘œë¡?êµ¬ë¶„)
                </label>
                <input
                  type="text"
                  value={academy.ownerCredentials.join(", ")}
                  onChange={(e) => handleCredentialsChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="ì¶•êµ¬ì§€?„ì ?ê²©ì¦? ? ì†Œ??ì§€??ê²½ë ¥ 10?? ?€???˜ìƒ ê²½ë ¥"
                />
                <p className="text-xs text-gray-500">
                  ?? ì¶•êµ¬ì§€?„ì ?ê²©ì¦? ? ì†Œ??ì§€??ê²½ë ¥ 10?? ?€???˜ìƒ ê²½ë ¥
                </p>
              </div>
            </div>
          </div>

          {/* ?ë³´ ?•ë³´ */}
          <div className="relative backdrop-blur-sm bg-white/80 rounded-3xl shadow-xl p-8 border border-white/30">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              ?¯ ?ë³´ ?•ë³´
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ?¯ ?ë³´ ?¬ë¡œê±?                </label>
                <input
                  type="text"
                  value={academy.slogan}
                  onChange={(e) => handleChange('slogan', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="???¨ê»˜ ?°ê³  ?±ì¥?˜ëŠ” ì¦ê±°?€ ??
                />
                <p className="text-xs text-gray-500">
                  ?„ì¹´?°ë? ë¸”ë¡œê·??ë‹¨??ê°•ì¡° ?œì‹œ?˜ëŠ” ?ë³´ ë¬¸êµ¬?…ë‹ˆ??
                </p>
              </div>

              {/* ?´ë?ì§€ ?…ë¡œ??*/}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    ?–¼ï¸??„ì¹´?°ë? ë¡œê³ 
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {logoFile && (
                    <p className="text-sm text-green-600">??{logoFile.name} ? íƒ??/p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    ?“¸ ?€?œì ?¬ì§„
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleOwnerPhotoUpload}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {ownerPhotoFile && (
                    <p className="text-sm text-green-600">??{ownerPhotoFile.name} ? íƒ??/p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ?œì¶œ ë²„íŠ¼ */}
          <div className="flex gap-4 justify-center">
            <Link
              to="/academy/courses"
              className="bg-gray-100 text-gray-700 px-8 py-4 rounded-xl hover:bg-gray-200 transition-colors font-medium shadow-md"
            >
              ì·¨ì†Œ
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "?ì„± ì¤?.." : "?« ?„ì¹´?°ë? ë¸”ë¡œê·??ì„±"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
