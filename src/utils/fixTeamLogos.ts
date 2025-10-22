import { db, storage } from "../lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";

const defaultLogoUrl = "https://picsum.photos/120/120?random=6";

export async function fixTeamLogos() {
  try {
    console.log("?Ä Î°úÍ≥† URL ?òÏ†ï ?úÏûë...");
    
    const teamsCol = collection(db, "teams");
    const snapshot = await getDocs(teamsCol);

    let updatedCount = 0;

    for (const teamDoc of snapshot.docs) {
      const data = teamDoc.data();
      console.log(`?Ä [${teamDoc.id}] ?ÑÏû¨ logoUrl:`, data.logoUrl);
      
      if (!data.logoUrl || data.logoUrl.trim() === "") {
        await updateDoc(doc(db, "teams", teamDoc.id), {
          logoUrl: defaultLogoUrl,
        });
        console.log(`???Ä [${teamDoc.id}] logoUrl ?ÖÎç∞?¥Ìä∏ ?ÑÎ£å (Í∏∞Î≥∏Í∞?`);
        updatedCount++;
      } else if (data.logoUrl.startsWith("gs://")) {
        // gs:// URL??Í≥µÍ∞ú URLÎ°?Î≥Ä??        try {
          const storageRef = ref(storage, data.logoUrl);
          const publicUrl = await getDownloadURL(storageRef);
          await updateDoc(doc(db, "teams", teamDoc.id), {
            logoUrl: publicUrl,
          });
          console.log(`???Ä [${teamDoc.id}] gs:// URL??Í≥µÍ∞ú URLÎ°?Î≥Ä??`, publicUrl);
          updatedCount++;
        } catch (error) {
          console.error(`???Ä [${teamDoc.id}] gs:// URL Î≥Ä???§Ìå®:`, error);
          console.log(`   ?êÎ≥∏ URL:`, data.logoUrl);
          console.log(`   ?§Î•ò:`, error.message);
          // Î≥Ä???§Ìå® ??Í∏∞Î≥∏Í∞íÏúºÎ°??§Ï†ï
          await updateDoc(doc(db, "teams", teamDoc.id), {
            logoUrl: defaultLogoUrl,
          });
          console.log(`???Ä [${teamDoc.id}] Í∏∞Î≥∏Í∞íÏúºÎ°??§Ï†ï`);
          updatedCount++;
        }
      } else {
        console.log(`??∏è ?Ä [${teamDoc.id}] logoUrl ?¥Î? Í≥µÍ∞ú URL:`, data.logoUrl);
      }
    }

    console.log(`?éâ ?Ä Î°úÍ≥† URL ?òÏ†ï ?ÑÎ£å! ${updatedCount}Í∞??Ä ?ÖÎç∞?¥Ìä∏??);
    return updatedCount;
  } catch (error) {
    console.error("?Ä Î°úÍ≥† URL ?òÏ†ï ?§Ìå®:", error);
    throw error;
  }
}

// Î∏åÎùº?∞Ï? ÏΩòÏÜî?êÏÑú ?§Ìñâ?????àÎèÑÎ°??ÑÏó≠ ?®ÏàòÎ°??±Î°ù
if (typeof window !== 'undefined') {
  (window as any).fixTeamLogos = fixTeamLogos;
}
