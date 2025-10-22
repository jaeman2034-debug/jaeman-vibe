import type { Timestamp } from 'firebase/firestore';

export interface Category {
  id: string;
  slug: string;
  name: string;
  emoji?: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  stats?: {
    totalSubscribers: number;
    totalProducts: number;
    totalGroups: number;
    totalJobs: number;
    totalSlots: number;
  };
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  subscribers: number;
  products: number;
  groups: number;
  jobs: number;
  slots: number;
  lastUpdated: Timestamp;
}

export interface CategoryWithStats extends Category {
  stats: NonNullable<Category['stats']>;
}

export interface CategoryFilters {
  isActive?: boolean;
  parentId?: string;
  search?: string;
}

export interface CategorySort {
  field: 'name' | 'sortOrder' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}
