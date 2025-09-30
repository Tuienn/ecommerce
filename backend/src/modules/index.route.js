const express = require('express')

const authRoute = require('./auth/auth.route')
const userRoute = require('./user/user.route')

const router = express.Router()

const defaultRoutes = [
    { path: '/api/auth', route: authRoute },
    { path: '/api/user', route: userRoute }
]

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route)
})

module.exports = router
