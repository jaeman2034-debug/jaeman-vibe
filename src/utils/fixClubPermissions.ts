import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 클럽 권한 확인 및 수정 유틸리티
export async function checkAndFixClubPermissions(clubId: string) {
  const db = getFirestore();
  const { currentUser } = getAuth();
  
  if (!currentUser) {
    throw new Error("로그인이 필요합니다.");
  }

  console.log("[fixClubPermissions] Checking club:", clubId);
  console.log("[fixClubPermissions] Current user UID:", currentUser.uid);

  try {
    // 1. 클럽 문서 확인
    const clubDoc = await getDoc(doc(db, "clubs", clubId));
    if (!clubDoc.exists()) {
      throw new Error("클럽을 찾을 수 없습니다.");
    }

    const clubData = clubDoc.data();
    console.log("[fixClubPermissions] Current club data:", clubData);

    // 2. 권한 확인
    const isOwner = clubData.ownerUid === currentUser.uid || clubData.ownerId === currentUser.uid;
    const isAdmin = isOwner || 
      (Array.isArray(clubData.admins) && clubData.admins.includes(currentUser.uid)) ||
      (clubData.admins && typeof clubData.admins === "object" && clubData.admins[currentUser.uid]);

    console.log("[fixClubPermissions] Permission check:", {
      isOwner,
      isAdmin,
      ownerUid: clubData.ownerUid,
      ownerId: clubData.ownerId,
      admins: clubData.admins
    });

    if (isAdmin) {
      console.log("[fixClubPermissions] Already has admin permissions");
      return { success: true, message: "이미 관리자 권한이 있습니다." };
    }

    // 3. 권한 수정 (ownerUid 설정 + admins에 추가)
    const updateData: any = {};
    
    if (!clubData.ownerUid && !clubData.ownerId) {
      updateData.ownerUid = currentUser.uid;
    }

    if (Array.isArray(clubData.admins)) {
      if (!clubData.admins.includes(currentUser.uid)) {
        updateData.admins = arrayUnion(currentUser.uid);
      }
    } else if (clubData.admins && typeof clubData.admins === "object") {
      if (!clubData.admins[currentUser.uid]) {
        updateData[`admins.${currentUser.uid}`] = true;
      }
    } else {
      // admins가 없거나 잘못된 형태인 경우 새로 생성
      updateData.admins = { [currentUser.uid]: true };
    }

    if (Object.keys(updateData).length > 0) {
      console.log("[fixClubPermissions] Updating club with:", updateData);
      await updateDoc(doc(db, "clubs", clubId), updateData);
      console.log("[fixClubPermissions] Club permissions updated successfully");
      return { success: true, message: "권한이 수정되었습니다." };
    } else {
      return { success: true, message: "권한 수정이 필요하지 않습니다." };
    }

  } catch (error) {
    console.error("[fixClubPermissions] Error:", error);
    throw error;
  }
}

// 브라우저 콘솔에서 쉽게 사용할 수 있는 글로벌 함수
if (typeof window !== "undefined") {
  (window as any).fixClubPermissions = checkAndFixClubPermissions;
  (window as any).getCurrentUID = () => getAuth().currentUser?.uid;
}
