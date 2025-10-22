import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { checkAndFixClubPermissions } from "../utils/fixClubPermissions";

export default function ClubBlogNew() {
  const { clubId = "" } = useParams();
  const nav = useNavigate();
  const db = getFirestore();
  const { currentUser } = getAuth();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // UI 기준과 일치하는 권한 확인 함수 (members/{uid}.role도 확인)
  const isClubAdmin = async (club: any, uid: string) => {
    if (!club || !uid) return false;
    
    // 1. 클럽 오너 확인
    if (club.ownerUid === uid || club.ownerId === uid) return true;
    
    // 2. admins 맵 확인
    if (club.admins && typeof club.admins === "object" && club.admins[uid]) return true;
    
    // 3. members/{uid}.role 확인 (UI 기준과 일치)
    try {
      const memberDoc = await getDoc(doc(db, "clubs", clubId, "members", uid));
      if (memberDoc.exists()) {
        const memberData = memberDoc.data();
        const role = memberData?.role;
        if (role === "owner" || role === "admin" || role === "manager") {
          return true;
        }
      }
    } catch (error) {
      console.error("[ClubBlogNew] Member role check error:", error);
    }
    
    return false;
  };

  // 권한 확인 및 자동 수정
  useEffect(() => {
    const checkPermission = async () => {
      if (!currentUser || !clubId) {
        setLoading(false);
        return;
      }

      try {
        const clubDoc = await getDoc(doc(db, "clubs", clubId));
        if (clubDoc.exists()) {
          const clubData = clubDoc.data();
          const isAdminUser = await isClubAdmin(clubData, currentUser.uid);
          
          console.log("[ClubBlogNew] Permission check:", {
            clubId,
            uid: currentUser.uid,
            isAdminUser,
            admins: clubData.admins,
            ownerUid: clubData.ownerUid,
            ownerId: clubData.ownerId
          });

          if (isAdminUser) {
            setIsAdmin(true);
            setPermissionError(null);
          } else {
            // 권한이 없는 경우 자동으로 수정 시도
            console.log("[ClubBlogNew] No admin permission, attempting to fix...");
            try {
              const result = await checkAndFixClubPermissions(clubId);
              console.log("[ClubBlogNew] Permission fix result:", result);
              
              if (result.success) {
                // 권한 수정 후 다시 확인
                const updatedClubDoc = await getDoc(doc(db, "clubs", clubId));
                if (updatedClubDoc.exists()) {
                  const updatedClubData = updatedClubDoc.data();
                  const isAdminAfterFix = await isClubAdmin(updatedClubData, currentUser.uid);
                  setIsAdmin(isAdminAfterFix);
                  setPermissionError(isAdminAfterFix ? null : "권한 수정 후에도 관리자 권한이 없습니다.");
                }
              } else {
                setPermissionError("권한 수정에 실패했습니다.");
              }
            } catch (fixError) {
              console.error("[ClubBlogNew] Permission fix error:", fixError);
              setPermissionError("권한 수정 중 오류가 발생했습니다.");
            }
          }
        } else {
          setPermissionError("클럽을 찾을 수 없습니다.");
        }
      } catch (error) {
        console.error("[ClubBlogNew] Permission check error:", error);
        setPermissionError("권한 확인 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [currentUser, clubId, db]);

  // 브라우저 콘솔에서 사용할 수 있는 글로벌 함수들
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).testCreatePost = testCreatePost;
      (window as any).checkClubPermissions = () => checkAndFixClubPermissions(clubId);
      (window as any).getCurrentUID = () => currentUser?.uid;
      (window as any).getClubId = () => clubId;
      (window as any).checkClubData = async () => {
        const clubDoc = await getDoc(doc(db, "clubs", clubId));
        if (clubDoc.exists()) {
          const clubData = clubDoc.data();
          console.log("[CLUB DATA]", {
            clubId,
            uid: currentUser?.uid,
            ownerUid: clubData.ownerUid,
            admins: clubData.admins,
            adminsType: Array.isArray(clubData.admins) ? "array" : typeof clubData.admins,
            isOwner: clubData.ownerUid === currentUser?.uid,
            isInAdmins: clubData.admins && currentUser?.uid in clubData.admins
          });
          return clubData;
        }
        return null;
      };
      
      // 클럽 데이터 수정 유틸리티 (오너를 admins에 추가)
      (window as any).fixClubData = async () => {
        if (!currentUser) return;
        const clubRef = doc(db, "clubs", clubId);
        await updateDoc(clubRef, { 
          admins: arrayUnion(currentUser.uid) 
        });
        console.log("[CLUB DATA FIXED] Added owner to admins");
      };
      
      // 집행부 판별 디버깅용 함수
      (window as any).debugClubData = async () => {
        const clubRef = doc(db, "clubs", clubId);
        const clubSnap = await getDoc(clubRef);
        console.log("[club]", clubSnap.exists(), clubSnap.data());
        console.log("[me]", currentUser?.uid);
        
        if (clubSnap.exists()) {
          const clubData = clubSnap.data();
          const isOwner = clubData?.ownerUid === currentUser?.uid;
          const isInAdmins = clubData?.admins && currentUser?.uid in clubData.admins;
          
          console.log("[DEBUG]", {
            isOwner,
            isInAdmins,
            ownerUid: clubData?.ownerUid,
            admins: clubData?.admins,
            myUid: currentUser?.uid
          });
        }
      };
    }
  }, [clubId, currentUser, db]);

  // 디버깅용 콘솔 테스트 함수
  const testCreatePost = async () => {
    if (!currentUser || !clubId) return;
    
    try {
      console.log("[ClubBlogNew] Testing post creation...");
      // 테스트용도 올바른 경로 사용
      const postsCol = collection(db, "clubs", clubId, "blog", "main", "posts");
      console.log("[TEST POST PATH]", postsCol.path); // 테스트 경로 확인용 로그
      
      await addDoc(postsCol, {
        title: "테스트 글",
        content: "본문",
        authorUid: currentUser.uid,
        published: true,
        createdAt: serverTimestamp(),
      });
      console.log("[ClubBlogNew] Test post created successfully!");
    } catch (error) {
      console.error("[ClubBlogNew] Test post creation failed:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title.trim() || !content.trim() || !isAdmin) return;

    setSaving(true);
    try {
      console.log("[ClubBlogNew] Creating post:", {
        clubId,
        uid: currentUser.uid,
        title: title.trim(),
        content: content.trim()
      });

      // blog 경로로 통일: clubs/{clubId}/blog/{postId}
      const postsCol = collection(db, "clubs", clubId, "blog");
      console.log("[POST PATH]", postsCol.path); // 경로 확인용 로그
      
      await addDoc(postsCol, {
        clubId,                 // 디버깅용
        title: title.trim(),
        content: content.trim(),
        authorUid: currentUser.uid,  // 규칙에서 요구하는 필수 필드
        published: true,
        pinned: false,
        createdAt: serverTimestamp(),
      });

      console.log("[ClubBlogNew] Post created successfully");
      alert("글이 발행되었습니다!");
      nav(`/clubs/${clubId}/blog`);
    } catch (error) {
      console.error("[ClubBlogNew] Error creating post:", error);
      console.error("[ClubBlogNew] Error details:", {
        code: error.code,
        message: error.message,
        clubId,
        uid: currentUser.uid
      });
      alert(`글 작성 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <div className="text-center">권한 확인 중...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <div className="text-center text-red-600">
          <h1 className="text-xl font-bold mb-4">권한이 없습니다</h1>
          <p>이 클럽의 집행부만 글을 작성할 수 있습니다.</p>
          {permissionError && (
            <p className="text-sm text-gray-600 mt-2">{permissionError}</p>
          )}
          <div className="mt-4 space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
            >
              새로고침
            </button>
            <button
              onClick={() => nav(`/clubs/${clubId}/blog`)}
              className="px-4 py-2 border rounded"
            >
              ← 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">새 글 쓰기</h1>
        <div className="flex gap-2">
          <button
            onClick={testCreatePost}
            className="px-3 py-1.5 border rounded text-sm bg-yellow-500 text-white"
          >
            테스트 글 생성
          </button>
          <button
            onClick={() => nav(`/clubs/${clubId}/blog`)}
            className="px-3 py-1.5 border rounded text-sm"
          >
            ← 목록으로
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="글 제목을 입력하세요"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border rounded h-64"
            placeholder="글 내용을 입력하세요"
            required
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || !title.trim() || !content.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {saving ? "발행 중..." : "발행하기"}
          </button>
          <button
            type="button"
            onClick={() => nav(`/clubs/${clubId}/blog`)}
            className="px-4 py-2 border rounded"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
