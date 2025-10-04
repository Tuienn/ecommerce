import { Router } from 'express'

import authRoute from './auth/auth.route.js'
import userRoute from './user/user.route.js'
import otpRoute from './auth/otp/otp.route.js'

const router = Router()

const defaultRoutes = [
    { path: '/api/auth', route: authRoute },
    { path: '/api/auth/otp', route: otpRoute },
    { path: '/api/user', route: userRoute }
]

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route)
})

export default router
