import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Middleware to authenticate JWT tokens and verify status is ACTIVE.
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication token is missing' 
    })
  }

  try {
    const secret = process.env.JWT_SECRET || 'your-default-jwt-secret-key-change-in-production'
    const decoded = jwt.verify(token, secret)

    // Query MySQL to verify current status
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account not found' 
      })
    }

    // Critical: Terminate access if user status is BLOCKED
    if (user.status === 'BLOCKED') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is blocked. Please contact administration.' 
      })
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      professionalTitle: user.professionalTitle ?? null
    }

    next()
  } catch (error) {
    console.error('JWT Verification Fail:', error.message)
    return res.status(401).json({ 
      success: false, 
      message: 'Session invalid or expired' 
    })
  }
}

/**
 * Middleware to restrict route to specific roles.
 */
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: Session context missing' 
      })
    }

    if (req.user.role !== role) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: Insufficient privileges' 
      })
    }

    next()
  }
}
