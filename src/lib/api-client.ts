/**
 * Optimized API client with caching and request deduplication
 * Prevents duplicate API calls and improves performance
 */

import { SimpleCache, RequestDeduplicator } from './performance';

// Global instances
const cache = new SimpleCache(30000); // 30 seconds cache
const deduplicator = new RequestDeduplicator();

interface ApiClientOptions extends Omit<RequestInit, 'cache'> {
  cache?: boolean;
  cacheTTL?: number;
  deduplicate?: boolean;
}

/**
 * Enhanced fetch with caching and deduplication
 */
export async function apiClient<T = any>(
  url: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const {
    cache: useCache = true,
    cacheTTL = 30000,
    deduplicate = true,
    ...fetchOptions
  } = options;

  const method = fetchOptions.method || 'GET';
  const cacheKey = `${method}:${url}:${JSON.stringify(fetchOptions.body || {})}`;

  // Only use cache for GET requests
  if (useCache && method === 'GET') {
    const cached = cache.get(cacheKey, cacheTTL);
    if (cached) {
      console.log(`[API Cache] Hit: ${url}`);
      return cached as T;
    }
  }

  console.log(`[API] ${method} ${url}`);

  // Use deduplication for all requests
  const fetchFn = async () => {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error ${response.status}: ${error}`);
    }

    const data = await response.json();

    // Cache GET requests
    if (useCache && method === 'GET') {
      cache.set(cacheKey, data, cacheTTL);
    }

    return data as T;
  };

  if (deduplicate) {
    return deduplicator.fetch(url, fetchOptions);
  }

  return fetchFn();
}

/**
 * Clear cache for specific URL or all cache
 */
export function clearApiCache(url?: string): void {
  if (url) {
    cache.clear(`GET:${url}:`);
  } else {
    cache.clear();
  }
}

/**
 * API helper methods
 */
export const api = {
  get: <T = any>(url: string, options?: Omit<ApiClientOptions, 'method'>) =>
    apiClient<T>(url, { ...options, method: 'GET' }),

  post: <T = any>(url: string, data?: any, options?: Omit<ApiClientOptions, 'method' | 'body'>) =>
    apiClient<T>(url, {
      ...options,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: data ? JSON.stringify(data) : undefined,
      cache: false, // Don't cache POST
    }),

  put: <T = any>(url: string, data?: any, options?: Omit<ApiClientOptions, 'method' | 'body'>) =>
    apiClient<T>(url, {
      ...options,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: data ? JSON.stringify(data) : undefined,
      cache: false, // Don't cache PUT
    }),

  delete: <T = any>(url: string, data?: any, options?: Omit<ApiClientOptions, 'method' | 'body'>) =>
    apiClient<T>(url, {
      ...options,
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: data ? JSON.stringify(data) : undefined,
      cache: false, // Don't cache DELETE
    }),
};
