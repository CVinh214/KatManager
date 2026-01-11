/**
 * Performance utilities for preventing duplicate operations and improving UX
 */

/**
 * Debounce function - delays execution until after wait time has elapsed
 * Use for: search inputs, auto-save, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - ensures function is called at most once per specified time period
 * Use for: scroll handlers, resize handlers, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Prevents duplicate async operations by tracking pending requests
 * Use for: form submissions, API calls from buttons
 */
export class AsyncLock {
  private locks: Map<string, Promise<any>> = new Map();

  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // If already running, wait for existing promise
    if (this.locks.has(key)) {
      return this.locks.get(key)!;
    }

    // Start new promise
    const promise = fn()
      .finally(() => {
        this.locks.delete(key);
      });

    this.locks.set(key, promise);
    return promise;
  }

  isLocked(key: string): boolean {
    return this.locks.has(key);
  }
}

/**
 * Simple in-memory cache with TTL
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class SimpleCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL: number = 60000) { // 60 seconds default
    this.defaultTTL = defaultTTL;
  }

  set(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string, ttl?: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    const maxAge = ttl ?? this.defaultTTL;

    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  has(key: string, ttl?: number): boolean {
    return this.get(key, ttl) !== null;
  }
}

/**
 * Request deduplication - prevents multiple identical API calls
 */
export class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>> = new Map();

  async fetch<T>(url: string, options?: RequestInit): Promise<T> {
    const key = `${url}-${JSON.stringify(options || {})}`;

    // If identical request is pending, return existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Make new request
    const promise = fetch(url, options)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as T;
      })
      .finally(() => {
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

/**
 * Hook-like function to prevent duplicate submissions
 * Returns [isSubmitting, submitFunction]
 */
export function createSubmitHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T
): [() => boolean, T] {
  let isSubmitting = false;

  const wrappedHandler = async (...args: Parameters<T>) => {
    if (isSubmitting) {
      console.warn('Submit already in progress, ignoring duplicate');
      return;
    }

    isSubmitting = true;
    try {
      return await handler(...args);
    } finally {
      isSubmitting = false;
    }
  };

  const getIsSubmitting = () => isSubmitting;

  return [getIsSubmitting, wrappedHandler as T];
}

/**
 * Rate limiter - limits number of calls per time window
 */
export class RateLimiter {
  private calls: number[] = [];
  private maxCalls: number;
  private timeWindow: number;

  constructor(maxCalls: number, timeWindowMs: number) {
    this.maxCalls = maxCalls;
    this.timeWindow = timeWindowMs;
  }

  canProceed(): boolean {
    const now = Date.now();
    // Remove old calls outside time window
    this.calls = this.calls.filter(time => now - time < this.timeWindow);
    
    if (this.calls.length >= this.maxCalls) {
      return false;
    }

    this.calls.push(now);
    return true;
  }

  reset(): void {
    this.calls = [];
  }
}
