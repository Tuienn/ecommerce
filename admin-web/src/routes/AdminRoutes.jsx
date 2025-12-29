import { lazy } from 'react'

const CategoryManagement = lazy(() => import('../pages/admin/CategoryManagement'))
const ProductManagement = lazy(() => import('../pages/admin/ProductManagement'))
const UserManagement = lazy(() => import('../pages/admin/UserManagement'))
const OrderManagement = lazy(() => import('../pages/admin/OrderManagement'))
const ChatSupport = lazy(() => import('../pages/admin/ChatSupport'))

const AdminRoutes = [
    {
        path: '/category-management',
        name: 'category-management',
        element: <CategoryManagement />
    },
    {
        path: '/product-management',
        name: 'product-management',
        element: <ProductManagement />
    },
    {
        path: '/user-management',
        name: 'user-management',
        element: <UserManagement />
    },
    {
        path: '/order-management',
        name: 'order-management',
        element: <OrderManagement />
    },
    {
        path: '/chat-support',
        name: 'chat-support',
        element: <ChatSupport />
    }
]

export default AdminRoutes
