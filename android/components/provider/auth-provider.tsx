import { clearAuthToken, getAccessToken, getRefreshToken, saveAccessToken, saveRefreshToken } from '@/lib/secure-store'
import AuthSerice from '@/services/auth.service'
import { IUser } from '@/types/auth'
import React, { createContext, ReactNode, useState, useEffect } from 'react'

export interface AuthContextType {
    isAuth: boolean
    login: (accessToken: string, refreshToken: string, user: IUser) => Promise<void>
    logout: () => Promise<any>
    user: IUser | null
    isLoading: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
    children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<IUser | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        checkAuthStatus()
    }, [])

    const checkAuthStatus = async () => {
        try {
            setIsLoading(true)
            const accessToken = await getAccessToken()
            if (accessToken) {
                try {
                    const res = await AuthSerice.getCurrentUserProfile()
                    if (res && res.data) {
                        setUser({
                            name: res.data.name,
                            role: res.data.role
                        })
                        return
                    }
                } catch (profileError) {
                    console.log('Profile fetch failed, trying refresh token...', profileError)
                    // If profile fetch fails, try refresh token flow
                }
            }

            const refreshToken = await getRefreshToken()
            if (!refreshToken) {
                await clearAuthToken()
                setUser(null)
                return
            }

            try {
                const res = await AuthSerice.refreshToken(refreshToken)
                if (res && res.code === 200 && res.data) {
                    await saveAccessToken(res.data.accessToken)
                    if (res.data.refreshToken) {
                        await saveRefreshToken(res.data.refreshToken)
                    }
                    setUser({
                        name: res.data.name,
                        role: res.data.role
                    })
                } else {
                    await clearAuthToken()
                    setUser(null)
                }
            } catch (refreshError) {
                console.log('Refresh token failed:', refreshError)
                await clearAuthToken()
                setUser(null)
            }
        } catch (error) {
            console.error('Error checking auth status:', error)
            await clearAuthToken()
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }

    const login = async (accessToken: string, refreshToken: string, user: IUser) => {
        try {
            await saveAccessToken(accessToken)
            await saveRefreshToken(refreshToken)
            setUser({
                name: user.name,
                role: user.role
            })
        } catch (error) {
            console.error('Error during login:', error)
            throw error
        }
    }

    const logout = async () => {
        try {
            const refreshToken = await getRefreshToken()
            if (!refreshToken) {
                return
            }
            const res = await AuthSerice.logout(refreshToken)

            await clearAuthToken()
            setUser(null)

            return res
        } catch (error: any) {
            console.error('Error during logout:', error)
            throw error
        }
    }

    const contextValue: AuthContextType = {
        isAuth: !!user,
        login,
        logout,
        user,
        isLoading
    }

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
