import { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react';
import type { BlobMetadata, BlobConfig, SortField, SortDirection, FileCategory } from '../types';
import { fetchBlobs } from '../lib/api';
import { getFileCategory } from '../lib/blob';

export function useBlobs(config: BlobConfig) {
  const [blobs, setBlobs] = useState<BlobMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & sorting
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);
  const [category, setCategory] = useState<FileCategory>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Pagination (100 rows per page)
  const [page, setPage] = useState(1);
  const pageSize = 100;

  // Selection
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const loadBlobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchBlobs(config);
      setBlobs(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to connect to Azure Blob Storage.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // Defer the initial fetch one tick so state updates never happen synchronously
  // inside the effect body (React 19 + eslint-plugin-react-hooks v7).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBlobs();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadBlobs]);

  // Filtered & Sorted list
  const filteredBlobs = useMemo(() => {
    let result = blobs;

    if (category !== 'all') {
      result = result.filter((b) => getFileCategory(b.name, b.contentType) === category);
    }

    if (deferredSearch.trim()) {
      const query = deferredSearch.toLowerCase().trim();
      result = result.filter((b) => b.name.toLowerCase().includes(query));
    }

    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortField === 'size') {
        cmp = a.size - b.size;
      } else if (sortField === 'lastModified') {
        cmp = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [blobs, category, deferredSearch, sortField, sortDirection]);

  // Filter changes reset pagination through the setters below; clamping here
  // also handles a shrinking manifest after uploads/deletes.
  const totalPages = Math.max(1, Math.ceil(filteredBlobs.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const updateSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
  }, []);

  const updateCategory = useCallback((nextCategory: FileCategory) => {
    setCategory(nextCategory);
    setPage(1);
  }, []);

  // Paginated view
  const paginatedBlobs = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredBlobs.slice(start, start + pageSize);
  }, [filteredBlobs, safePage, pageSize]);

  // Selection handling including Shift-Click range selection
  const toggleSelect = useCallback((key: string, index: number, shiftKey: boolean) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (shiftKey && lastSelectedIndex !== null && lastSelectedIndex !== index) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        for (let i = start; i <= end; i++) {
          const item = paginatedBlobs[i];
          if (item) next.add(item.name);
        }
      } else {
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
      }
      return next;
    });
    setLastSelectedIndex(index);
  }, [lastSelectedIndex, paginatedBlobs]);

  const selectAll = useCallback(() => {
    if (selectedKeys.size === paginatedBlobs.length && paginatedBlobs.length > 0) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(paginatedBlobs.map((b) => b.name)));
    }
  }, [selectedKeys.size, paginatedBlobs]);

  const clearSelection = useCallback(() => {
    setSelectedKeys(new Set());
    setLastSelectedIndex(null);
  }, []);

  const totalBytes = useMemo(() => {
    return blobs.reduce((acc, b) => acc + b.size, 0);
  }, [blobs]);

  return {
    blobs,
    filteredBlobs,
    paginatedBlobs,
    isLoading,
    error,
    reload: loadBlobs,
    searchQuery,
    setSearchQuery: updateSearch,
    category,
    setCategory: updateCategory,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    page: safePage,
    setPage,
    totalPages,
    pageSize,
    selectedKeys,
    toggleSelect,
    selectAll,
    clearSelection,
    totalBytes,
  };
}
