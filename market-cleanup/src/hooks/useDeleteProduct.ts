/**
 * ?뿊截??곹뭹 ??젣 ??(Storage ?먮룞 ?뺣━ ?ы븿)
 * 
 * ?ъ슜踰?
 * ```typescript
 * const { deleteProduct, isDeleting } = useDeleteProduct();
 * 
 * <button onClick={() => deleteProduct(item)}>??젣</button>
 * ```
 */

import { deleteDoc, doc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getApp, initializeApp, getApps } from "firebase/app";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export interface Product {
  id: string;
  title?: string;
  imageUrl?: string;
  imagePath?: string;
  [key: string]: any;
}

export function useDeleteProduct() {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * ?곹뭹 ?꾩쟾 ??젣 (Storage ?대?吏 + Firestore 臾몄꽌)
   * 
   * @param item - ??젣???곹뭹 媛앹껜 (id, imagePath ?꾨뱶 ?꾩슂)
   * @param confirmMessage - ?ъ슜???뺤씤 硫붿떆吏 (?듭뀡)
   * @param redirectPath - ??젣 ???대룞??寃쎈줈 (湲곕낯媛? /market)
   */
  const deleteProduct = async (
    item: Product, 
    confirmMessage?: string,
    redirectPath?: string
  ) => {
    // ?뺤씤 硫붿떆吏
    const message = confirmMessage || 
      `?뺣쭚濡?"${item.title || "???곹뭹"}"????젣?섏떆寃좎뒿?덇퉴?\n\n?좑툘 ?대?吏? 紐⑤뱺 ?곗씠?곌? ?곴뎄?곸쑝濡???젣?⑸땲??\n???묒뾽? ?섎룎由????놁뒿?덈떎.`;
    
    if (!window.confirm(message)) {
      return { success: false, cancelled: true };
    }

    setIsDeleting(true);

    try {
      // ?뵻 1?④퀎: Storage ?대?吏 ??젣
      if (item.imagePath || item.imageUrl) {
        try {
          // imagePath ?곗꽑 ?ъ슜
          let storagePath = item.imagePath;
          
          // imagePath媛 ?놁쑝硫?imageUrl?먯꽌 異붿텧
          if (!storagePath && item.imageUrl) {
            const urlMatch = item.imageUrl.match(/o\/(.*?)\?/);
            if (urlMatch) {
              storagePath = decodeURIComponent(urlMatch[1]);
            }
          }

          if (storagePath) {
            const imgRef = ref(storage, storagePath);
            await deleteObject(imgRef);
            console.log("??Storage ?대?吏 ??젣 ?꾨즺:", storagePath);
          }
        } catch (storageError: any) {
          // ?대?吏媛 ?대? ??젣?섏뿀嫄곕굹 ?녿뒗 寃쎌슦 臾댁떆
          if (storageError.code === "storage/object-not-found") {
            console.log("?뱄툘 Storage ?대?吏媛 ?대? ??젣?섏뿀嫄곕굹 議댁옱?섏? ?딆뒿?덈떎.");
          } else {
            console.warn("?좑툘 Storage ?대?吏 ??젣 以??ㅻ쪟 (怨꾩냽 吏꾪뻾):", storageError);
          }
        }
      }

      // ?뵻 2?④퀎: Firestore 臾몄꽌 ??젣
      await deleteDoc(doc(db, "marketItems", item.id));
      console.log("??Firestore 臾몄꽌 ??젣 ?꾨즺:", item.id);

      // ?깃났 ?뚮┝
      alert("?곹뭹怨??대?吏媛 ?꾩쟾????젣?섏뿀?듬땲??");

      // 由щ떎?대젆??      const targetPath = redirectPath || "/market";
      navigate(targetPath);

      return { success: true, cancelled: false };
    } catch (error) {
      console.error("???곹뭹 ??젣 ?ㅽ뙣:", error);
      alert("??젣 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎. ?ㅼ떆 ?쒕룄?댁＜?몄슂.");
      return { success: false, cancelled: false, error };
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * ?щ윭 ?곹뭹 ?쇨큵 ??젣
   * 
   * @param items - ??젣???곹뭹 諛곗뿴
   */
  const deleteMultipleProducts = async (items: Product[]) => {
    if (!window.confirm(`${items.length}媛쒖쓽 ?곹뭹????젣?섏떆寃좎뒿?덇퉴?`)) {
      return { success: false, cancelled: true };
    }

    setIsDeleting(true);

    try {
      const results = await Promise.allSettled(
        items.map(async (item) => {
          // Storage ?대?吏 ??젣
          if (item.imagePath) {
            try {
              const imgRef = ref(storage, item.imagePath);
              await deleteObject(imgRef);
            } catch (error) {
              console.warn("Storage ??젣 ?ㅽ뙣:", item.id, error);
            }
          }

          // Firestore 臾몄꽌 ??젣
          await deleteDoc(doc(db, "marketItems", item.id));
        })
      );

      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failCount = results.filter((r) => r.status === "rejected").length;

      console.log(`???쇨큵 ??젣 ?꾨즺: ${successCount}媛??깃났, ${failCount}媛??ㅽ뙣`);
      alert(`${successCount}媛쒖쓽 ?곹뭹????젣?섏뿀?듬땲??${failCount > 0 ? `\n(${failCount}媛??ㅽ뙣)` : ""}`);

      return { success: true, successCount, failCount };
    } catch (error) {
      console.error("???쇨큵 ??젣 ?ㅽ뙣:", error);
      alert("?쇨큵 ??젣 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.");
      return { success: false, error };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteProduct,
    deleteMultipleProducts,
    isDeleting,
  };
}

