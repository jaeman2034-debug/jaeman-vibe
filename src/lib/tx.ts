import { getFirestore, addDoc, collection, serverTimestamp } from "firebase/firestore";

export type TxCreateInput = {
  itemId: string;
  buyerUid: string;
  sellerUid?: string | null;
  amount?: number | null;
  locationSnapshot?: { lat: number; lng: number; address?: string } | null;
  itemSnapshot?: {
    title: string;
    price: number;
    category?: string;
    imageUrl?: string;
  };
  buyerInfo?: {
    uid: string;
    requestTime: string;
  };
};

export async function createTransaction(db = getFirestore(), input: TxCreateInput) {
  const docRef = await addDoc(collection(db, "transactions"), {
    ...input,
    status: "REQUESTED", // REQUESTED ??CHATTING ??MEETUP ??COMPLETED/CANCELED
    type: "C2C",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export type TransactionStatus = 
  | "REQUESTED"    // 거래 ?�청??  | "CHATTING"      // 채팅 �?  | "MEETUP"        // 만남 ?�속??  | "COMPLETED"     // 거래 ?�료
  | "CANCELED";     // 거래 취소

export type Transaction = {
  id: string;
  itemId: string;
  buyerUid: string;
  sellerUid?: string | null;
  amount?: number | null;
  status: TransactionStatus;
  type: "C2C";
  locationSnapshot?: { lat: number; lng: number; address?: string } | null;
  itemSnapshot?: {
    title: string;
    price: number;
    category?: string;
    imageUrl?: string;
  };
  buyerInfo?: {
    uid: string;
    requestTime: string;
  };
  createdAt: any;
  updatedAt?: any;
  completedAt?: any;
  canceledAt?: any;
};

// 거래 ?�태�??��? ?�시
export const getStatusText = (status: TransactionStatus): string => {
  switch (status) {
    case "REQUESTED": return "거래 ?�청??;
    case "CHATTING": return "채팅 �?;
    case "MEETUP": return "만남 ?�속??;
    case "COMPLETED": return "거래 ?�료";
    case "CANCELED": return "거래 취소";
    default: return "?????�음";
  }
};

// 거래 ?�태�??�상
export const getStatusColor = (status: TransactionStatus): string => {
  switch (status) {
    case "REQUESTED": return "bg-blue-100 text-blue-700";
    case "CHATTING": return "bg-yellow-100 text-yellow-700";
    case "MEETUP": return "bg-purple-100 text-purple-700";
    case "COMPLETED": return "bg-green-100 text-green-700";
    case "CANCELED": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
};
