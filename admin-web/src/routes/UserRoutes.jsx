import { lazy } from 'react'

const BlogsPage = lazy(() => import('../pages/user/Blogs'))

const UserRoutes = [
    {
        path: '/blogs',
        name: 'blogs',
        element: <BlogsPage />
    }
]

export default UserRoutes
