'use strict'

import { Request, Response, NextFunction } from 'express'
import { redisClient } from '../db/init.redis'

/**
 * Generate cache key from request
 * Format: {method}:{path}:{querystring}
 */
const generateCacheKey = (req: Request): string => {
    const path = req.originalUrl || req.url
    const baseKey = `cache:${req.method}:${path}`

    // If there are query params, they're already in the path
    return baseKey
}

/**
 * Cache middleware factory
 * @param ttl - Time to live in seconds
 * @returns Express middleware function
 *
 * @example
 * // Cache for 15 minutes (900 seconds)
 * router.get('/products', cacheMiddleware(900), asyncHandler(ProductController.getAllProducts))
 *
 * // Cache for 1 hour (3600 seconds)
 * router.get('/products/:id', cacheMiddleware(3600), asyncHandler(ProductController.getProductById))
 */
export const cacheMiddleware = (ttl: number) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next()
        }

        const cacheKey = generateCacheKey(req)

        try {
            // Check if Redis client is ready
            if (!redisClient.isReady) {
                console.warn('Redis client not ready, skipping cache')
                return next()
            }

            // Try to get cached data
            const cachedData = await redisClient.get(cacheKey)

            if (cachedData) {
                console.log(`✅ Cache HIT: ${cacheKey}`)

                // Parse cached data and send response
                const parsedData = JSON.parse(cachedData)
                return res.status(200).json(parsedData)
            }

            console.log(`❌ Cache MISS: ${cacheKey}`)

            // Store original res.json function
            const originalJson = res.json.bind(res)

            // Override res.json to cache the response
            res.json = function (body: any) {
                // Only cache successful responses (2xx status codes)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    // Cache the response asynchronously (don't wait)
                    redisClient
                        .setEx(cacheKey, ttl, JSON.stringify(body))
                        .then(() => {
                            console.log(`💾 Cached: ${cacheKey} (TTL: ${ttl}s)`)
                        })
                        .catch((err) => {
                            console.error(`Error caching data for ${cacheKey}:`, err.message)
                        })
                }

                // Call original json function
                return originalJson(body)
            }

            next()
        } catch (error) {
            const err = error as Error
            console.error(`Cache middleware error: ${err.message}`)
            // Continue without cache on error
            next()
        }
    }
}

export default cacheMiddleware
