import { lazy, Suspense } from 'react'
import Suspend from '../layout/Suspend'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { getAuthToken } from '../lib/handleStorage'
import ProtectedRoute from './ProtectedRoute'
import UserRoutes from './UserRoutes'
import AdminRoutes from './AdminRoutes'
import PageNotFound from '../layout/PageNotFound'

const Login = lazy(() => import('../pages/Login'))

const Routes = () => {
    const data = getAuthToken()

    const routesNotAuthenticated = [
        {
            path: '/login',
            element: (
                <Suspense fallback={<Suspend />}>
                    <Login />
                </Suspense>
            )
        }
    ]

    const routesForUser = [
        {
            path: '/',
            element: (
                <Suspense fallback={<Suspend />}>
                    <ProtectedRoute />
                </Suspense>
            ),
            children: [
                {
                    index: true, // Mặc định vào trang category, nếu vào '/' -> redirect sang /blogs
                    element: <Navigate to='/blogs' replace />
                },
                ...UserRoutes
            ]
        }
    ]
    const routesForAdmin = [
        {
            path: '/',
            element: (
                <Suspense fallback={<Suspend />}>
                    <ProtectedRoute />
                </Suspense>
            ),
            children: [
                {
                    index: true, // Mặc định vào trang quản lý danh mục
                    element: <Navigate to='/category-management' replace />
                },
                ...AdminRoutes
            ]
        }
    ]

    const routes = createBrowserRouter([
        ...routesNotAuthenticated,
        ...(data?.role === 'user' ? routesForUser : []),
        ...(data?.role === 'admin' ? routesForAdmin : []),
        {
            path: '*',
            element: data?.role ? <PageNotFound /> : <ProtectedRoute />
        }
    ])

    return <RouterProvider router={routes} />
}

export default Routes
