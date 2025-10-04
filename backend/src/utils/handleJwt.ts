import pkg from 'jsonwebtoken'

const { sign, verify } = pkg

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'default_access_token_secret'
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'default_refresh_token_secret'

const ACCESS_TOKEN_EXPIRES_IN = '1d'
const REFRESH_TOKEN_EXPIRES_IN = '30d'

const generateAccessToken = (payload: any) => {
    return sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN })
}

const generateRefreshToken = (payload: any) => {
    return sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN })
}

const verifyAccessToken = (token: string) => {
    return verify(token, ACCESS_TOKEN_SECRET)
}

const verifyRefreshToken = (token: string) => {
    return verify(token, REFRESH_TOKEN_SECRET)
}

export { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken }
