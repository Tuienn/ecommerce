import { Router, type Router as RouterType } from 'express'

import authRoute from './auth/auth.route'
import userRoute from './user/user.route'
import otpRoute from './auth/otp/otp.route'
import categoryRoute from './category/category.route'
import productRoute from './product/product.route'
import cartRoute from './cart/cart.route'
import orderRoute from './order/order.route'
import reviewRoute from './review/review.route'
import chatRoute from './chat/chat.route'
import messageRoute from './message/message.route'
import userChatKeyRoute from './userChatKey/userChatkey.route'

const router: RouterType = Router()

const defaultRoutes = [
    { path: '/api/auth', route: authRoute },
    { path: '/api/auth/otp', route: otpRoute },
    { path: '/api/user', route: userRoute },
    { path: '/api/category', route: categoryRoute },
    { path: '/api/product', route: productRoute },
    { path: '/api/cart', route: cartRoute },
    { path: '/api/order', route: orderRoute },
    { path: '/api/review', route: reviewRoute },
    { path: '/api/chat', route: chatRoute },
    { path: '/api/message', route: messageRoute },
    { path: '/api/chat-key', route: userChatKeyRoute }
]

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route)
})

export default router
