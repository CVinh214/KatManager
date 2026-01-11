/**
 * Custom React hooks for preventing duplicate submissions and managing loading states
 */

import { useState, useCallback, useRef } from 'react';

/**
 * Hook to prevent duplicate form submissions
 * Returns [isSubmitting, submitFunction, error, clearError]
 * 
 * Usage:
 * const [isSubmitting, handleSubmit, error, clearError] = useSubmitHandler(async (data) => {
 *   await fetch('/api/endpoint', { method: 'POST', body: JSON.stringify(data) });
 * });
 */
export function useSubmitHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  options: { onSuccess?: () => void; onError?: (error: Error) => void } = {}
): [boolean, T, Error | null, () => void] {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isSubmittingRef = useRef(false);

  const wrappedHandler = useCallback(
    async (...args: Parameters<T>) => {
      // Prevent duplicate submissions
      if (isSubmittingRef.current) {
        console.warn('[useSubmitHandler] Submission already in progress, ignoring duplicate');
        return;
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setError(null);

      try {
        const result = await handler(...args);
        options.onSuccess?.();
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        options.onError?.(error);
        throw error;
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [handler, options]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return [isSubmitting, wrappedHandler as T, error, clearError];
}

/**
 * Hook for debounced API calls
 * Useful for search inputs or auto-save features
 * 
 * Usage:
 * const debouncedSearch = useDebounce(async (query) => {
 *   const results = await fetch(`/api/search?q=${query}`);
 * }, 500);
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  return debouncedCallback as T;
}

/**
 * Hook for async loading states
 * Returns [data, loading, error, execute, reset]
 * 
 * Usage:
 * const [data, loading, error, fetchData] = useAsync(async () => {
 *   return fetch('/api/data').then(r => r.json());
 * });
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = false
): [T | null, boolean, Error | null, () => Promise<void>, () => void] {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFunction();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  // Execute immediately if requested
  if (immediate) {
    execute();
  }

  return [data, loading, error, execute, reset];
}

/**
 * Hook to throttle function calls
 * Useful for scroll/resize handlers
 * 
 * Usage:
 * const throttledScroll = useThrottle(() => {
 *   // handle scroll
 * }, 100);
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        callback(...args);
        lastRunRef.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRunRef.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay]
  );

  return throttledCallback as T;
}

/**
 * Hook to prevent multiple clicks
 * Returns [isClicked, handleClick]
 * 
 * Usage:
 * const [isClicked, handleSave] = usePreventDoubleClick(async () => {
 *   await saveData();
 * }, 1000);
 */
export function usePreventDoubleClick<T extends (...args: any[]) => Promise<any>>(
  callback: T,
  delay: number = 1000
): [boolean, T] {
  const [isClicked, setIsClicked] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = useCallback(
    async (...args: Parameters<T>) => {
      if (isClicked) {
        console.warn('[usePreventDoubleClick] Click ignored - still processing previous click');
        return;
      }

      setIsClicked(true);

      try {
        return await callback(...args);
      } finally {
        // Reset after delay
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setIsClicked(false);
        }, delay);
      }
    },
    [callback, delay, isClicked]
  );

  return [isClicked, handleClick as T];
}
