import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Get all system users with optional role or status query filters
 */
export const getUsers = async (req, res) => {
  try {
    const { role, status } = req.query

    // Filter assembly
    const where = {}
    if (role && ['CUSTOMER', 'FREELANCER', 'ADMIN'].includes(role.toUpperCase())) {
      where.role = role.toUpperCase()
    }
    if (status && ['ACTIVE', 'BLOCKED'].includes(status.toUpperCase())) {
      where.status = status.toUpperCase()
    }

    // Fetch and exclude password hash
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        professionalTitle: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return res.status(200).json({
      success: true,
      data: users
    })
  } catch (error) {
    console.error('Admin getUsers Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve system users directory' 
    })
  }
}

/**
 * Get single user profile by numeric ID
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params
    const userId = parseInt(id)

    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID parameter' 
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        professionalTitle: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User account not found' 
      })
    }

    return res.status(200).json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Admin getUserById Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve user details' 
    })
  }
}

/**
 * Suspend/Block a system user
 */
export const blockUser = async (req, res) => {
  try {
    const { id } = req.params
    const targetUserId = parseInt(id)
    const currentAdminId = req.user.id

    if (isNaN(targetUserId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID parameter' 
      })
    }

    // 1. Fetch target account
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User account not found' 
      })
    }

    // 2. Safeguards checking
    if (targetUserId === currentAdminId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Self-moderation is invalid: You cannot block your own administrative account.' 
      })
    }

    if (targetUser.role === 'ADMIN') {
      return res.status(400).json({ 
        success: false, 
        message: 'Moderation block rejected: Administrators cannot block other administrators.' 
      })
    }

    // 3. Update database status
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { status: 'BLOCKED' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    })

    return res.status(200).json({
      success: true,
      message: 'User account successfully blocked',
      data: updatedUser
    })
  } catch (error) {
    console.error('Admin blockUser Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to complete user block action' 
    })
  }
}

/**
 * Activate/Unblock a system user
 */
export const unblockUser = async (req, res) => {
  try {
    const { id } = req.params
    const targetUserId = parseInt(id)

    if (isNaN(targetUserId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID parameter' 
      })
    }

    // 1. Fetch target account
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User account not found' 
      })
    }

    // 2. Update database status
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    })

    return res.status(200).json({
      success: true,
      message: 'User account successfully unblocked',
      data: updatedUser
    })
  } catch (error) {
    console.error('Admin unblockUser Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to complete user unblock action' 
    })
  }
}
