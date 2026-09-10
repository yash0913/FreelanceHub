import { Router } from 'express'
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js'
import {
  listCategories, listSkills, listProjects, getProject, listProjectProposals, listFreelancers, getFreelancer,
  getProfile, updateProfile, listMyProjects, createProject, updateProject, listMyProposals,
  createProposal, updateProposal, listContracts, updateContract, listConversations,
  createConversation, listMessages, sendMessage, listPortfolio, createPortfolio,
  updatePortfolio, deletePortfolio, listReviews, createReview, listPayments,
  createReport, listMyReports, adminStats, adminProjects, adminReports, updateReport
} from '../controllers/marketplaceController.js'

const router = Router()

// Public marketplace discovery.
router.get('/categories', listCategories)
router.get('/skills', listSkills)
router.get('/projects', listProjects)

// Specific project endpoints registered before wildcard /projects/:id
router.get('/projects/mine', authenticateToken, listMyProjects)
router.get('/projects/:id/proposals', authenticateToken, listProjectProposals)
router.post('/projects/:projectId/proposals', authenticateToken, createProposal)
router.post('/projects', authenticateToken, createProject)
router.patch('/projects/:id', authenticateToken, updateProject)

// Public project detail endpoint
router.get('/projects/:id', getProject)

// Freelancer endpoints
router.get('/freelancers', listFreelancers)
router.get('/freelancers/:id', getFreelancer)

// Authenticated marketplace workflows.
router.use(authenticateToken)
router.get('/profile', getProfile)
router.patch('/profile', updateProfile)
router.get('/proposals/mine', listMyProposals)
router.patch('/proposals/:id', updateProposal)
router.get('/contracts/mine', listContracts)
router.patch('/contracts/:id', updateContract)
router.get('/conversations', listConversations)
router.post('/conversations', createConversation)
router.get('/conversations/:id/messages', listMessages)
router.post('/conversations/:id/messages', sendMessage)
router.get('/portfolio', listPortfolio)
router.post('/portfolio', createPortfolio)
router.patch('/portfolio/:id', updatePortfolio)
router.delete('/portfolio/:id', deletePortfolio)
router.get('/reviews/mine', listReviews)
router.post('/reviews', createReview)
router.get('/payments/mine', listPayments)
router.post('/reports', createReport)
router.get('/reports/mine', listMyReports)

// Admin-only operations are kept under their own namespace and guard.
router.get('/admin/stats', requireRole('ADMIN'), adminStats)
router.get('/admin/projects', requireRole('ADMIN'), adminProjects)
router.get('/admin/reports', requireRole('ADMIN'), adminReports)
router.patch('/admin/reports/:id', requireRole('ADMIN'), updateReport)

export default router
