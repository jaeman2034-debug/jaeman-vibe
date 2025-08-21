export type RegionInfo = {
  si?: string; gu?: string; dong?: string;
  full?: string; provider?: "kakao" | "none";
};

export type ProductDoc = {
  title: string;
  price: number;
  description?: string;
  images?: string[];
  sellerId: string;
  status: "active" | "sold";
  createdAt?: any;
  updatedAt?: any;
  location?: import("firebase/firestore").GeoPoint;
  region?: RegionInfo;
}; 