'use strict'

import { Request, Response, NextFunction } from 'express'
import { redisClient } from '../db/init.redis'

interface CacheEvictOptions {
    /**
     * Pattern to match cache keys (e.g., 'products:*', 'cache:GET:/v1/products*')
     * Uses Redis SCAN command to find matching keys
     */
    pattern?: string
    
    /**
     * Specific cache keys to evict
     * Can be static strings or functions that generate keys from request
     */
    keys?: (string | ((req: Request) => string))[]
}

/**
 * Cache eviction middleware factory
 * Executes after the route handler completes successfully
 * 
 * @param options - Configuration for cache eviction
 * @returns Express middleware function
 * 
 * @example
 * // Evict all product caches using pattern
 * router.post('/products',
 *   asyncHandler(ProductController.createProduct),
 *   cacheEvictMiddleware({ pattern: 'cache:GET:/v1/products*' })
 * )
 * 
 * @example
 * // Evict specific cache keys
 * router.put('/products/:id',
 *   asyncHandler(ProductController.updateProduct),
 *   cacheEvictMiddleware({
 *     keys: [
 *       (req) => `cache:GET:/v1/products/${req.params.id}`,
 *       'cache:GET:/v1/products'
 *     ]
 *   })
 * )
 * 
 * @example
 * // Evict both pattern and specific keys
 * router.delete('/products/:id',
 *   asyncHandler(ProductController.deleteProduct),
 *   cacheEvictMiddleware({
 *     pattern: 'cache:GET:/v1/products*',
 *     keys: [(req) => `cache:GET:/v1/products/${req.params.id}`]
 *   })
 * )
 */
export const cacheEvictMiddleware = (options: CacheEvictOptions) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Store original res.json function
        const originalJson = res.json.bind(res)

        // Override res.json to evict cache after successful response
        res.json = function (body: any) {
            // Only evict cache on successful responses (2xx status codes)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Evict cache asynchronously (don't wait)
                evictCache(req, options)
                    .then((count) => {
                        if (count > 0) {
                            console.log(`🗑️  Cache evicted: ${count} key(s)`)
                        }
                    })
                    .catch((err) => {
                        console.error('Error evicting cache:', err.message)
                    })
            }

            // Call original json function
            return originalJson(body)
        }

        next()
    }
}

/**
 * Evict cache based on pattern and/or specific keys
 */
async function evictCache(req: Request, options: CacheEvictOptions): Promise<number> {
    try {
        // Check if Redis client is ready
        if (!redisClient.isReady) {
            console.warn('Redis client not ready, skipping cache eviction')
            return 0
        }

        let deletedCount = 0
        const keysToDelete: string[] = []

        // Handle pattern-based eviction
        if (options.pattern) {
            const matchedKeys = await scanKeys(options.pattern)
            keysToDelete.push(...matchedKeys)
        }

        // Handle specific key eviction
        if (options.keys && options.keys.length > 0) {
            for (const key of options.keys) {
                const resolvedKey = typeof key === 'function' ? key(req) : key
                keysToDelete.push(resolvedKey)
            }
        }

        // Remove duplicates
        const uniqueKeys = [...new Set(keysToDelete)]

        // Delete all keys
        if (uniqueKeys.length > 0) {
            for (const key of uniqueKeys) {
                try {
                    const result = await redisClient.del(key)
                    if (result > 0) {
                        deletedCount += result
                        console.log(`🗑️  Evicted cache key: ${key}`)
                    }
                } catch (err) {
                    console.error(`Error deleting key ${key}:`, (err as Error).message)
                }
            }
        }

        return deletedCount
    } catch (error) {
        const err = error as Error
        console.error(`Cache eviction error: ${err.message}`)
        return 0
    }
}

/**
 * Scan Redis for keys matching a pattern
 * Uses SCAN to avoid blocking Redis
 */
async function scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = []
    let cursor = 0

    try {
        do {
            // SCAN returns cursor and keys
            const result = await redisClient.scan(cursor, {
                MATCH: pattern,
                COUNT: 100
            })

            cursor = result.cursor
            keys.push(...result.keys)
        } while (cursor !== 0)

        return keys
    } catch (error) {
        const err = error as Error
        console.error(`Error scanning keys with pattern ${pattern}:`, err.message)
        return []
    }
}

export default cacheEvictMiddleware
