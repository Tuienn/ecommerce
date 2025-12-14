import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import http from 'http'
import helmet from 'helmet'
import 'dotenv/config'
import routes from './modules/index.route'
import { limiter } from './middlewares/rateLimiter.middleware'
import { sanitize } from './middlewares/sanitize.middleware'
import httpLogger from './middlewares/http.middleware'
import './db/init.mongodb'
import { checkOverLoad } from './helpers/check.connect'
import validateBody from './middlewares/validateBody.middleware'
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware'

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

app.use((req, _res, next) => {
    if (req.body) sanitize(req.body)
    if (req.query) sanitize(req.query)
    if (req.params) sanitize(req.params)
    next()
})

if (process.env.NODE_ENV === 'production') {
    app.use('/v1', limiter)
}

// app.use(validateBody)
app.use('/v1', routes)

// 404 handler - replace existing 404 middleware
app.use(notFoundMiddleware)
// Global error handler - replace existing error middleware
app.use(errorMiddleware)

// const socketManager = require('./src/socket/index.socket')
// socketManager.init(server)

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
