import { clearAuthToken, getAccessToken, getRefreshToken, saveAccessToken, saveRefreshToken } from '@/lib/secure-store'
import AuthSerice from '@/services/auth.service'
import { IUser } from '@/types/auth'
import React, { createContext, ReactNode, useState, useEffect } from 'react'

export interface AuthContextType {
    isAuth: boolean
    login: (accessToken: string, refreshToken: string, user: IUser) => Promise<void>
    logout: () => Promise<any>
    user: IUser | null
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
    children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<IUser | null>(null)

    useEffect(() => {
        checkAuthStatus()
    }, [])

    const checkAuthStatus = async () => {
        try {
            const accessToken = await getAccessToken()
            if (accessToken) {
                const res = await AuthSerice.getCurrentUserProfile()
                setUser({
                    name: res.data.name,
                    role: res.data.email
                })
                return
            }

            const refreshToken = await getRefreshToken()
            if (!refreshToken) {
                return
            }

            const res = await AuthSerice.refreshToken(refreshToken)
            if (res.code === 200) {
                await saveAccessToken(res.data.accessToken)
                setUser({
                    name: res.data.name,
                    role: res.data.email
                })
            } else {
                await clearAuthToken()
                setUser(null)
            }
        } catch (error) {
            console.error('Error checking auth status:', error)
            throw error
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
        user
    }

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
