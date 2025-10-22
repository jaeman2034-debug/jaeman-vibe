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

// ?�기 ?�성
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

    // ?�설 ?�점 ?�데?�트 ?�리�?(Cloud Function?�서 처리)
    console.log("?�기 ?�성 ?�료:", reviewRef.id);
    return reviewRef.id;
  } catch (error) {
    console.error("?�기 ?�성 ?�패:", error);
    throw new Error("?�기 ?�성???�패?�습?�다.");
  }
}

// ?�기 ?�정
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

    // ?�설 ?�점 ?�데?�트 ?�리�?(Cloud Function?�서 처리)
    console.log("?�기 ?�정 ?�료:", reviewId);
  } catch (error) {
    console.error("?�기 ?�정 ?�패:", error);
    throw new Error("?�기 ?�정???�패?�습?�다.");
  }
}

// ?�기 ??��
export async function deleteReview(reviewId: string): Promise<void> {
  try {
    const reviewRef = doc(db, "reviews", reviewId);
    await updateDoc(reviewRef, {
      status: "deleted",
      updatedAt: Timestamp.now()
    });

    // ?�설 ?�점 ?�데?�트 ?�리�?(Cloud Function?�서 처리)
    console.log("?�기 ??�� ?�료:", reviewId);
  } catch (error) {
    console.error("?�기 ??�� ?�패:", error);
    throw new Error("?�기 ??��???�패?�습?�다.");
  }
}

// ?�기 조회 (?�일)
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
    console.error("?�기 조회 ?�패:", error);
    throw new Error("?�기�?불러?????�습?�다.");
  }
}

// ?�설�??�기 목록 조회
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

      // ?�용???�보 조회 (간단???�보�?
      try {
        const userRef = doc(db, "users", data.userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        reviews.push({
          review,
          user: {
            uid: data.userId,
            displayName: userData?.displayName || "?�용??,
            photoURL: userData?.photoURL
          }
        });
      } catch (userError) {
        // ?�용???�보 조회 ?�패 ??기본�??�용
        reviews.push({
          review,
          user: {
            uid: data.userId,
            displayName: "?�용??,
            photoURL: undefined
          }
        });
      }
    }

    return reviews;
  } catch (error) {
    console.error("?�설 ?�기 조회 ?�패:", error);
    throw new Error("?�기�?불러?????�습?�다.");
  }
}

// ?�용?�별 ?�기 목록 조회
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
    console.error("?�용???�기 조회 ?�패:", error);
    throw new Error("?�기�?불러?????�습?�다.");
  }
}

// ?�기 ?�성 가???��? ?�인
export async function checkReviewEligibility(
  facilityId: string,
  userId: string
): Promise<ReviewEligibility> {
  try {
    // 1. ?�당 ?�설?�서 출석???�약???�는지 ?�인
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
        reason: "?�당 ?�설?�서 출석???�약???�습?�다."
      };
    }

    // 2. ?��? ?�기�??�성?�는지 ?�인
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
        reason: "?��? ?�기�??�성?�습?�다.",
        reservationId: existingReview.data().reservationId,
        slotId: existingReview.data().slotId,
        facilityId
      };
    }

    // 3. 가??최근 출석???�약 ?�보 반환
    const latestReservation = reservationsSnap.docs[0];
    const reservationData = latestReservation.data();

    return {
      canReview: true,
      reservationId: latestReservation.id,
      slotId: reservationData.slotId,
      facilityId
    };
  } catch (error) {
    console.error("?�기 ?�성 가???��? ?�인 ?�패:", error);
    return {
      canReview: false,
      reason: "?�인 �??�류가 발생?�습?�다."
    };
  }
}

// ?�기 ?��????�시/?�제
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
        throw new Error("?�기�?찾을 ???�습?�다.");
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

    console.log("?�기 ?��????�태 ?�데?�트 ?�료");
  } catch (error) {
    console.error("?�기 ?��????�태 ?�데?�트 ?�패:", error);
    throw new Error("?�태 ?�데?�트???�패?�습?�다.");
  }
}

// ?�기 ?�고
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

    // ?�기 ?�태�??�고?�으�??�데?�트
    const reviewRef = doc(db, "reviews", reviewId);
    await updateDoc(reviewRef, {
      reported: true
    });

    console.log("?�기 ?�고 ?�료");
  } catch (error) {
    console.error("?�기 ?�고 ?�패:", error);
    throw new Error("?�고 처리???�패?�습?�다.");
  }
}

// ?�시�??�기 ?�데?�트 구독
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

      // ?�용???�보??간단?�게 처리
      reviews.push({
        review,
        user: {
          uid: data.userId,
          displayName: "?�용??,
          photoURL: undefined
        }
      });
    }

    callback(reviews);
  });
}
