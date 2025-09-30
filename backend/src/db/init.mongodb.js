'use strict'

import mongoose from 'mongoose'
import config from '../configs/config.app.js' // import db config
import { countConnect } from '../helpers/check.connect.js' // check number of connections
import { createDefaultAdmin } from '../modules/user/user.service.js'
const connectString = config.db.url

class Database {
    constructor() {
        this.connect()
    }

    async connect(type = 'mongodb') {
        if (1 === 1) {
            mongoose.set('debug', true) // enable debug mode
            mongoose.set('debug', { color: true }) // disable strict query mode
        }

        try {
            await mongoose.connect(connectString)
            console.log('MongoDB connected successfully')
            countConnect()
            console.log(`MongoDB connection string: ${connectString}`)

            // Create default admin user after successful connection
            await createDefaultAdmin()
            // await importBanks()
            // await importScammer()
        } catch (err) {
            console.log(`Error connecting to MongoDB: ${err.message}`)
            throw err
        }
    }

    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database()
        }

        return Database.instance
    }
}

const instanceMongoDb = Database.getInstance()
export default instanceMongoDb
