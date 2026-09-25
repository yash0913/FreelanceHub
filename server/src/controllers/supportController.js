import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const userSelect = { id: true, name: true, email: true, role: true, professionalTitle: true }

const idOf = (value) => {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

const requireUser = (req, res, roles = []) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' })
    return false
  }
  if (roles.length && !roles.includes(req.user.role)) {
    res.status(403).json({ success: false, message: 'Forbidden for this user role' })
    return false
  }
  return true
}

const respond = (res, data, message = 'Success', status = 200) => {
  return res.status(status).json({ success: true, message, data })
}

const fail = (res, message, status = 400) => {
  return res.status(status).json({ success: false, message })
}

/**
 * Customer & Freelancer: Create Support Ticket
 */
export const createTicket = async (req, res) => {
  try {
    if (!requireUser(req, res, ['CUSTOMER', 'FREELANCER'])) return

    const { subject, category, description, priority, relatedProjectId } = req.body

    if (!subject?.trim()) return fail(res, 'Ticket subject is required')
    if (!description?.trim()) return fail(res, 'Please provide a detailed description of your issue')

    const validCategory = ['ACCOUNT', 'PAYMENTS', 'PROJECT', 'FREELANCER', 'CUSTOMER', 'CONTRACT', 'TECHNICAL', 'OTHER'].includes(category)
      ? category
      : 'OTHER'

    const validPriority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)
      ? priority
      : 'MEDIUM'

    let checkedProjectId = null
    if (relatedProjectId) {
      const pid = idOf(relatedProjectId)
      if (pid) {
        const project = await prisma.project.findUnique({ where: { id: pid } })
        if (project) checkedProjectId = pid
      }
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.user.id,
        subject: subject.trim(),
        category: validCategory,
        priority: validPriority,
        description: description.trim(),
        relatedProjectId: checkedProjectId,
        status: 'OPEN'
      },
      include: {
        user: { select: userSelect },
        relatedProject: { select: { id: true, title: true } }
      }
    })

    return respond(res, ticket, 'Support ticket submitted successfully. Our team will review it shortly.', 201)
  } catch (error) {
    console.error('Create support ticket error:', error)
    return fail(res, 'Unable to submit support ticket', 500)
  }
}

/**
 * Customer & Freelancer: List My Support Tickets
 */
export const listMyTickets = async (req, res) => {
  try {
    if (!requireUser(req, res, ['CUSTOMER', 'FREELANCER', 'ADMIN'])) return

    const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id }

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: { select: userSelect },
        relatedProject: { select: { id: true, title: true } },
        resolvedBy: { select: userSelect }
      },
      orderBy: { createdAt: 'desc' }
    })

    return respond(res, tickets)
  } catch (error) {
    console.error('List support tickets error:', error)
    return fail(res, 'Unable to load support tickets', 500)
  }
}

/**
 * Customer / Freelancer / Admin: Get Single Ticket
 */
export const getTicket = async (req, res) => {
  try {
    if (!requireUser(req, res)) return
    const id = idOf(req.params.id)
    if (!id) return fail(res, 'Invalid ticket identifier')

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: userSelect },
        relatedProject: { select: { id: true, title: true } },
        resolvedBy: { select: userSelect }
      }
    })

    if (!ticket) return fail(res, 'Support ticket not found', 404)

    // Security check: Must be owner or admin
    if (req.user.role !== 'ADMIN' && ticket.userId !== req.user.id) {
      return fail(res, 'You do not have permission to view this ticket', 403)
    }

    return respond(res, ticket)
  } catch (error) {
    console.error('Get support ticket error:', error)
    return fail(res, 'Unable to load ticket details', 500)
  }
}

/**
 * Admin: List All Support Tickets with filtering
 */
export const adminListTickets = async (req, res) => {
  try {
    if (!requireUser(req, res, ['ADMIN'])) return

    const status = req.query.status
    const category = req.query.category
    const priority = req.query.priority

    const where = {
      ...(status && ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'].includes(status) ? { status } : {}),
      ...(category && ['ACCOUNT', 'PAYMENTS', 'PROJECT', 'FREELANCER', 'CUSTOMER', 'CONTRACT', 'TECHNICAL', 'OTHER'].includes(category) ? { category } : {}),
      ...(priority && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority) ? { priority } : {})
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: { select: userSelect },
        relatedProject: { select: { id: true, title: true } },
        resolvedBy: { select: userSelect }
      },
      orderBy: { createdAt: 'desc' }
    })

    return respond(res, tickets)
  } catch (error) {
    console.error('Admin list tickets error:', error)
    return fail(res, 'Unable to load customer support queue', 500)
  }
}

/**
 * Admin: Update Ticket Status & Resolution Notes
 */
export const adminUpdateTicket = async (req, res) => {
  try {
    if (!requireUser(req, res, ['ADMIN'])) return
    const id = idOf(req.params.id)
    if (!id) return fail(res, 'Invalid ticket identifier')

    const ticket = await prisma.supportTicket.findUnique({ where: { id } })
    if (!ticket) return fail(res, 'Support ticket not found', 404)

    const { status, adminNotes } = req.body

    const validStatuses = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED']
    if (status && !validStatuses.includes(status)) {
      return fail(res, 'Unsupported ticket status')
    }

    const isResolving = ['RESOLVED', 'CLOSED'].includes(status)

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(adminNotes !== undefined ? { adminNotes: adminNotes ? String(adminNotes).trim() : null } : {}),
        resolvedById: isResolving ? req.user.id : (status === 'OPEN' || status === 'IN_PROGRESS' ? null : ticket.resolvedById),
        resolvedAt: isResolving ? new Date() : (status === 'OPEN' || status === 'IN_PROGRESS' ? null : ticket.resolvedAt)
      },
      include: {
        user: { select: userSelect },
        relatedProject: { select: { id: true, title: true } },
        resolvedBy: { select: userSelect }
      }
    })

    return respond(res, updated, 'Support ticket updated')
  } catch (error) {
    console.error('Admin update ticket error:', error)
    return fail(res, 'Unable to update support ticket', 500)
  }
}
