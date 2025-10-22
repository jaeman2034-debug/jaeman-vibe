import { useState, useEffect } from "react";
import { storage, db, auth } from "../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

export default function TeamCreate() {
  const [teamName, setTeamName] = useState("");
  const [region, setRegion] = useState("");
  const [intro, setIntro] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isCoverDragging, setIsCoverDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();

  // ?„ì¬ ?¬ìš©???¸ì¦ ?íƒœ ?•ì¸
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const validateAndSetFile = (file: File) => {
    // ?Œì¼ ?€??ê²€ì¦?    if (!file.type.startsWith('image/')) {
      alert('?´ë?ì§€ ?Œì¼ë§??…ë¡œ?œí•  ???ˆìŠµ?ˆë‹¤.');
      return;
    }
    
    // ?Œì¼ ?¬ê¸° ê²€ì¦?(5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('?Œì¼ ?¬ê¸°??5MB ?´í•˜?¬ì•¼ ?©ë‹ˆ??');
      return;
    }
    
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // ì»¤ë²„ ?´ë?ì§€ ?œë˜ê·????œë¡­ ?¸ë“¤??  const handleCoverDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsCoverDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetCoverFile(file);
    }
  };

  const handleCoverDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsCoverDragging(true);
  };

  const handleCoverDragLeave = () => {
    setIsCoverDragging(false);
  };

  const validateAndSetCoverFile = (file: File) => {
    // ?Œì¼ ?€??ê²€ì¦?    if (!file.type.startsWith('image/')) {
      alert('?´ë?ì§€ ?Œì¼ë§??…ë¡œ?œí•  ???ˆìŠµ?ˆë‹¤.');
      return;
    }
    
    // ?Œì¼ ?¬ê¸° ê²€ì¦?(10MB - ì»¤ë²„?????????ˆìŒ)
    if (file.size > 10 * 1024 * 1024) {
      alert('?Œì¼ ?¬ê¸°??10MB ?´í•˜?¬ì•¼ ?©ë‹ˆ??');
      return;
    }
    
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetCoverFile(file);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName) return alert("?€ ?´ë¦„???…ë ¥?˜ì„¸??");
    if (!currentUser) return alert("ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??");

    setIsUploading(true);
    try {
      const teamId = teamName.toLowerCase().replace(/\s+/g, "-"); // slugify
      
      console.log("?? ?€ ?ì„± ?œì‘:", teamId);
      console.log("=".repeat(50));

      // 1?¨ê³„: Firestore??ê¸°ë³¸ ?°ì´??ë¨¼ì? ?ì„±
      console.log("?“ 1?¨ê³„: Firestore ê¸°ë³¸ ?°ì´???ì„±");
      await setDoc(doc(db, "teams", teamId), {
        name: teamName,
        region,
        intro,
        createdAt: new Date().toISOString(),
        ownerUid: currentUser.uid,
      });
      console.log("??Firestore ê¸°ë³¸ ?°ì´???€???„ë£Œ");

      let coverUrl = "";
      let logoUrl = "";

      // 2?¨ê³„: ì»¤ë²„ ?´ë?ì§€ ?…ë¡œ??      if (coverFile) {
        console.log("?“¸ 2?¨ê³„: ì»¤ë²„ ?´ë?ì§€ ?…ë¡œ???œì‘");
        console.log("   ?Œì¼ëª?", coverFile.name);
        console.log("   ?Œì¼ ?¬ê¸°:", (coverFile.size / 1024 / 1024).toFixed(2) + "MB");
        
        const fileExt = coverFile.name.split('.').pop() || 'jpg';
        const coverRef = ref(storage, `teams/${teamId}/cover_${coverFile.name}`);
        console.log("   Storage ê²½ë¡œ:", `teams/${teamId}/cover_${coverFile.name}`);
        console.log("   ?“ teams/ ?´ë”???…ë¡œ??(?ë™ ?ì„±??");
        
        await uploadBytes(coverRef, coverFile);
        console.log("   ??ì»¤ë²„ ?Œì¼ ?…ë¡œ???±ê³µ");
        console.log("   Storage ì°¸ì¡°:", coverRef.fullPath);
        
        coverUrl = await getDownloadURL(coverRef);
        console.log("   ??ì»¤ë²„ downloadURL ?ë“");
        console.log("   ?„ì²´ URL:", coverUrl);
        console.log("   URL ê¸¸ì´:", coverUrl.length);
        
        // URL ? íš¨??ê²€??        if (coverUrl.startsWith("https://firebasestorage.googleapis.com/")) {
          console.log("   ??? íš¨??Firebase Storage URL");
        } else {
          console.error("   ???˜ëª»??URL ?•ì‹:", coverUrl);
        }
      } else {
        console.log("?“¸ 2?¨ê³„: ì»¤ë²„ ?´ë?ì§€ ?†ìŒ, ê±´ë„ˆ?€");
      }

      // 3?¨ê³„: ë¡œê³  ?´ë?ì§€ ?…ë¡œ??      if (logoFile) {
        console.log("?–¼ï¸?3?¨ê³„: ë¡œê³  ?´ë?ì§€ ?…ë¡œ???œì‘");
        console.log("   ?Œì¼ëª?", logoFile.name);
        console.log("   ?Œì¼ ?¬ê¸°:", (logoFile.size / 1024 / 1024).toFixed(2) + "MB");
        
        const fileExt = logoFile.name.split('.').pop() || 'png';
        const logoRef = ref(storage, `teams/${teamId}/logo_${logoFile.name}`);
        console.log("   Storage ê²½ë¡œ:", `teams/${teamId}/logo_${logoFile.name}`);
        console.log("   ?“ teams/ ?´ë”???…ë¡œ??(?ë™ ?ì„±??");
        
        await uploadBytes(logoRef, logoFile);
        console.log("   ??ë¡œê³  ?Œì¼ ?…ë¡œ???±ê³µ");
        console.log("   Storage ì°¸ì¡°:", logoRef.fullPath);
        
        logoUrl = await getDownloadURL(logoRef);
        console.log("   ??ë¡œê³  downloadURL ?ë“");
        console.log("   ?„ì²´ URL:", logoUrl);
        console.log("   URL ê¸¸ì´:", logoUrl.length);
        
        // URL ? íš¨??ê²€??        if (logoUrl.startsWith("https://firebasestorage.googleapis.com/")) {
          console.log("   ??? íš¨??Firebase Storage URL");
        } else {
          console.error("   ???˜ëª»??URL ?•ì‹:", logoUrl);
        }
      } else {
        console.log("?–¼ï¸?3?¨ê³„: ë¡œê³  ?´ë?ì§€ ?†ìŒ, ê¸°ë³¸ ?´ë?ì§€ ?¬ìš©");
        logoUrl = "https://picsum.photos/120/120?random=5";
      }

      // 4?¨ê³„: Firestore ë¬¸ì„œ??URL ?…ë°?´íŠ¸
      console.log("?”„ 4?¨ê³„: Firestore???´ë?ì§€ URL ?…ë°?´íŠ¸");
      await setDoc(doc(db, "teams", teamId), {
        coverUrl,
        logoUrl,
      }, { merge: true });
      console.log("??Firestore URL ?…ë°?´íŠ¸ ?„ë£Œ");

      console.log("=".repeat(50));
      console.log("?‰ ?€ ?ì„± ?„ë£Œ!");
      console.log("   ?€ ID:", teamId);
      console.log("   ì»¤ë²„ URL:", coverUrl || "?†ìŒ");
      console.log("   ë¡œê³  URL:", logoUrl);
      console.log("=".repeat(50));

      alert("?€???±ê³µ?ìœ¼ë¡??ì„±?˜ì—ˆ?µë‹ˆ??");
      navigate(`/teams/${teamId}/dashboard`);
    } catch (error) {
      console.error("???€ ?ì„± ?¤íŒ¨:", error);
      console.error("?¤ë¥˜ ?ì„¸:", error.message);
      console.error("?¤ë¥˜ ì½”ë“œ:", error.code);
      console.error("?¤ë¥˜ ?¤íƒ:", error.stack);
      
      // Firebase Storage ê´€???ëŸ¬?¸ì? ?•ì¸
      if (error.code === 'storage/unauthorized') {
        alert("??Firebase Storage ê¶Œí•œ???†ìŠµ?ˆë‹¤. Storage ê·œì¹™???•ì¸?˜ì„¸??");
      } else if (error.code === 'storage/object-not-found') {
        alert("???…ë¡œ?œëœ ?Œì¼??ì°¾ì„ ???†ìŠµ?ˆë‹¤.");
      } else if (error.code === 'storage/quota-exceeded') {
        alert("??Firebase Storage ?©ëŸ‰??ì´ˆê³¼?˜ì—ˆ?µë‹ˆ??");
      } else {
        alert(`???€ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.\n?¤ë¥˜: ${error.message}\n?ì„¸???´ìš©?€ ì½˜ì†”???•ì¸?˜ì„¸??`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // ë¡œê·¸?¸í•˜ì§€ ?Šì? ê²½ìš°
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??/h2>
          <p className="text-gray-600 dark:text-gray-400">?€???ì„±?˜ë ¤ë©?ë¨¼ì? ë¡œê·¸?¸í•´ì£¼ì„¸??</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8">
          <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100 flex items-center gap-3">
            ?????€ ë¸”ë¡œê·??ì„±
          </h1>

          <div className="space-y-6">
            {/* ?€ ?´ë¦„ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ?€ ?´ë¦„ *
              </label>
              <input
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="?? ?Œí˜FC60"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>

            {/* ì§€??*/}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ì§€??              </label>
              <input
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="?? ê²½ê¸°???¬ì²œ??
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>

            {/* ?€ ?Œê°œ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ?€ ?Œê°œ
              </label>
              <textarea
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                placeholder="?€???€???Œê°œë¥??‘ì„±?´ì£¼?¸ìš”..."
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
              />
            </div>

              {/* ì»¤ë²„ ?´ë?ì§€ ?œë˜ê·????œë¡­ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ?€ ì»¤ë²„ ?´ë?ì§€ <span className="text-gray-500 text-xs">(? íƒ?¬í•­)</span>
                </label>
              
              {/* ì»¤ë²„ ?œë˜ê·????œë¡­ ?ì—­ */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
                  isCoverDragging 
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-400" 
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
                onDragOver={handleCoverDragOver}
                onDragLeave={handleCoverDragLeave}
                onDrop={handleCoverDrop}
                onClick={() => document.getElementById('cover-upload')?.click()}
              >
                {coverPreview ? (
                  <div className="space-y-3">
                    <img
                      src={coverPreview}
                      alt="ì»¤ë²„ ë¯¸ë¦¬ë³´ê¸°"
                      className="mx-auto w-full h-32 object-cover rounded-lg border-2 border-white dark:border-gray-700 shadow-lg"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {coverFile?.name}
                    </p>
                    <button
                      onClick={() => {
                        setCoverFile(null);
                        setCoverPreview("");
                      }}
                      className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      ??ì»¤ë²„ ?œê±°
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-3xl text-gray-400 dark:text-gray-500">
                      ?–¼ï¸?                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300 font-medium">
                        ?¬ê¸°ë¡??€ ì»¤ë²„ ?´ë?ì§€ë¥??œë˜ê·????œë¡­?˜ì„¸??                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        ?ëŠ” ?´ë¦­?˜ì—¬ ?Œì¼ ? íƒ (10MB ?´í•˜)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverFileChange}
                      className="hidden"
                      id="cover-upload"
                    />
                    <label
                      htmlFor="cover-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg cursor-pointer transition-colors"
                    >
                      ?–¼ï¸?ì»¤ë²„ ? íƒ
                    </label>
                  </div>
                )}
              </div>
            </div>

              {/* ?œë˜ê·????œë¡­ ë¡œê³  ?…ë¡œ??*/}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ?€ ë¡œê³  <span className="text-gray-500 text-xs">(? íƒ?¬í•­ - ?†ìœ¼ë©??ë™?¼ë¡œ ê³ ì–‘???´ë?ì§€ ?±)</span>
                </label>
              
              {/* ?œë˜ê·????œë¡­ ?ì—­ */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
                  isDragging 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400" 
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                {logoPreview ? (
                  <div className="space-y-4">
                    <img
                      src={logoPreview}
                      alt="?€ ë¡œê³  ë¯¸ë¦¬ë³´ê¸°"
                      className="mx-auto w-24 h-24 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-lg"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {logoFile?.name}
                    </p>
                    <button
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview("");
                      }}
                      className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      ???´ë?ì§€ ?œê±°
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-4xl text-gray-400 dark:text-gray-500">
                      ?“·
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300 font-medium">
                        ?¬ê¸°ë¡??€ ë¡œê³  ?´ë?ì§€ë¥??œë˜ê·????œë¡­?˜ì„¸??                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        ?ëŠ” ?´ë¦­?˜ì—¬ ?Œì¼ ? íƒ
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors"
                    >
                      ?“ ?Œì¼ ? íƒ
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* ?ì„± ë²„íŠ¼ */}
            <button
              onClick={handleCreateTeam}
              disabled={isUploading || !teamName}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
            >
              {isUploading ? "?€ ?ì„± ì¤?.." : "?€ ?ì„± (ë¡œê³  ?†ìœ¼ë©??ë™ ?ì„± ?±)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
