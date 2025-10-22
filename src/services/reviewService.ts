import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  runTransaction,
  writeBatch,
  onSnapshot,
  QuerySnapshot,
  DocumentData
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Review, ReviewFormData, ReviewWithUser, ReviewEligibility } from "@/types/review";

// ?„ê¸° ?‘ì„±
export async function createReview(
  facilityId: string,
  slotId: string,
  reservationId: string,
  userId: string,
  reviewData: ReviewFormData
): Promise<string> {
  try {
    const reviewRef = await addDoc(collection(db, "reviews"), {
      facilityId,
      slotId,
      reservationId,
      userId,
      rating: reviewData.rating,
      comment: reviewData.comment,
      createdAt: Timestamp.now(),
      helpfulCount: 0,
      reported: false,
      status: "active"
    });

    // ?œì„¤ ?‰ì  ?…ë°?´íŠ¸ ?¸ë¦¬ê±?(Cloud Function?ì„œ ì²˜ë¦¬)
    console.log("?„ê¸° ?‘ì„± ?„ë£Œ:", reviewRef.id);
    return reviewRef.id;
  } catch (error) {
    console.error("?„ê¸° ?‘ì„± ?¤íŒ¨:", error);
    throw new Error("?„ê¸° ?‘ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
  }
}

// ?„ê¸° ?˜ì •
export async function updateReview(
  reviewId: string,
  reviewData: ReviewFormData
): Promise<void> {
  try {
    const reviewRef = doc(db, "reviews", reviewId);
    await updateDoc(reviewRef, {
      rating: reviewData.rating,
      comment: reviewData.comment,
      updatedAt: Timestamp.now()
    });

    // ?œì„¤ ?‰ì  ?…ë°?´íŠ¸ ?¸ë¦¬ê±?(Cloud Function?ì„œ ì²˜ë¦¬)
    console.log("?„ê¸° ?˜ì • ?„ë£Œ:", reviewId);
  } catch (error) {
    console.error("?„ê¸° ?˜ì • ?¤íŒ¨:", error);
    throw new Error("?„ê¸° ?˜ì •???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
  }
}

// ?„ê¸° ?? œ
export async function deleteReview(reviewId: string): Promise<void> {
  try {
    const reviewRef = doc(db, "reviews", reviewId);
    await updateDoc(reviewRef, {
      status: "deleted",
      updatedAt: Timestamp.now()
    });

    // ?œì„¤ ?‰ì  ?…ë°?´íŠ¸ ?¸ë¦¬ê±?(Cloud Function?ì„œ ì²˜ë¦¬)
    console.log("?„ê¸° ?? œ ?„ë£Œ:", reviewId);
  } catch (error) {
    console.error("?„ê¸° ?? œ ?¤íŒ¨:", error);
    throw new Error("?„ê¸° ?? œ???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
  }
}

// ?„ê¸° ì¡°íšŒ (?¨ì¼)
export async function getReview(reviewId: string): Promise<Review | null> {
  try {
    const reviewRef = doc(db, "reviews", reviewId);
    const reviewSnap = await getDoc(reviewRef);
    
    if (reviewSnap.exists()) {
      const data = reviewSnap.data();
      return {
        id: reviewSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Review;
    }
    
    return null;
  } catch (error) {
    console.error("?„ê¸° ì¡°íšŒ ?¤íŒ¨:", error);
    throw new Error("?„ê¸°ë¥?ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.");
  }
}

// ?œì„¤ë³??„ê¸° ëª©ë¡ ì¡°íšŒ
export async function getFacilityReviews(
  facilityId: string,
  limitCount: number = 20,
  lastReview?: Review
): Promise<ReviewWithUser[]> {
  try {
    let q = query(
      collection(db, "reviews"),
      where("facilityId", "==", facilityId),
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    if (lastReview) {
      q = query(
        collection(db, "reviews"),
        where("facilityId", "==", facilityId),
        where("status", "==", "active"),
        orderBy("createdAt", "desc"),
        startAfter(Timestamp.fromDate(lastReview.createdAt)),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);
    const reviews: ReviewWithUser[] = [];

    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      const review: Review = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };

      // ?¬ìš©???•ë³´ ì¡°íšŒ (ê°„ë‹¨???•ë³´ë§?
      try {
        const userRef = doc(db, "users", data.userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        reviews.push({
          review,
          user: {
            uid: data.userId,
            displayName: userData?.displayName || "?¬ìš©??,
            photoURL: userData?.photoURL
          }
        });
      } catch (userError) {
        // ?¬ìš©???•ë³´ ì¡°íšŒ ?¤íŒ¨ ??ê¸°ë³¸ê°??¬ìš©
        reviews.push({
          review,
          user: {
            uid: data.userId,
            displayName: "?¬ìš©??,
            photoURL: undefined
          }
        });
      }
    }

    return reviews;
  } catch (error) {
    console.error("?œì„¤ ?„ê¸° ì¡°íšŒ ?¤íŒ¨:", error);
    throw new Error("?„ê¸°ë¥?ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.");
  }
}

// ?¬ìš©?ë³„ ?„ê¸° ëª©ë¡ ì¡°íšŒ
export async function getUserReviews(userId: string): Promise<Review[]> {
  try {
    const q = query(
      collection(db, "reviews"),
      where("userId", "==", userId),
      where("status", "in", ["active", "hidden"]),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const reviews: Review[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Review);
    });

    return reviews;
  } catch (error) {
    console.error("?¬ìš©???„ê¸° ì¡°íšŒ ?¤íŒ¨:", error);
    throw new Error("?„ê¸°ë¥?ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.");
  }
}

// ?„ê¸° ?‘ì„± ê°€???¬ë? ?•ì¸
export async function checkReviewEligibility(
  facilityId: string,
  userId: string
): Promise<ReviewEligibility> {
  try {
    // 1. ?´ë‹¹ ?œì„¤?ì„œ ì¶œì„???ˆì•½???ˆëŠ”ì§€ ?•ì¸
    const reservationsQuery = query(
      collection(db, "reservations"),
      where("facilityId", "==", facilityId),
      where("userId", "==", userId),
      where("status", "==", "attended")
    );

    const reservationsSnap = await getDocs(reservationsQuery);
    
    if (reservationsSnap.empty) {
      return {
        canReview: false,
        reason: "?´ë‹¹ ?œì„¤?ì„œ ì¶œì„???ˆì•½???†ìŠµ?ˆë‹¤."
      };
    }

    // 2. ?´ë? ?„ê¸°ë¥??‘ì„±?ˆëŠ”ì§€ ?•ì¸
    const reviewsQuery = query(
      collection(db, "reviews"),
      where("facilityId", "==", facilityId),
      where("userId", "==", userId),
      where("status", "in", ["active", "hidden"])
    );

    const reviewsSnap = await getDocs(reviewsQuery);
    
    if (!reviewsSnap.empty) {
      const existingReview = reviewsSnap.docs[0];
      return {
        canReview: false,
        reason: "?´ë? ?„ê¸°ë¥??‘ì„±?ˆìŠµ?ˆë‹¤.",
        reservationId: existingReview.data().reservationId,
        slotId: existingReview.data().slotId,
        facilityId
      };
    }

    // 3. ê°€??ìµœê·¼ ì¶œì„???ˆì•½ ?•ë³´ ë°˜í™˜
    const latestReservation = reservationsSnap.docs[0];
    const reservationData = latestReservation.data();

    return {
      canReview: true,
      reservationId: latestReservation.id,
      slotId: reservationData.slotId,
      facilityId
    };
  } catch (error) {
    console.error("?„ê¸° ?‘ì„± ê°€???¬ë? ?•ì¸ ?¤íŒ¨:", error);
    return {
      canReview: false,
      reason: "?•ì¸ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤."
    };
  }
}

// ?„ê¸° ?„ì????œì‹œ/?´ì œ
export async function toggleReviewHelpful(
  reviewId: string,
  userId: string,
  helpful: boolean
): Promise<void> {
  try {
    const reviewRef = doc(db, "reviews", reviewId);
    const helpfulRef = doc(db, "review_helpful", `${reviewId}_${userId}`);

    await runTransaction(db, async (transaction) => {
      const reviewSnap = await transaction.get(reviewRef);
      if (!reviewSnap.exists()) {
        throw new Error("?„ê¸°ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤.");
      }

      const currentHelpfulCount = reviewSnap.data().helpfulCount || 0;
      const newHelpfulCount = helpful 
        ? currentHelpfulCount + 1 
        : Math.max(0, currentHelpfulCount - 1);

      transaction.update(reviewRef, {
        helpfulCount: newHelpfulCount
      });

      transaction.set(helpfulRef, {
        reviewId,
        userId,
        helpful,
        createdAt: Timestamp.now()
      });
    });

    console.log("?„ê¸° ?„ì????íƒœ ?…ë°?´íŠ¸ ?„ë£Œ");
  } catch (error) {
    console.error("?„ê¸° ?„ì????íƒœ ?…ë°?´íŠ¸ ?¤íŒ¨:", error);
    throw new Error("?íƒœ ?…ë°?´íŠ¸???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
  }
}

// ?„ê¸° ? ê³ 
export async function reportReview(
  reviewId: string,
  reporterId: string,
  reason: string,
  description?: string
): Promise<void> {
  try {
    const reportRef = doc(db, "review_reports");
    await addDoc(collection(db, "review_reports"), {
      reviewId,
      reporterId,
      reason,
      description,
      status: "pending",
      createdAt: Timestamp.now()
    });

    // ?„ê¸° ?íƒœë¥?? ê³ ?¨ìœ¼ë¡??…ë°?´íŠ¸
    const reviewRef = doc(db, "reviews", reviewId);
    await updateDoc(reviewRef, {
      reported: true
    });

    console.log("?„ê¸° ? ê³  ?„ë£Œ");
  } catch (error) {
    console.error("?„ê¸° ? ê³  ?¤íŒ¨:", error);
    throw new Error("? ê³  ì²˜ë¦¬???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
  }
}

// ?¤ì‹œê°??„ê¸° ?…ë°?´íŠ¸ êµ¬ë…
export function subscribeToFacilityReviews(
  facilityId: string,
  callback: (reviews: ReviewWithUser[]) => void
): () => void {
  const q = query(
    collection(db, "reviews"),
    where("facilityId", "==", facilityId),
    where("status", "==", "active"),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  return onSnapshot(q, async (snapshot: QuerySnapshot<DocumentData>) => {
    const reviews: ReviewWithUser[] = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const review: Review = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };

      // ?¬ìš©???•ë³´??ê°„ë‹¨?˜ê²Œ ì²˜ë¦¬
      reviews.push({
        review,
        user: {
          uid: data.userId,
          displayName: "?¬ìš©??,
          photoURL: undefined
        }
      });
    }

    callback(reviews);
  });
}
