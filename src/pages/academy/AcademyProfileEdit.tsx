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
  // ?€?œì ?•ë³´ (? ë¢° ?¬ì¸??
  ownerName?: string;
  ownerPhoto?: string;
  ownerMessage?: string;
  ownerTitle?: string;
  ownerCredentials?: string[];
  // ?ë³´ ?•ë³´
  slogan?: string; // ?ë³´ ?¬ë¡œê±?}

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
          // ê¸°ë³¸ê°??¤ì •
          setAcademy({
            id: "academy_001",
            name: "?Œí˜ ì¶•êµ¬ ?„ì¹´?°ë?",
            intro: "? ì†Œ??ì¶•êµ¬ë¥??„ë¬¸?ìœ¼ë¡?ì§€?„í•˜???„ì¹´?°ë??…ë‹ˆ??",
            logoUrl: "",
            location: "ê²½ê¸° ?¬ì²œ???Œí˜ ì²´ìœ¡ê³µì› Aêµ¬ì¥",
            contact: "010-1234-5678",
            website: "https://yago-vibe.com/academy",
            sns: "@socheol_fc_official",
            // ?€?œì ?•ë³´ ê¸°ë³¸ê°?            ownerName: "ê¹€ì½”ì¹˜ ?ì¥",
            ownerPhoto: "",
            ownerMessage: "?„ì´?¤ì˜ ?±ì¥ê³?ê¿ˆì„ ìµœìš°? ìœ¼ë¡??ê°?˜ë©°, ì²´ê³„?ì¸ ì§€?„ë? ?µí•´ ?¸ì„±ê³??¤ë ¥???¨ê»˜ ?¤ì›Œ?˜ê?ê² ìŠµ?ˆë‹¤.",
            ownerTitle: "?Œí˜ ì¶•êµ¬ ?„ì¹´?°ë? ?ì¥",
            ownerCredentials: ["ì¶•êµ¬ì§€?„ì ?ê²©ì¦?, "? ì†Œ??ì§€??ê²½ë ¥ 10??],
            // ?ë³´ ?•ë³´ ê¸°ë³¸ê°?            slogan: "???„ì´?¤ì˜ ê¿ˆì„ ?¤ìš°??ì¶•êµ¬ ?„ì¹´?°ë? ??
          });
        }
      } catch (error) {
        console.error("?„ì¹´?°ë? ?•ë³´ ë¶ˆëŸ¬?¤ê¸° ?¤ë¥˜:", error);
        alert("?„ì¹´?°ë? ?•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ”???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
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

  // ?´ë?ì§€ ?…ë¡œ??ê³µí†µ ?¨ìˆ˜
  const uploadImage = async (file: File, path: string, fieldName: keyof Academy) => {
    // ?Œì¼ ?¬ê¸° ì²´í¬ (5MB ?œí•œ)
    if (file.size > 5 * 1024 * 1024) {
      alert("???Œì¼ ?¬ê¸°??5MB ?´í•˜ë¡??œí•œ?©ë‹ˆ??");
      return;
    }

    // ?Œì¼ ?€??ì²´í¬
    if (!file.type.startsWith('image/')) {
      alert("???´ë?ì§€ ?Œì¼ë§??…ë¡œ??ê°€?¥í•©?ˆë‹¤.");
      return;
    }

    setUploading(true);
    try {
      // ê³ ìœ ???Œì¼ëª??ì„±
      const fileName = `${path}_${uuidv4()}_${file.name}`;
      const storageRef = ref(storage, `academy/${path}/${fileName}`);
      
      // ?Œì¼ ?…ë¡œ??      await uploadBytes(storageRef, file);
      
      // ?¤ìš´ë¡œë“œ URL ê°€?¸ì˜¤ê¸?      const downloadURL = await getDownloadURL(storageRef);
      
      // ?„ì¹´?°ë? ?•ë³´ ?…ë°?´íŠ¸
      setAcademy((prev: Academy | null) => {
        if (!prev) return null;
        return { ...prev, [fieldName]: downloadURL };
      });
      
      alert(`??${fieldName === 'logoUrl' ? 'ë¡œê³ ' : '?€?œì ?¬ì§„'}???…ë¡œ?œë˜?ˆìŠµ?ˆë‹¤!`);
    } catch (error) {
      console.error("?´ë?ì§€ ?…ë¡œ???¤ë¥˜:", error);
      alert("???´ë?ì§€ ?…ë¡œ??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    } finally {
      setUploading(false);
    }
  };

  // ë¡œê³  ?…ë¡œ??  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file, 'logo', 'logoUrl');
  };

  // ?€?œì ?¬ì§„ ?…ë¡œ??  const handleOwnerPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        // ?€?œì ?•ë³´
        ownerName: academy.ownerName,
        ownerPhoto: academy.ownerPhoto,
        ownerMessage: academy.ownerMessage,
        ownerTitle: academy.ownerTitle,
        ownerCredentials: academy.ownerCredentials,
        // ?ë³´ ?•ë³´
        slogan: academy.slogan,
        updatedAt: new Date(),
      });
      
      alert("???„ì¹´?°ë? ?„ë¡œ?„ì´ ?€?¥ë˜?ˆìŠµ?ˆë‹¤!");
      
      // 2ì´????ë™?¼ë¡œ ?¤ë¡œê°€ê¸?      setTimeout(() => {
        navigate("/academy/courses");
      }, 2000);
    } catch (error) {
      console.error("?€???¤ë¥˜:", error);
      alert("???€??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">?„ì¹´?°ë? ?•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
        </div>
      </div>
    );
  }

  if (!academy) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">?„ì¹´?°ë? ?•ë³´ë¥?ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ?¤ë” */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Link 
                  to="/academy/courses"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  ???¤ë¡œê°€ê¸?                </Link>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                  ?« ?„ì¹´?°ë? ?„ë¡œ??ê´€ë¦?                </h1>
              </div>
              <p className="text-gray-600 mt-2">
                ?™ì›??ê¸°ë³¸ ?•ë³´ë¥??˜ì •?˜ê³  ê´€ë¦¬í•  ???ˆìŠµ?ˆë‹¤.
              </p>
            </div>
            <div className="text-sm text-gray-500">
              ë§ˆì?ë§??…ë°?´íŠ¸: {academy.updatedAt ? new Date(academy.updatedAt).toLocaleString() : "?†ìŒ"}
            </div>
          </div>
        </div>

        {/* ?„ë¡œ??ë¯¸ë¦¬ë³´ê¸° */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            ?‘ï¸?ë¯¸ë¦¬ë³´ê¸°
          </h2>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <img
                src={academy.logoUrl || "/default-academy.png"}
                alt="?™ì› ë¡œê³ "
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

        {/* ?¸ì§‘ ??*/}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center">
            ?ï¸ ?•ë³´ ?¸ì§‘
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ?™ì›ëª?*/}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?« ?™ì›ëª?*
              </label>
              <input
                type="text"
                name="name"
                value={academy.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="?™ì›ëª…ì„ ?…ë ¥?˜ì„¸??
                required
              />
            </div>

            {/* ?„ì¹˜ */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?“ ?„ì¹˜ *
              </label>
              <input
                type="text"
                name="location"
                value={academy.location}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="?™ì› ?„ì¹˜ë¥??…ë ¥?˜ì„¸??
                required
              />
            </div>

            {/* ?°ë½ì²?*/}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?ï¸ ?°ë½ì²?*
              </label>
              <input
                type="text"
                name="contact"
                value={academy.contact}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="?°ë½ì²˜ë? ?…ë ¥?˜ì„¸??
                required
              />
            </div>

            {/* ?ˆí˜?´ì? */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?Œ ?ˆí˜?´ì?
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
                ?“¢ SNS ê³„ì •
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

            {/* ë¡œê³  ?…ë¡œ??*/}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">
                ?–¼ï¸??™ì› ë¡œê³ 
              </label>
              
              {/* ?„ì¬ ë¡œê³  ë¯¸ë¦¬ë³´ê¸° */}
              {academy.logoUrl && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <img
                    src={academy.logoUrl}
                    alt="ë¡œê³  ë¯¸ë¦¬ë³´ê¸°"
                    className="w-16 h-16 rounded-lg object-cover border-2 border-blue-200"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23e5f3ff'/%3E%3Ctext x='32' y='40' text-anchor='middle' font-size='24' fill='%233b82f6'%3E??3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">?„ì¬ ë¡œê³ </p>
                    <p className="text-xs text-gray-500 truncate">{academy.logoUrl}</p>
                  </div>
                </div>
              )}
              
              {/* ?Œì¼ ?…ë¡œ??*/}
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
                      <span className="text-sm">?…ë¡œ??ì¤?..</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500">
                <p>??ê¶Œì¥ ?¬ê¸°: 200x200px ?´ìƒ (?•ì‚¬ê°í˜•)</p>
              </div>
            </div>
          </div>

          {/* ?Œê°œ */}
          <div className="mt-6 space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              ?“ ?™ì› ?Œê°œ *
            </label>
            <textarea
              name="intro"
              value={academy.intro}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="?™ì›???€???Œê°œë¥??…ë ¥?˜ì„¸??
              required
            />
          </div>
        </div>

        {/* ?€?œì ?•ë³´ ?¹ì…˜ */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-6 flex items-center">
            ?‘¨?ğŸ??€?œì ?•ë³´ (? ë¢° ?¬ì¸??
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ?€?œì ?´ë¦„ */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?‘¤ ?€?œì ?´ë¦„
              </label>
              <input
                type="text"
                name="ownerName"
                value={academy.ownerName || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="ê¹€ì½”ì¹˜ ?ì¥"
              />
            </div>

            {/* ì§ì±… */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?·ï¸?ì§ì±…/?¸ì¹­
              </label>
              <input
                type="text"
                name="ownerTitle"
                value={academy.ownerTitle || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="?Œí˜ ì¶•êµ¬ ?„ì¹´?°ë? ?ì¥"
              />
            </div>

            {/* ?€?œì ?¬ì§„ ?…ë¡œ??*/}
            <div className="space-y-4 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?“¸ ?€?œì ?¬ì§„
              </label>
              
              {/* ?„ì¬ ?¬ì§„ ë¯¸ë¦¬ë³´ê¸° */}
              {academy.ownerPhoto && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <img
                    src={academy.ownerPhoto}
                    alt="?€?œì ?¬ì§„ ë¯¸ë¦¬ë³´ê¸°"
                    className="w-20 h-20 rounded-full object-cover border-2 border-blue-200"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23e5f3ff'/%3E%3Ctext x='40' y='45' text-anchor='middle' font-size='24' fill='%233b82f6'%3E?‘¨?ğŸ?3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">?„ì¬ ?€?œì ?¬ì§„</p>
                    <p className="text-xs text-gray-500 truncate">{academy.ownerPhoto}</p>
                  </div>
                </div>
              )}
              
              {/* ?Œì¼ ?…ë¡œ??*/}
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
                      <span className="text-sm">?…ë¡œ??ì¤?..</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>???´ë?ì§€ ?Œì¼ë§??…ë¡œ??ê°€??(JPG, PNG, GIF ??</p>
                <p>???Œì¼ ?¬ê¸°: ìµœë? 5MB</p>
                <p>??ê¶Œì¥ ?¬ê¸°: 400x400px ?´ìƒ (?•ì‚¬ê°í˜•)</p>
              </div>
            </div>

            {/* ?€?œì ?¸ì‚¬ë§?*/}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?’¬ ?€?œì ?¸ì‚¬ë§?              </label>
              <textarea
                name="ownerMessage"
                value={academy.ownerMessage || ""}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="?™ë?ëª¨ì? ?™ìƒ?¤ì—ê²??„í•˜ê³??¶ì? ?¸ì‚¬ë§ì„ ?…ë ¥?˜ì„¸??
              />
            </div>

            {/* ?ê²©/ê²½ë ¥ ?•ë³´ */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?† ?ê²©/ê²½ë ¥ ?•ë³´ (?¼í‘œë¡?êµ¬ë¶„)
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
                placeholder="ì¶•êµ¬ì§€?„ì ?ê²©ì¦? ? ì†Œ??ì§€??ê²½ë ¥ 10?? ?€???˜ìƒ ê²½ë ¥"
              />
              <p className="text-xs text-gray-500">
                ?? ì¶•êµ¬ì§€?„ì ?ê²©ì¦? ? ì†Œ??ì§€??ê²½ë ¥ 10?? ?€???˜ìƒ ê²½ë ¥
              </p>
            </div>

            {/* ?ë³´ ?¬ë¡œê±?*/}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">
                ?¯ ?ë³´ ?¬ë¡œê±?              </label>
              <input
                type="text"
                value={academy.slogan || ""}
                onChange={(e) => handleChange('slogan', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="???„ì´?¤ì˜ ê¿ˆì„ ?¤ìš°??ì¶•êµ¬ ?„ì¹´?°ë? ??
              />
              <p className="text-xs text-gray-500">
                ?€?œë³´???ë‹¨??ê°•ì¡° ?œì‹œ?˜ëŠ” ?ë³´ ë¬¸êµ¬?…ë‹ˆ??
              </p>
            </div>
          </div>
        </div>

        {/* ?¸ì§‘ ??ê³„ì† */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">

          {/* ?€??ë²„íŠ¼ */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || !academy.name || !academy.intro || !academy.location || !academy.contact}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ?€??ì¤?..
                </>
              ) : (
                <>
                  ?’¾ ?€?¥í•˜ê¸?                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
