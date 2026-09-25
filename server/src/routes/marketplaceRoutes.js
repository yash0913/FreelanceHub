import { Router } from 'express'
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js'
import {
  listCategories, listSkills, listProjects, getProject, listProjectProposals, listFreelancers, getFreelancer,
  getProfile, updateProfile, listMyProjects, createProject, updateProject, listMyProposals,
  createProposal, updateProposal, listContracts, updateContract, listConversations,
  createConversation, listMessages, sendMessage, listPortfolio, createPortfolio,
  updatePortfolio, deletePortfolio, listReviews, createReview, listPayments, createPayment,
  createReport, listMyReports, adminStats, adminProjects, adminReports, updateReport
} from '../controllers/marketplaceController.js'
import {
  listOpportunities, getOpportunity, createOpportunity, updateOpportunity,
  applyOpportunity, listMyApplications, listMyCreatedOpportunities,
  updateApplicationStatus, completeOpportunity, listVerifiedCollaborations
} from '../controllers/collaborationController.js'
import {
  createTicket, listMyTickets, getTicket, adminListTickets, adminUpdateTicket
} from '../controllers/supportController.js'
import { getFaq } from '../controllers/helpController.js'

const router = Router()

// Public Help / FAQ endpoints
router.get('/help/faq', getFaq)
router.get('/faq', getFaq)

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
router.get('/freelancers/:id/verified-collaborations', listVerifiedCollaborations)

// Collaboration opportunities discovery (public)
router.get('/collaborations', listOpportunities)

// Authenticated collaboration endpoints registered before wildcard /collaborations/:id
router.get('/collaborations/mine/created', authenticateToken, listMyCreatedOpportunities)
router.get('/collaborations/mine/applications', authenticateToken, listMyApplications)
router.get('/collaborations/mine/verified', authenticateToken, listVerifiedCollaborations)
router.post('/collaborations', authenticateToken, createOpportunity)
router.patch('/collaborations/applications/:id', authenticateToken, updateApplicationStatus)
router.post('/collaborations/:id/apply', authenticateToken, applyOpportunity)
router.post('/collaborations/:id/complete', authenticateToken, completeOpportunity)
router.patch('/collaborations/:id', authenticateToken, updateOpportunity)
router.get('/collaborations/:id', getOpportunity)

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
router.post('/payments', createPayment)
router.post('/reports', createReport)
router.get('/reports/mine', listMyReports)

// Customer Care / Support tickets
router.post('/support/tickets', createTicket)
router.get('/support/tickets/mine', listMyTickets)
router.get('/support/tickets/:id', getTicket)

// Admin-only operations are kept under their own namespace and guard.
router.get('/admin/stats', requireRole('ADMIN'), adminStats)
router.get('/admin/projects', requireRole('ADMIN'), adminProjects)
router.get('/admin/reports', requireRole('ADMIN'), adminReports)
router.patch('/admin/reports/:id', requireRole('ADMIN'), updateReport)
router.get('/admin/support/tickets', requireRole('ADMIN'), adminListTickets)
router.patch('/admin/support/tickets/:id', requireRole('ADMIN'), adminUpdateTicket)
router.get('/admin/payments', requireRole('ADMIN'), listPayments)

export default router

