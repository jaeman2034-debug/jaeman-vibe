/**
 * ?���??�품 ??�� ??(Storage ?�동 ?�리 ?�함)
 * 
 * ?�용�?
 * ```typescript
 * const { deleteProduct, isDeleting } = useDeleteProduct();
 * 
 * <button onClick={() => deleteProduct(item)}>??��</button>
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
   * ?�품 ?�전 ??�� (Storage ?��?지 + Firestore 문서)
   * 
   * @param item - ??��???�품 객체 (id, imagePath ?�드 ?�요)
   * @param confirmMessage - ?�용???�인 메시지 (?�션)
   * @param redirectPath - ??�� ???�동??경로 (기본�? /market)
   */
  const deleteProduct = async (
    item: Product, 
    confirmMessage?: string,
    redirectPath?: string
  ) => {
    // ?�인 메시지
    const message = confirmMessage || 
      `?�말�?"${item.title || "???�품"}"????��?�시겠습?�까?\n\n?�️ ?��?지?� 모든 ?�이?��? ?�구?�으�???��?�니??\n???�업?� ?�돌�????�습?�다.`;
    
    if (!window.confirm(message)) {
      return { success: false, cancelled: true };
    }

    setIsDeleting(true);

    try {
      // ?�� 1?�계: Storage ?��?지 ??��
      if (item.imagePath || item.imageUrl) {
        try {
          // imagePath ?�선 ?�용
          let storagePath = item.imagePath;
          
          // imagePath가 ?�으�?imageUrl?�서 추출
          if (!storagePath && item.imageUrl) {
            const urlMatch = item.imageUrl.match(/o\/(.*?)\?/);
            if (urlMatch) {
              storagePath = decodeURIComponent(urlMatch[1]);
            }
          }

          if (storagePath) {
            const imgRef = ref(storage, storagePath);
            await deleteObject(imgRef);
            console.log("??Storage ?��?지 ??�� ?�료:", storagePath);
          }
        } catch (storageError: any) {
          // ?��?지가 ?��? ??��?�었거나 ?�는 경우 무시
          if (storageError.code === "storage/object-not-found") {
            console.log("?�️ Storage ?��?지가 ?��? ??��?�었거나 존재?��? ?�습?�다.");
          } else {
            console.warn("?�️ Storage ?��?지 ??�� �??�류 (계속 진행):", storageError);
          }
        }
      }

      // ?�� 2?�계: Firestore 문서 ??��
      await deleteDoc(doc(db, "marketItems", item.id));
      console.log("??Firestore 문서 ??�� ?�료:", item.id);

      // ?�공 ?�림
      alert("?�품�??��?지가 ?�전????��?�었?�니??");

      // 리다?�렉??      const targetPath = redirectPath || "/market";
      navigate(targetPath);

      return { success: true, cancelled: false };
    } catch (error) {
      console.error("???�품 ??�� ?�패:", error);
      alert("??�� �??�류가 발생?�습?�다. ?�시 ?�도?�주?�요.");
      return { success: false, cancelled: false, error };
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * ?�러 ?�품 ?�괄 ??��
   * 
   * @param items - ??��???�품 배열
   */
  const deleteMultipleProducts = async (items: Product[]) => {
    if (!window.confirm(`${items.length}개의 ?�품????��?�시겠습?�까?`)) {
      return { success: false, cancelled: true };
    }

    setIsDeleting(true);

    try {
      const results = await Promise.allSettled(
        items.map(async (item) => {
          // Storage ?��?지 ??��
          if (item.imagePath) {
            try {
              const imgRef = ref(storage, item.imagePath);
              await deleteObject(imgRef);
            } catch (error) {
              console.warn("Storage ??�� ?�패:", item.id, error);
            }
          }

          // Firestore 문서 ??��
          await deleteDoc(doc(db, "marketItems", item.id));
        })
      );

      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failCount = results.filter((r) => r.status === "rejected").length;

      console.log(`???�괄 ??�� ?�료: ${successCount}�??�공, ${failCount}�??�패`);
      alert(`${successCount}개의 ?�품????��?�었?�니??${failCount > 0 ? `\n(${failCount}�??�패)` : ""}`);

      return { success: true, successCount, failCount };
    } catch (error) {
      console.error("???�괄 ??�� ?�패:", error);
      alert("?�괄 ??�� �??�류가 발생?�습?�다.");
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

