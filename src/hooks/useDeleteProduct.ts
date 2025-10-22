/**
 * ?—‘ï¸??í’ˆ ?? œ ??(Storage ?ë™ ?•ë¦¬ ?¬í•¨)
 * 
 * ?¬ìš©ë²?
 * ```typescript
 * const { deleteProduct, isDeleting } = useDeleteProduct();
 * 
 * <button onClick={() => deleteProduct(item)}>?? œ</button>
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
   * ?í’ˆ ?„ì „ ?? œ (Storage ?´ë?ì§€ + Firestore ë¬¸ì„œ)
   * 
   * @param item - ?? œ???í’ˆ ê°ì²´ (id, imagePath ?„ë“œ ?„ìš”)
   * @param confirmMessage - ?¬ìš©???•ì¸ ë©”ì‹œì§€ (?µì…˜)
   * @param redirectPath - ?? œ ???´ë™??ê²½ë¡œ (ê¸°ë³¸ê°? /market)
   */
  const deleteProduct = async (
    item: Product, 
    confirmMessage?: string,
    redirectPath?: string
  ) => {
    // ?•ì¸ ë©”ì‹œì§€
    const message = confirmMessage || 
      `?•ë§ë¡?"${item.title || "???í’ˆ"}"???? œ?˜ì‹œê² ìŠµ?ˆê¹Œ?\n\n? ï¸ ?´ë?ì§€?€ ëª¨ë“  ?°ì´?°ê? ?êµ¬?ìœ¼ë¡??? œ?©ë‹ˆ??\n???‘ì—…?€ ?˜ëŒë¦????†ìŠµ?ˆë‹¤.`;
    
    if (!window.confirm(message)) {
      return { success: false, cancelled: true };
    }

    setIsDeleting(true);

    try {
      // ?”¹ 1?¨ê³„: Storage ?´ë?ì§€ ?? œ
      if (item.imagePath || item.imageUrl) {
        try {
          // imagePath ?°ì„  ?¬ìš©
          let storagePath = item.imagePath;
          
          // imagePathê°€ ?†ìœ¼ë©?imageUrl?ì„œ ì¶”ì¶œ
          if (!storagePath && item.imageUrl) {
            const urlMatch = item.imageUrl.match(/o\/(.*?)\?/);
            if (urlMatch) {
              storagePath = decodeURIComponent(urlMatch[1]);
            }
          }

          if (storagePath) {
            const imgRef = ref(storage, storagePath);
            await deleteObject(imgRef);
            console.log("??Storage ?´ë?ì§€ ?? œ ?„ë£Œ:", storagePath);
          }
        } catch (storageError: any) {
          // ?´ë?ì§€ê°€ ?´ë? ?? œ?˜ì—ˆê±°ë‚˜ ?†ëŠ” ê²½ìš° ë¬´ì‹œ
          if (storageError.code === "storage/object-not-found") {
            console.log("?¹ï¸ Storage ?´ë?ì§€ê°€ ?´ë? ?? œ?˜ì—ˆê±°ë‚˜ ì¡´ì¬?˜ì? ?ŠìŠµ?ˆë‹¤.");
          } else {
            console.warn("? ï¸ Storage ?´ë?ì§€ ?? œ ì¤??¤ë¥˜ (ê³„ì† ì§„í–‰):", storageError);
          }
        }
      }

      // ?”¹ 2?¨ê³„: Firestore ë¬¸ì„œ ?? œ
      await deleteDoc(doc(db, "marketItems", item.id));
      console.log("??Firestore ë¬¸ì„œ ?? œ ?„ë£Œ:", item.id);

      // ?±ê³µ ?Œë¦¼
      alert("?í’ˆê³??´ë?ì§€ê°€ ?„ì „???? œ?˜ì—ˆ?µë‹ˆ??");

      // ë¦¬ë‹¤?´ë ‰??      const targetPath = redirectPath || "/market";
      navigate(targetPath);

      return { success: true, cancelled: false };
    } catch (error) {
      console.error("???í’ˆ ?? œ ?¤íŒ¨:", error);
      alert("?? œ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤. ?¤ì‹œ ?œë„?´ì£¼?¸ìš”.");
      return { success: false, cancelled: false, error };
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * ?¬ëŸ¬ ?í’ˆ ?¼ê´„ ?? œ
   * 
   * @param items - ?? œ???í’ˆ ë°°ì—´
   */
  const deleteMultipleProducts = async (items: Product[]) => {
    if (!window.confirm(`${items.length}ê°œì˜ ?í’ˆ???? œ?˜ì‹œê² ìŠµ?ˆê¹Œ?`)) {
      return { success: false, cancelled: true };
    }

    setIsDeleting(true);

    try {
      const results = await Promise.allSettled(
        items.map(async (item) => {
          // Storage ?´ë?ì§€ ?? œ
          if (item.imagePath) {
            try {
              const imgRef = ref(storage, item.imagePath);
              await deleteObject(imgRef);
            } catch (error) {
              console.warn("Storage ?? œ ?¤íŒ¨:", item.id, error);
            }
          }

          // Firestore ë¬¸ì„œ ?? œ
          await deleteDoc(doc(db, "marketItems", item.id));
        })
      );

      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failCount = results.filter((r) => r.status === "rejected").length;

      console.log(`???¼ê´„ ?? œ ?„ë£Œ: ${successCount}ê°??±ê³µ, ${failCount}ê°??¤íŒ¨`);
      alert(`${successCount}ê°œì˜ ?í’ˆ???? œ?˜ì—ˆ?µë‹ˆ??${failCount > 0 ? `\n(${failCount}ê°??¤íŒ¨)` : ""}`);

      return { success: true, successCount, failCount };
    } catch (error) {
      console.error("???¼ê´„ ?? œ ?¤íŒ¨:", error);
      alert("?¼ê´„ ?? œ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
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

