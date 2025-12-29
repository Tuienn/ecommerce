import { Navigate, Outlet } from 'react-router-dom'
import BasicLayout from '../layout/BasicLayout'
import { getAuthToken } from '../lib/handleStorage'

const ProtectedRoute = () => {
    const data = getAuthToken()

    if (!data?.refreshToken) {
        return <Navigate to='/login' />
    }
    return (
        <BasicLayout>
            <Outlet />
        </BasicLayout>
    )
}

export default ProtectedRoute
