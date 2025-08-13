import { useState, useEffect, useCallback, useRef } from 'react';
import requestOptimizer from '../utils/requestOptimizer';

// 최적화된 API 호출 훅
export const useOptimizedApi = (apiCall, dependencies = [], options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const {
    enableCache = true,
    cacheTTL = 60000,
    enableDedup = true,
    cacheKey = null
  } = options;

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (...args) => {
    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      let result;
      const key = cacheKey || `api:${apiCall.name}:${JSON.stringify(args)}`;

      if (enableCache && enableDedup) {
        result = await requestOptimizer.cachedRequest(
          key,
          () => apiCall(...args),
          cacheTTL
        );
      } else if (enableDedup) {
        result = await requestOptimizer.dedupeRequest(
          key,
          () => apiCall(...args)
        );
      } else {
        result = await apiCall(...args);
      }

      if (isMountedRef.current) {
        setData(result);
      }
      
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiCall, enableCache, enableDedup, cacheTTL, cacheKey]);

  useEffect(() => {
    if (dependencies.length > 0) {
      execute();
    }
  }, dependencies);

  return { data, loading, error, execute };
};

// 검색 최적화 훅
export const useOptimizedSearch = (searchFn, delay = 500) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const search = useCallback(async (searchQuery) => {
    if (!isMountedRef.current) return;

    setQuery(searchQuery);
    
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await requestOptimizer.optimizedSearch(
        searchQuery,
        searchFn,
        delay
      );

      if (isMountedRef.current) {
        setResults(data);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err);
        setResults([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [searchFn, delay]);

  return { query, results, loading, error, search };
};

// 무한 스크롤 최적화 훅
export const useOptimizedPagination = (fetchFn, initialPage = 1, limit = 10) => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadMore = useCallback(async (resetPage = false) => {
    if (!isMountedRef.current) return;

    const currentPage = resetPage ? initialPage : page;
    setLoading(true);
    setError(null);

    try {
      const result = await requestOptimizer.optimizedPagination(
        currentPage,
        limit,
        `pagination:${fetchFn.name}`,
        fetchFn
      );

      if (isMountedRef.current) {
        if (resetPage) {
          setData(result.data || result);
          setPage(initialPage + 1);
        } else {
          setData(prev => [...prev, ...(result.data || result)]);
          setPage(prev => prev + 1);
        }

        // hasMore 판단
        const items = result.data || result;
        setHasMore(items.length === limit);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn, page, limit, initialPage]);

  const reset = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    loadMore(true);
  }, [loadMore, initialPage]);

  useEffect(() => {
    loadMore(true);
  }, []);

  return { data, loading, hasMore, error, loadMore, reset };
};

// 실시간 데이터 최적화 훅
export const useOptimizedRealtime = (fetchFn, interval = 30000, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const {
    enableWhenVisible = true,
    enableBackgroundSync = false
  } = options;

  const isMountedRef = useRef(true);
  const intervalRef = useRef(null);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // 페이지 가시성 감지
  useEffect(() => {
    if (!enableWhenVisible) return;

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      
      if (isVisibleRef.current && !intervalRef.current) {
        startPolling();
      } else if (!isVisibleRef.current && !enableBackgroundSync) {
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enableWhenVisible, enableBackgroundSync]);

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const result = await requestOptimizer.cachedRequest(
        `realtime:${fetchFn.name}`,
        fetchFn,
        interval / 2 // 인터벌의 절반만 캐시
      );

      if (isMountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn, interval]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;

    fetchData(); // 즉시 실행
    intervalRef.current = setInterval(fetchData, interval);
  }, [fetchData, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    startPolling();
    return stopPolling;
  }, [startPolling, stopPolling]);

  return { data, loading, error, refresh: fetchData, startPolling, stopPolling };
};