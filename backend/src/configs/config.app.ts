'use strict'

const { DB_USER, DB_PASSWORD, DB_HOST, DB_NAME } = process.env

const mongodbUrl = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}?retryWrites=true&w=majority&appName=${DB_NAME}`

interface IAppConfig {
    app: {
        port: string | number
    }
    db: {
        url: string
    }
}

const development: IAppConfig = {
    app: {
        port: process.env.DEV_APP_PORT || 4000
    },
    db: {
        url: mongodbUrl
    }
}

const production: IAppConfig = {
    app: {
        port: process.env.PORT || 4000
    },
    db: {
        url: mongodbUrl
    }
}

const config: { development: IAppConfig; production: IAppConfig } = { development, production }
const env = (process.env.NODE_ENV || 'development') as 'development' | 'production'

export default config[env]
