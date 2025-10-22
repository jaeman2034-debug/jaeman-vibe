import { db, storage } from "../lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";

const defaultLogoUrl = "https://picsum.photos/120/120?random=6";

export async function fixTeamLogos() {
  try {
    console.log("?� 로고 URL ?�정 ?�작...");
    
    const teamsCol = collection(db, "teams");
    const snapshot = await getDocs(teamsCol);

    let updatedCount = 0;

    for (const teamDoc of snapshot.docs) {
      const data = teamDoc.data();
      console.log(`?� [${teamDoc.id}] ?�재 logoUrl:`, data.logoUrl);
      
      if (!data.logoUrl || data.logoUrl.trim() === "") {
        await updateDoc(doc(db, "teams", teamDoc.id), {
          logoUrl: defaultLogoUrl,
        });
        console.log(`???� [${teamDoc.id}] logoUrl ?�데?�트 ?�료 (기본�?`);
        updatedCount++;
      } else if (data.logoUrl.startsWith("gs://")) {
        // gs:// URL??공개 URL�?변??        try {
          const storageRef = ref(storage, data.logoUrl);
          const publicUrl = await getDownloadURL(storageRef);
          await updateDoc(doc(db, "teams", teamDoc.id), {
            logoUrl: publicUrl,
          });
          console.log(`???� [${teamDoc.id}] gs:// URL??공개 URL�?변??`, publicUrl);
          updatedCount++;
        } catch (error) {
          console.error(`???� [${teamDoc.id}] gs:// URL 변???�패:`, error);
          console.log(`   ?�본 URL:`, data.logoUrl);
          console.log(`   ?�류:`, error.message);
          // 변???�패 ??기본값으�??�정
          await updateDoc(doc(db, "teams", teamDoc.id), {
            logoUrl: defaultLogoUrl,
          });
          console.log(`???� [${teamDoc.id}] 기본값으�??�정`);
          updatedCount++;
        }
      } else {
        console.log(`??�� ?� [${teamDoc.id}] logoUrl ?��? 공개 URL:`, data.logoUrl);
      }
    }

    console.log(`?�� ?� 로고 URL ?�정 ?�료! ${updatedCount}�??� ?�데?�트??);
    return updatedCount;
  } catch (error) {
    console.error("?� 로고 URL ?�정 ?�패:", error);
    throw error;
  }
}

// 브라?��? 콘솔?�서 ?�행?????�도�??�역 ?�수�??�록
if (typeof window !== 'undefined') {
  (window as any).fixTeamLogos = fixTeamLogos;
}
