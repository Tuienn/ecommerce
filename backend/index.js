import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import http from 'http'
import helmet from 'helmet'
import 'dotenv/config'

import routes from './src/modules/index.route.js'
import { limiter } from './src/middlewares/rateLimiter.middleware.js'
import { sanitize } from './src/middlewares/sanitize.middleware.js'
import httpLogger from './src/middlewares/http.middleware.js'

import './src/db/init.mongodb.js'
import { checkOverLoad } from './src/helpers/check.connect.js'

checkOverLoad()

const app = express()
const server = http.createServer(app)

app.use(helmet())

app.use(cors())

app.use((_req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow')
    next()
})

app.set('trust proxy', 1)
app.use(bodyParser.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))

// HTTP Logger - chỉ bật khi development
if (process.env.NODE_ENV !== 'production') {
    app.use(httpLogger)
}

app.use((req, res, next) => {
    if (req.body) sanitize(req.body)
    if (req.query) sanitize(req.query)
    if (req.params) sanitize(req.params)
    next()
})

if (process.env.NODE_ENV === 'production') {
    app.use('/v1', limiter)
}

app.use('/v1', routes)

app.use((req, _res, next) => {
    const error = new Error('Not Found Page' + req.originalUrl + ' with method ' + req.method)
    error.status = 404
    next(error)
})

// error handler
app.use((error, _req, res, _next) => {
    console.error('Error::', error)
    res.status(error.status || 500).json({
        code: error.status || 500,
        message: error.message || 'Internal Server Error',
        data: null
    })
})

// const socketManager = require('./src/socket/index.socket')
// socketManager.init(server)

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
