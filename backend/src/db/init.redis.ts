'use strict'

import { createClient } from 'redis'
import config from '../configs/redis.config'

export type RedisClientType = ReturnType<typeof createClient>

class RedisDatabase {
    private static instance: RedisDatabase
    public client: RedisClientType

    constructor() {
        this.client = createClient({
            url: config.url
        })

        this.connect()
    }

    async connect(): Promise<void> {
        try {
            this.client.on('connect', () => {
                console.log('Redis client connecting...')
            })

            this.client.on('ready', () => {
                console.log('✅ Redis connected successfully')
                console.log(`Redis connection URL: ${config.url}`)
            })

            this.client.on('error', (err) => {
                console.error('❌ Redis connection error:', err.message)
            })

            this.client.on('end', () => {
                console.log('Redis client disconnected')
            })

            await this.client.connect()
        } catch (err) {
            const error = err as Error
            console.error(`Error connecting to Redis: ${error.message}`)
            // Don't throw error - allow app to continue without Redis cache
            console.warn('⚠️  Application will continue without Redis cache')
        }
    }

    static getInstance(): RedisDatabase {
        if (!RedisDatabase.instance) {
            RedisDatabase.instance = new RedisDatabase()
        }

        return RedisDatabase.instance
    }

    getClient(): RedisClientType {
        return this.client
    }
}

const instanceRedis = RedisDatabase.getInstance()
export const redisClient = instanceRedis.getClient()
export default instanceRedis
