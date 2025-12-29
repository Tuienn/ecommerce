import { lazy } from 'react'

const BlogsManagement = lazy(() => import('../pages/admin/BlogsManagement'))

const AdminRoutes = [
    {
        path: '/blogs-management',
        name: 'blogs-management',
        element: <BlogsManagement />
    }
]

export default AdminRoutes
