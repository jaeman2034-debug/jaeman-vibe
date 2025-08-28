export type ProductImage = { path: string; url: string; w?: number; h?: number };

export type Product = {
  id: string;
  title: string;
  price?: number;
  desc?: string;
  category?: string;
  cover?: string;
  images?: ProductImage[];
  hasImages?: boolean;
  loc?: { lat: number; lng: number } | null;
  dong?: string | null;
  ownerId: string;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any;
};

export type Group = {
  id: string;
  title: string;
  desc?: string;
  category?: string;
  maxMembers?: number;
  currentMembers?: number;
  loc?: { lat: number; lng: number } | null;
  dong?: string | null;
  ownerId: string;
  createdAt?: any;
  updatedAt?: any;
};

export type Job = {
  id: string;
  title: string;
  company?: string;
  type: 'fulltime' | 'parttime' | 'coach' | 'etc';
  salaryMin?: number;
  salaryMax?: number;
  contact?: string;
  desc?: string;
  loc?: { lat: number; lng: number } | null;
  dong?: string | null;
  ownerId: string;
  createdAt?: any;
  updatedAt?: any;
};
