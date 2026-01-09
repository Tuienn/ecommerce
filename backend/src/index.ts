import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import http from 'http'
import helmet from 'helmet'
import { Server } from 'socket.io'
import 'dotenv/config'
import routes from './modules/index.route'
import { limiter } from './middlewares/rateLimiter.middleware'
import { sanitizeInput } from './middlewares/sanitize.middleware'
import httpLogger from './middlewares/http.middleware'
import './db/init.mongodb'
import './db/init.redis'
import { checkOverLoad } from './helpers/check.connect'
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware'
import { initSocketHandler } from './socket/index'

checkOverLoad()

const app = express()
const server = http.createServer(app)

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['*'],
        methods: ['GET', 'POST'],
        credentials: true
    }
})

// Initialize socket handlers
initSocketHandler(io)

app.use(helmet())

app.use(
    cors({
        origin: process.env.CORS_ORIGIN?.split(',') || [],
        credentials: true
    })
)

app.use((_req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow')
    next()
})

app.set('trust proxy', 1)
app.use(bodyParser.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))

// HTTP Logger - only enable in development
if (process.env.NODE_ENV !== 'production') {
    app.use(httpLogger)
}

app.use(sanitizeInput)

if (process.env.NODE_ENV === 'production') {
    app.use('/v1', limiter(1 * 60 * 1000, 100))
}

app.use('/v1', routes)

// 404 handler
app.use(notFoundMiddleware)
// Global error handler
app.use(errorMiddleware)

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`💬 Socket.IO initialized for E2E chat`)
})
