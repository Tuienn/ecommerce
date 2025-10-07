import { Router, type Router as RouterType } from 'express'

import authRoute from './auth/auth.route'
import userRoute from './user/user.route'
import otpRoute from './auth/otp/otp.route'
import categoryRoute from './category/category.route'

const router: RouterType = Router()

const defaultRoutes = [
    { path: '/api/auth', route: authRoute },
    { path: '/api/auth/otp', route: otpRoute },
    { path: '/api/user', route: userRoute },
    { path: '/api/category', route: categoryRoute }
]

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route)
})

export default router
