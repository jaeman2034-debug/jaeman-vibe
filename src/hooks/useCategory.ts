import { useState, useEffect, useCallback } from 'react';
import { getCategory, getCategoryBySlug, getCategoryStats } from '@/services/categoryService';
import type { Category, CategoryStats } from '@/types/category';

interface UseCategoryOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  includeStats?: boolean;
}

interface UseCategoryReturn {
  category: Category | null;
  stats: CategoryStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCategory(
  identifier: string | null,
  options: UseCategoryOptions = {}
): UseCategoryReturn {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    includeStats = false,
  } = options;

  const [category, setCategory] = useState<Category | null>(null);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = useCallback(async () => {
    if (!identifier) {
      setCategory(null);
      setStats(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to fetch by ID first, then by slug
      let categoryData: Category | null = null;
      
      try {
        categoryData = await getCategory(identifier);
      } catch {
        // If not found by ID, try by slug
        categoryData = await getCategoryBySlug(identifier);
      }

      if (!categoryData) {
        setError('Category not found');
        setCategory(null);
        setStats(null);
        return;
      }

      setCategory(categoryData);

      // Fetch stats if requested
      if (includeStats) {
        try {
          const statsData = await getCategoryStats(categoryData.id);
          setStats(statsData);
        } catch (statsError) {
          console.warn('Failed to fetch category stats:', statsError);
          // Don't fail the whole request if stats fail
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch category';
      setError(errorMessage);
      console.error('Error fetching category:', err);
      setCategory(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [identifier, includeStats]);

  const refresh = useCallback(async () => {
    await fetchCategory();
  }, [fetchCategory]);

  // Initial fetch
  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh || !identifier) return;

    const interval = setInterval(() => {
      fetchCategory();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchCategory, identifier]);

  return {
    category,
    stats,
    loading,
    error,
    refresh,
  };
}
