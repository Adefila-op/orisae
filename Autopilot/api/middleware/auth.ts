import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: {
    id: string
    wallet_address: string
  }
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' })
    }
    
    const secret = process.env.JWT_SECRET || 'default_secret_for_dev'
    const decoded = jwt.verify(token, secret) as any
    req.user = decoded
    next()
  } catch (error: any) {
    console.error('Auth error:', error.message)
    return res.status(401).json({ error: 'Unauthorized: Invalid token' })
  }
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')
    
    if (token) {
      const secret = process.env.JWT_SECRET || 'default_secret_for_dev'
      const decoded = jwt.verify(token, secret) as any
      req.user = decoded
    }
  } catch (error: any) {
    console.error('Optional auth error:', error.message)
    // Silent fail for optional auth
  }
  
  next()
}
