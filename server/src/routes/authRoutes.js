import { Router } from 'express'
import { registerCustomer, registerFreelancer, login, getMe } from '../controllers/authController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = Router()

// Public Auth routes
router.post('/register/customer', registerCustomer)
router.post('/register/freelancer', registerFreelancer)
router.post('/login', login)

// Authenticated Auth routes
router.get('/me', authenticateToken, getMe)

export default router
