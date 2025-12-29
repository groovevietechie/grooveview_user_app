/**
 * Performance optimization utilities for the customer app
 */

/**
 * Debounce function to limit the rate of function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Throttle function to limit function calls to once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Preload images for better user experience
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  const promises = urls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
      img.src = url
    })
  })
  
  return Promise.all(promises)
}

/**
 * Lazy load images when they come into viewport
 */
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  }
  
  return new IntersectionObserver(callback, defaultOptions)
}

/**
 * Optimize image URLs for different screen sizes
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  width?: number,
  height?: number,
  quality?: number
): string {
  // If it's a Supabase Storage URL, we can add transformation parameters
  if (originalUrl.includes('supabase') && originalUrl.includes('/storage/v1/object/public/')) {
    const url = new URL(originalUrl)
    const params = new URLSearchParams()
    
    if (width) params.set('width', width.toString())
    if (height) params.set('height', height.toString())
    if (quality) params.set('quality', quality.toString())
    
    if (params.toString()) {
      url.search = params.toString()
    }
    
    return url.toString()
  }
  
  // For other URLs, return as-is
  return originalUrl
}

/**
 * Cache management for API responses
 */
class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>()
  private ttl: number
  
  constructor(ttlMinutes: number = 5) {
    this.ttl = ttlMinutes * 60 * 1000 // Convert to milliseconds
  }
  
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }
    
    // Check if item has expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false
    
    // Check if expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }
}

// Export cache instances for different data types
export const menuCache = new SimpleCache<any>(10) // 10 minutes for menu data
export const imageCache = new SimpleCache<string>(30) // 30 minutes for image URLs

/**
 * Batch API requests to reduce network calls
 */
export class RequestBatcher {
  private batches = new Map<string, {
    requests: Array<{ resolve: Function; reject: Function; params: any }>
    timeout: NodeJS.Timeout
  }>()
  
  private batchDelay: number
  
  constructor(batchDelayMs: number = 50) {
    this.batchDelay = batchDelayMs
  }
  
  add<T>(
    batchKey: string,
    params: any,
    executor: (allParams: any[]) => Promise<T[]>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let batch = this.batches.get(batchKey)
      
      if (!batch) {
        batch = {
          requests: [],
          timeout: setTimeout(() => {
            this.executeBatch(batchKey, executor)
          }, this.batchDelay)
        }
        this.batches.set(batchKey, batch)
      }
      
      batch.requests.push({ resolve, reject, params })
    })
  }
  
  private async executeBatch<T>(
    batchKey: string,
    executor: (allParams: any[]) => Promise<T[]>
  ): Promise<void> {
    const batch = this.batches.get(batchKey)
    if (!batch) return
    
    this.batches.delete(batchKey)
    clearTimeout(batch.timeout)
    
    try {
      const allParams = batch.requests.map(req => req.params)
      const results = await executor(allParams)
      
      batch.requests.forEach((req, index) => {
        req.resolve(results[index])
      })
    } catch (error) {
      batch.requests.forEach(req => {
        req.reject(error)
      })
    }
  }
}

// Export a default request batcher
export const defaultBatcher = new RequestBatcher()

/**
 * Measure and log performance metrics
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now()
  
  const result = fn()
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const end = performance.now()
      console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`)
    })
  } else {
    const end = performance.now()
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`)
    return result
  }
}