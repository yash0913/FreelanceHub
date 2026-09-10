import { Router } from 'express'
import { registerCustomer, registerFreelancer, login, getMe, changePassword } from '../controllers/authController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = Router()

// Public Auth routes
router.post('/register/customer', registerCustomer)
router.post('/register/freelancer', registerFreelancer)
router.post('/login', login)

// Authenticated Auth routes
router.get('/me', authenticateToken, getMe)
router.patch('/change-password', authenticateToken, changePassword)

export default router

