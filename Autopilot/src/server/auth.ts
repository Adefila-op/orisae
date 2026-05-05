import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export interface AuthUser {
  id: string
  wallet_address: string
}

function decodeDevelopmentToken(token: string) {
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64').toString('utf8'))
    if (parsed?.id && parsed?.wallet_address) {
      return parsed as AuthUser
    }
  } catch {
    return null
  }

  return null
}

function parseAuthToken(token: string) {
  const secret = process.env.JWT_SECRET || 'default_secret_for_dev'

  try {
    return jwt.verify(token, secret) as AuthUser
  } catch (error) {
    const devUser = decodeDevelopmentToken(token)
    if (devUser) {
      return devUser
    }

    throw error
  }
}

export function getOptionalUser(request: NextRequest): AuthUser | null {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace(/^Bearer\s+/i, '')

    if (!token) {
      return null
    }

    return parseAuthToken(token)
  } catch {
    return null
  }
}
