import { useState, useEffect, useCallback } from 'react';
import { getCategories, getCategoriesWithStats } from '@/services/categoryService';
import type { Category, CategoryStats, CategoryFilters, CategorySort } from '@/types/category';

interface UseCategoriesOptions {
  filters?: CategoryFilters;
  sort?: CategorySort;
  includeStats?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseCategoriesReturn {
  categories: Category[];
  stats: CategoryStats[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setFilters: (filters: CategoryFilters) => void;
  setSort: (sort: CategorySort) => void;
}

export function useCategories(options: UseCategoriesOptions = {}): UseCategoriesReturn {
  const {
    filters = {},
    sort = { field: 'sortOrder', direction: 'asc' },
    includeStats = false,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState(filters);
  const [currentSort, setCurrentSort] = useState(sort);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (includeStats) {
        const statsData = await getCategoriesWithStats();
        setStats(statsData);
        // Extract categories from stats
        const categoriesData = statsData.map(stat => ({
          id: stat.categoryId,
          name: stat.categoryName,
          slug: stat.categoryId, // Use ID as slug for now
          isActive: true,
          sortOrder: 0,
          createdAt: stat.lastUpdated,
          updatedAt: stat.lastUpdated,
        } as Category));
        setCategories(categoriesData);
      } else {
        const categoriesData = await getCategories(currentFilters, currentSort);
        setCategories(categoriesData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(errorMessage);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, [currentFilters, currentSort, includeStats]);

  const refresh = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  const setFilters = useCallback((newFilters: CategoryFilters) => {
    setCurrentFilters(newFilters);
  }, []);

  const setSort = useCallback((newSort: CategorySort) => {
    setCurrentSort(newSort);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchCategories();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchCategories]);

  return {
    categories,
    stats,
    loading,
    error,
    refresh,
    setFilters,
    setSort,
  };
}
