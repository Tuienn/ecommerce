'use strict'

import mongoose from 'mongoose'
import config from '../configs/mongodb.config' // import db config
import { countConnect } from '../helpers/check.connect' // check number of connections
import { UserService } from '../modules/index.service'

const connectString = config.db.url

class Database {
    private static instance: Database

    constructor() {
        this.connect()
    }

    async connect(): Promise<void> {
        if (process.env.NODE_ENV === 'development') {
            mongoose.set('debug', true) // enable debug mode
            mongoose.set('debug', { color: true }) // enable color in debug mode
        }

        try {
            await mongoose.connect(connectString)
            console.log('MongoDB connected successfully')
            countConnect()
            console.log(`MongoDB connection string: ${connectString}`)

            // Create default admin user after successful connection
            await UserService.createDefaultAdmin()
            // await importBanks()
            // await importScammer()
        } catch (err) {
            const error = err as Error
            console.log(`Error connecting to MongoDB: ${error.message}`)
            throw err
        }
    }

    static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database()
        }

        return Database.instance
    }
}

const instanceMongoDb = Database.getInstance()
export default instanceMongoDb
