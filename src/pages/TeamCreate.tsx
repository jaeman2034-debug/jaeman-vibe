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

  // ?�재 ?�용???�증 ?�태 ?�인
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const validateAndSetFile = (file: File) => {
    // ?�일 ?�??검�?    if (!file.type.startsWith('image/')) {
      alert('?��?지 ?�일�??�로?�할 ???�습?�다.');
      return;
    }
    
    // ?�일 ?�기 검�?(5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('?�일 ?�기??5MB ?�하?�야 ?�니??');
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

  // 커버 ?��?지 ?�래�????�롭 ?�들??  const handleCoverDrop = (e: React.DragEvent) => {
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
    // ?�일 ?�??검�?    if (!file.type.startsWith('image/')) {
      alert('?��?지 ?�일�??�로?�할 ???�습?�다.');
      return;
    }
    
    // ?�일 ?�기 검�?(10MB - 커버?????????�음)
    if (file.size > 10 * 1024 * 1024) {
      alert('?�일 ?�기??10MB ?�하?�야 ?�니??');
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
    if (!teamName) return alert("?� ?�름???�력?�세??");
    if (!currentUser) return alert("로그?�이 ?�요?�니??");

    setIsUploading(true);
    try {
      const teamId = teamName.toLowerCase().replace(/\s+/g, "-"); // slugify
      
      console.log("?? ?� ?�성 ?�작:", teamId);
      console.log("=".repeat(50));

      // 1?�계: Firestore??기본 ?�이??먼�? ?�성
      console.log("?�� 1?�계: Firestore 기본 ?�이???�성");
      await setDoc(doc(db, "teams", teamId), {
        name: teamName,
        region,
        intro,
        createdAt: new Date().toISOString(),
        ownerUid: currentUser.uid,
      });
      console.log("??Firestore 기본 ?�이???�???�료");

      let coverUrl = "";
      let logoUrl = "";

      // 2?�계: 커버 ?��?지 ?�로??      if (coverFile) {
        console.log("?�� 2?�계: 커버 ?��?지 ?�로???�작");
        console.log("   ?�일�?", coverFile.name);
        console.log("   ?�일 ?�기:", (coverFile.size / 1024 / 1024).toFixed(2) + "MB");
        
        const fileExt = coverFile.name.split('.').pop() || 'jpg';
        const coverRef = ref(storage, `teams/${teamId}/cover_${coverFile.name}`);
        console.log("   Storage 경로:", `teams/${teamId}/cover_${coverFile.name}`);
        console.log("   ?�� teams/ ?�더???�로??(?�동 ?�성??");
        
        await uploadBytes(coverRef, coverFile);
        console.log("   ??커버 ?�일 ?�로???�공");
        console.log("   Storage 참조:", coverRef.fullPath);
        
        coverUrl = await getDownloadURL(coverRef);
        console.log("   ??커버 downloadURL ?�득");
        console.log("   ?�체 URL:", coverUrl);
        console.log("   URL 길이:", coverUrl.length);
        
        // URL ?�효??검??        if (coverUrl.startsWith("https://firebasestorage.googleapis.com/")) {
          console.log("   ???�효??Firebase Storage URL");
        } else {
          console.error("   ???�못??URL ?�식:", coverUrl);
        }
      } else {
        console.log("?�� 2?�계: 커버 ?��?지 ?�음, 건너?�");
      }

      // 3?�계: 로고 ?��?지 ?�로??      if (logoFile) {
        console.log("?���?3?�계: 로고 ?��?지 ?�로???�작");
        console.log("   ?�일�?", logoFile.name);
        console.log("   ?�일 ?�기:", (logoFile.size / 1024 / 1024).toFixed(2) + "MB");
        
        const fileExt = logoFile.name.split('.').pop() || 'png';
        const logoRef = ref(storage, `teams/${teamId}/logo_${logoFile.name}`);
        console.log("   Storage 경로:", `teams/${teamId}/logo_${logoFile.name}`);
        console.log("   ?�� teams/ ?�더???�로??(?�동 ?�성??");
        
        await uploadBytes(logoRef, logoFile);
        console.log("   ??로고 ?�일 ?�로???�공");
        console.log("   Storage 참조:", logoRef.fullPath);
        
        logoUrl = await getDownloadURL(logoRef);
        console.log("   ??로고 downloadURL ?�득");
        console.log("   ?�체 URL:", logoUrl);
        console.log("   URL 길이:", logoUrl.length);
        
        // URL ?�효??검??        if (logoUrl.startsWith("https://firebasestorage.googleapis.com/")) {
          console.log("   ???�효??Firebase Storage URL");
        } else {
          console.error("   ???�못??URL ?�식:", logoUrl);
        }
      } else {
        console.log("?���?3?�계: 로고 ?��?지 ?�음, 기본 ?��?지 ?�용");
        logoUrl = "https://picsum.photos/120/120?random=5";
      }

      // 4?�계: Firestore 문서??URL ?�데?�트
      console.log("?�� 4?�계: Firestore???��?지 URL ?�데?�트");
      await setDoc(doc(db, "teams", teamId), {
        coverUrl,
        logoUrl,
      }, { merge: true });
      console.log("??Firestore URL ?�데?�트 ?�료");

      console.log("=".repeat(50));
      console.log("?�� ?� ?�성 ?�료!");
      console.log("   ?� ID:", teamId);
      console.log("   커버 URL:", coverUrl || "?�음");
      console.log("   로고 URL:", logoUrl);
      console.log("=".repeat(50));

      alert("?�???�공?�으�??�성?�었?�니??");
      navigate(`/teams/${teamId}/dashboard`);
    } catch (error) {
      console.error("???� ?�성 ?�패:", error);
      console.error("?�류 ?�세:", error.message);
      console.error("?�류 코드:", error.code);
      console.error("?�류 ?�택:", error.stack);
      
      // Firebase Storage 관???�러?��? ?�인
      if (error.code === 'storage/unauthorized') {
        alert("??Firebase Storage 권한???�습?�다. Storage 규칙???�인?�세??");
      } else if (error.code === 'storage/object-not-found') {
        alert("???�로?�된 ?�일??찾을 ???�습?�다.");
      } else if (error.code === 'storage/quota-exceeded') {
        alert("??Firebase Storage ?�량??초과?�었?�니??");
      } else {
        alert(`???� ?�성???�패?�습?�다.\n?�류: ${error.message}\n?�세???�용?� 콘솔???�인?�세??`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // 로그?�하지 ?��? 경우
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">로그?�이 ?�요?�니??/h2>
          <p className="text-gray-600 dark:text-gray-400">?�???�성?�려�?먼�? 로그?�해주세??</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8">
          <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100 flex items-center gap-3">
            ?????� 블로�??�성
          </h1>

          <div className="space-y-6">
            {/* ?� ?�름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ?� ?�름 *
              </label>
              <input
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="?? ?�흘FC60"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>

            {/* 지??*/}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                지??              </label>
              <input
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="?? 경기???�천??
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>

            {/* ?� ?�개 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ?� ?�개
              </label>
              <textarea
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                placeholder="?�???�???�개�??�성?�주?�요..."
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
              />
            </div>

              {/* 커버 ?��?지 ?�래�????�롭 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ?� 커버 ?��?지 <span className="text-gray-500 text-xs">(?�택?�항)</span>
                </label>
              
              {/* 커버 ?�래�????�롭 ?�역 */}
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
                      alt="커버 미리보기"
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
                      ??커버 ?�거
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-3xl text-gray-400 dark:text-gray-500">
                      ?���?                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300 font-medium">
                        ?�기�??� 커버 ?��?지�??�래�????�롭?�세??                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        ?�는 ?�릭?�여 ?�일 ?�택 (10MB ?�하)
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
                      ?���?커버 ?�택
                    </label>
                  </div>
                )}
              </div>
            </div>

              {/* ?�래�????�롭 로고 ?�로??*/}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ?� 로고 <span className="text-gray-500 text-xs">(?�택?�항 - ?�으�??�동?�로 고양???��?지 ?��)</span>
                </label>
              
              {/* ?�래�????�롭 ?�역 */}
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
                      alt="?� 로고 미리보기"
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
                      ???��?지 ?�거
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-4xl text-gray-400 dark:text-gray-500">
                      ?��
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300 font-medium">
                        ?�기�??� 로고 ?��?지�??�래�????�롭?�세??                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        ?�는 ?�릭?�여 ?�일 ?�택
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
                      ?�� ?�일 ?�택
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* ?�성 버튼 */}
            <button
              onClick={handleCreateTeam}
              disabled={isUploading || !teamName}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
            >
              {isUploading ? "?� ?�성 �?.." : "?� ?�성 (로고 ?�으�??�동 ?�성 ?��)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
