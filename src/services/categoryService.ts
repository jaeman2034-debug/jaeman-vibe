import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  type QueryConstraint,
  type DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Category, CategoryStats, CategoryFilters, CategorySort } from '@/types/category';
import { createDoc, updateDoc, deleteDoc } from '@/lib/createDoc';

/**
 * Fetch all categories with optional filtering and sorting
 */
export async function getCategories(
  filters?: CategoryFilters,
  sort?: CategorySort
): Promise<Category[]> {
  try {
    const constraints: QueryConstraint[] = [];
    
    // Apply filters
    if (filters?.isActive !== undefined) {
      constraints.push(where('isActive', '==', filters.isActive));
    }
    if (filters?.parentId !== undefined) {
      constraints.push(where('parentId', '==', filters.parentId));
    }
    
    // Apply sorting
    if (sort) {
      constraints.push(orderBy(sort.field, sort.direction));
    } else {
      constraints.push(orderBy('sortOrder', 'asc'));
    }
    
    const q = query(collection(db, 'categories'), ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Category[];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

/**
 * Fetch a single category by ID
 */
export async function getCategory(id: string): Promise<Category | null> {
  try {
    const docRef = doc(db, 'categories', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Category;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
}

/**
 * Fetch a category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const q = query(
      collection(db, 'categories'),
      where('slug', '==', slug),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Category;
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    throw error;
  }
}

/**
 * Create a new category
 */
export async function createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const result = await createDoc({
    collection: 'categories',
    data,
  });
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to create category');
  }
  
  return result.id!;
}

/**
 * Update an existing category
 */
export async function updateCategory(id: string, data: Partial<Category>): Promise<void> {
  const result = await updateDoc('categories', id, data);
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to update category');
  }
}

/**
 * Delete a category (soft delete)
 */
export async function deleteCategory(id: string): Promise<void> {
  const result = await deleteDoc('categories', id);
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete category');
  }
}

/**
 * Get category statistics including counts of related items
 */
export async function getCategoryStats(categoryId: string): Promise<CategoryStats | null> {
  try {
    // Get category info
    const category = await getCategory(categoryId);
    if (!category) return null;
    
    // Count products
    const productsQuery = query(
      collection(db, 'products'),
      where('categoryId', '==', categoryId),
      where('isDeleted', '!=', true)
    );
    const productsSnapshot = await getDocs(productsQuery);
    const productsCount = productsSnapshot.size;
    
    // Count groups
    const groupsQuery = query(
      collection(db, 'groups'),
      where('categoryId', '==', categoryId),
      where('isDeleted', '!=', true)
    );
    const groupsSnapshot = await getDocs(groupsQuery);
    const groupsCount = groupsSnapshot.size;
    
    // Count jobs
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('categoryId', '==', categoryId),
      where('isDeleted', '!=', true)
    );
    const jobsSnapshot = await getDocs(jobsQuery);
    const jobsCount = jobsSnapshot.size;
    
    // Count facility slots
    const slotsQuery = query(
      collection(db, 'facility_slots'),
      where('categoryId', '==', categoryId),
      where('isDeleted', '!=', true)
    );
    const slotsSnapshot = await getDocs(slotsQuery);
    const slotsCount = slotsSnapshot.size;
    
    // Count subscribers (users with this category preference)
    const subscribersQuery = query(
      collection(db, 'users'),
      where('preferences.favoriteCategories', 'array-contains', categoryId)
    );
    const subscribersSnapshot = await getDocs(subscribersQuery);
    const subscribersCount = subscribersSnapshot.size;
    
    return {
      categoryId,
      categoryName: category.name,
      subscribers: subscribersCount,
      products: productsCount,
      groups: groupsCount,
      jobs: jobsCount,
      slots: slotsCount,
      lastUpdated: new Date() as any, // TODO: Use proper Timestamp
    };
  } catch (error) {
    console.error('Error fetching category stats:', error);
    throw error;
  }
}

/**
 * Get all categories with their statistics
 */
export async function getCategoriesWithStats(): Promise<CategoryStats[]> {
  try {
    const categories = await getCategories({ isActive: true });
    const statsPromises = categories.map(cat => getCategoryStats(cat.id));
    const stats = await Promise.all(statsPromises);
    
    return stats.filter(Boolean) as CategoryStats[];
  } catch (error) {
    console.error('Error fetching categories with stats:', error);
    throw error;
  }
}
