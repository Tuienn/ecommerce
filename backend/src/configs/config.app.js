'use strict'

const { DB_USER, DB_PASSWORD, DB_HOST, DB_NAME } = process.env

const mongodbUrl = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}?retryWrites=true&w=majority&appName=${DB_NAME}`

const development = {
    app: {
        port: process.env.DEV_APP_PORT || 4000
    },
    db: {
        url: mongodbUrl
    }
    // otp: {
    //     ttlMinutes: process.env.OTP_TTL_MINUTES || 60,
    //     maxTries: process.env.OTP_MAX_TRIES || 5,
    //     lockSecondsOnMax: process.env.LOCK_SECONDS_ON_MAX || 60
    // }
}

const production = {
    app: {
        port: process.env.PORT || 4000
    },
    db: {
        url: mongodbUrl
    }
    // otp: {
    //     ttlMinutes: process.env.OTP_TTL_MINUTES || 5,
    //     maxTries: process.env.OTP_MAX_TRIES || 5,
    //     lockSecondsOnMax: process.env.LOCK_SECONDS_ON_MAX || 60
    // }
}

const config = { development, production }
const env = process.env.NODE_ENV || 'development' // Default to 'dev' if NODE_ENV is not set

export default config[env]
