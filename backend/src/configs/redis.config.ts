'use strict'

const { REDIS_URL } = process.env

interface IRedisConfig {
    url: string
}

const development: IRedisConfig = {
    url: REDIS_URL || 'redis://localhost:6379'
}

const production: IRedisConfig = {
    url: REDIS_URL || 'redis://localhost:6379'
}

const config: { development: IRedisConfig; production: IRedisConfig } = { development, production }
const env = (process.env.NODE_ENV || 'development') as 'development' | 'production'

export default config[env]
