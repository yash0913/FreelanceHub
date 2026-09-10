import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Email regex validator helper
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Register a Customer user account
 */
export const registerCustomer = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body

    // 1. Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'All registration fields are required' 
      })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email address format' 
      })
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Passwords do not match' 
      })
    }

    // 2. Uniqueness Check
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is already registered' 
      })
    }

    // 3. Password Hashing
    const passwordHash = await bcrypt.hash(password, 10)

    // 4. Persistence
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE'
      }
    })

    return res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Customer Register Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred during registration' 
    })
  }
}

/**
 * Register a Freelancer user account
 */
export const registerFreelancer = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, professionalTitle } = req.body

    // 1. Validation
    if (!name || !email || !password || !confirmPassword || !professionalTitle) {
      return res.status(400).json({ 
        success: false, 
        message: 'All registration fields are required' 
      })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email address format' 
      })
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Passwords do not match' 
      })
    }

    if (!professionalTitle.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Professional title cannot be blank' 
      })
    }

    // 2. Uniqueness Check
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is already registered' 
      })
    }

    // 3. Password Hashing
    const passwordHash = await bcrypt.hash(password, 10)

    // 4. Persistence
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'FREELANCER',
        status: 'ACTIVE',
        professionalTitle,
        freelancerProfile: { create: {} }
      }
    })

    return res.status(201).json({
      success: true,
      message: 'Freelancer registered successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        professionalTitle: user.professionalTitle,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Freelancer Register Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred during registration' 
    })
  }
}

/**
 * Common user login endpoint
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      })
    }

    // 1. Fetch from Database
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      })
    }

    // 2. Account block check
    if (user.status === 'BLOCKED') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account is blocked. Access denied.' 
      })
    }

    // 3. Verify bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      })
    }

    // 4. Sign token
    const secret = process.env.JWT_SECRET || 'your-default-jwt-secret-key-change-in-production'
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      secret,
      { expiresIn: '24h' }
    )

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          professionalTitle: user.professionalTitle
        }
      }
    })
  } catch (error) {
    console.error('Login Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred during authentication' 
    })
  }
}

/**
 * Retrieve current active session user info
 */
export const getMe = async (req, res) => {
  try {
    // req.user populated from active JWT middleware check
    return res.status(200).json({
      success: true,
      data: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status,
        professionalTitle: req.user.professionalTitle ?? null
      }
    })
  } catch (error) {
    console.error('GetMe Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred while fetching user profile' 
    })
  }
}

/**
 * Change authenticated user's password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      })
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      })
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password'
      })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash }
    })

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    })
  } catch (error) {
    console.error('ChangePassword Error:', error)
    return res.status(500).json({
      success: false,
      message: 'An error occurred while changing password'
    })
  }
}

