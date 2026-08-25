import { Router } from 'express'
import { getUsers, getUserById, blockUser, unblockUser } from '../controllers/adminController.js'
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js'

const router = Router()

// Apply authentication + role restriction to all nested admin paths
router.use(authenticateToken)
router.use(requireRole('ADMIN'))

router.get('/users', getUsers)
router.get('/users/:id', getUserById)
router.patch('/users/:id/block', blockUser)
router.patch('/users/:id/unblock', unblockUser)

export default router
