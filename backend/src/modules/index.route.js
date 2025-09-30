import { Router } from 'express'

import authRoute from './auth/auth.route.js'
import userRoute from './user/user.route.js'

const router = Router()

const defaultRoutes = [
    { path: '/api/auth', route: authRoute },
    { path: '/api/user', route: userRoute }
]

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route)
})

export default router
