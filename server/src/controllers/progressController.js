import { PrismaClient } from '@prisma/client'
import { authorizeProgressUpdate } from '../utils/progressAuthorization.js'
import { validateProgressSubmission, validateProgressTransition } from '../utils/progressValidation.js'

const prisma = new PrismaClient()

const userSelect = { id: true, name: true, email: true, role: true, status: true, professionalTitle: true }

const idOf = (value) => {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

const respond = (res, data, message = 'Success', status = 200) => {
  return res.status(status).json({ success: true, message, data })
}

const fail = (res, message = 'Operation failed', status = 400) => {
  return res.status(status).json({ success: false, message })
}

const VALID_STAGES = [
  'REQUIREMENTS',
  'DEVELOPMENT',
  'CLIENT_REVIEW',
  'REVISIONS',
  'FINAL_DELIVERY',
  'COMPLETED'
]

const VALID_PROGRESS_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'CLIENT_REVIEW',
  'WAITING_FOR_CLIENT',
  'BLOCKED',
  'COMPLETED'
]

let progressIdempotencyColumnAvailable
const hasProgressIdempotencyColumn = async () => {
  if (progressIdempotencyColumnAvailable !== undefined) return progressIdempotencyColumnAvailable
  try {
    const rows = await prisma.$queryRaw`
      SELECT 1 AS present
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'ProjectProgressUpdate'
        AND COLUMN_NAME = 'submissionId'
      LIMIT 1
    `
    progressIdempotencyColumnAvailable = rows.length > 0
  } catch (error) {
    // Older databases remain usable; idempotency storage becomes active after
    // the additive migration is applied and the server process restarts.
    console.warn('Progress idempotency column is unavailable; using legacy schema compatibility mode.')
    progressIdempotencyColumnAvailable = false
  }
  return progressIdempotencyColumnAvailable
}

const STAGE_LABELS = {
  REQUIREMENTS: 'Requirements / Planning',
  DEVELOPMENT: 'Development / Work in Progress',
  CLIENT_REVIEW: 'Review / Client Feedback',
  REVISIONS: 'Revisions',
  FINAL_DELIVERY: 'Final Delivery',
  COMPLETED: 'Completed'
}

/**
 * Get project progress and full history
 */
export const getProjectProgress = async (req, res) => {
  try {
    const projectId = idOf(req.params.id)
    if (!projectId) return fail(res, 'Invalid project ID', 400)

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: { select: userSelect },
        contract: {
          include: {
            freelancer: { select: userSelect },
            client: { select: userSelect }
          }
        },
        progressUpdates: {
          select: {
            id: true,
            projectId: true,
            contractId: true,
            updatedById: true,
            stage: true,
            progressPercentage: true,
            status: true,
            note: true,
            actionRequired: true,
            actionNote: true,
            expectedCompletion: true,
            createdAt: true,
            updatedBy: { select: userSelect }
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
        }
      }
    })

    if (!project) return fail(res, 'Project not found', 404)

    // Authorization: User must be Client of the project, Freelancer of the contract, or ADMIN
    const isClient = req.user.role === 'CUSTOMER' && project.clientId === req.user.id
    const isFreelancer = req.user.role === 'FREELANCER' && project.contract?.freelancerId === req.user.id
    const isAdmin = req.user.role === 'ADMIN'

    if (!isClient && !isFreelancer && !isAdmin) {
      return fail(res, 'You are not authorized to view progress for this project', 403)
    }

    const updates = project.progressUpdates || []
    const latest = updates[0] || null

    // Check overdue status
    const now = new Date()
    const targetDate = latest?.expectedCompletion || project.deadline || project.contract?.endDate
    const isOverdue = targetDate && new Date(targetDate) < now && project.status !== 'COMPLETED'

    const currentProgress = latest ? {
      id: latest.id,
      stage: latest.stage,
      stageLabel: STAGE_LABELS[latest.stage] || latest.stage,
      progressPercentage: latest.progressPercentage,
      status: latest.status,
      note: latest.note,
      actionRequired: latest.actionRequired,
      actionNote: latest.actionNote,
      expectedCompletion: latest.expectedCompletion || project.deadline || null,
      updatedAt: latest.createdAt,
      updatedBy: latest.updatedBy
    } : {
      stage: 'REQUIREMENTS',
      stageLabel: STAGE_LABELS['REQUIREMENTS'],
      progressPercentage: project.status === 'COMPLETED' ? 100 : 0,
      status: project.status === 'COMPLETED' ? 'COMPLETED' : 'NOT_STARTED',
      note: 'No progress updates posted yet.',
      actionRequired: false,
      actionNote: null,
      expectedCompletion: project.deadline || null,
      updatedAt: project.updatedAt,
      updatedBy: null
    }

    return respond(res, {
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
        deadline: project.deadline,
        client: project.client
      },
      contract: project.contract,
      currentProgress,
      isOverdue,
      stages: VALID_STAGES.map(key => ({ key, label: STAGE_LABELS[key] })),
      history: updates.map(u => ({
        ...u,
        stageLabel: STAGE_LABELS[u.stage] || u.stage
      }))
    })
  } catch (error) {
    console.error('getProjectProgress Error:', error)
    return fail(res, 'Unable to load project progress', 500)
  }
}

/**
 * Freelancer updates progress for an active project
 */
export const createProjectProgressUpdate = async (req, res) => {
  try {
    const projectId = idOf(req.params.id)
    if (!projectId) return fail(res, 'Invalid project ID', 400)

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        contract: {
          include: {
            proposal: {
              select: {
                id: true,
                projectId: true,
                status: true,
                freelancerProfile: { select: { userId: true } }
              }
            }
          }
        }
      }
    })

    if (!project) return fail(res, 'Project not found', 404)
    const authorization = authorizeProgressUpdate(req.user, project)
    if (authorization) return fail(res, authorization.message, authorization.status)

    const requestKey = req.get('Idempotency-Key')
    const validation = validateProgressSubmission(req.body, requestKey)
    if (validation.error) return fail(res, validation.error, 422)
    const updateData = validation.data
    const supportsIdempotency = await hasProgressIdempotencyColumn()

    if (supportsIdempotency) {
      const existingRequest = await prisma.projectProgressUpdate.findUnique({
        where: { projectId_submissionId: { projectId, submissionId: updateData.submissionId } },
        select: {
          id: true,
          projectId: true,
          contractId: true,
          updatedById: true,
          stage: true,
          progressPercentage: true,
          status: true,
          note: true,
          actionRequired: true,
          actionNote: true,
          expectedCompletion: true,
          createdAt: true,
          updatedBy: { select: userSelect }
        }
      })
      if (existingRequest) {
        return respond(res, existingRequest, 'Project progress update already saved', 200)
      }
    }

    const previous = await prisma.projectProgressUpdate.findFirst({
      where: { projectId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { id: true, stage: true, status: true, progressPercentage: true }
    })
    const transitionError = validateProgressTransition(previous, updateData)
    if (transitionError) return fail(res, transitionError, 409)

    const progressUpdate = await prisma.$transaction(async (tx) => {
      const update = await tx.projectProgressUpdate.create({
        data: {
          projectId,
          contractId: project.contract.id,
          updatedById: req.user.id,
          stage: updateData.stage,
          progressPercentage: updateData.progressPercentage,
          status: updateData.status,
          note: updateData.note,
          actionRequired: updateData.actionRequired,
          actionNote: updateData.actionNote,
          expectedCompletion: updateData.expectedCompletion,
          ...(supportsIdempotency ? { submissionId: updateData.submissionId } : {})
        },
        select: {
          id: true,
          projectId: true,
          contractId: true,
          updatedById: true,
          stage: true,
          progressPercentage: true,
          status: true,
          note: true,
          actionRequired: true,
          actionNote: true,
          expectedCompletion: true,
          createdAt: true,
          updatedBy: { select: userSelect }
        }
      })

      const stageName = STAGE_LABELS[updateData.stage] || updateData.stage
      const notifTitle = updateData.actionRequired
        ? `Action Required: ${project.title}`
        : updateData.completionRequested
          ? `Project Completed: ${project.title}`
          : `Progress Update: ${project.title}`
      const notifMsg = updateData.actionRequired
        ? `${req.user.name} requested action on "${project.title}": ${updateData.actionNote}`
        : `${req.user.name} updated "${project.title}" to ${stageName} (${updateData.progressPercentage}%). ${updateData.note}`
      await tx.notification.create({
        data: {
          userId: project.clientId,
          title: notifTitle,
          message: notifMsg.trim(),
          type: updateData.actionRequired ? 'ACTION_REQUIRED' : updateData.completionRequested ? 'COMPLETED' : 'PROGRESS_UPDATE',
          link: `/customer/projects/${project.id}`
        }
      })
      return update
    })

    return respond(res, {
      ...progressUpdate,
      stageLabel: STAGE_LABELS[progressUpdate.stage] || progressUpdate.stage
    }, 'Project progress updated successfully', 201)
  } catch (error) {
    if (error?.code === 'P2002') {
      return fail(res, 'This progress update has already been recorded', 409)
    }
    console.error('createProjectProgressUpdate Error:', error)
    return fail(res, 'Unable to update project progress', 500)
  }
}

export const listNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 40
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    })

    return respond(res, {
      notifications,
      unreadCount
    })
  } catch (error) {
    console.error('listNotifications Error:', error)
    return fail(res, 'Unable to load notifications', 500)
  }
}

/**
 * Mark a single notification as read
 */
export const markNotificationRead = async (req, res) => {
  try {
    const id = idOf(req.params.id)
    if (!id) return fail(res, 'Invalid notification ID', 400)

    const notif = await prisma.notification.findUnique({ where: { id } })
    if (!notif) return fail(res, 'Notification not found', 404)
    if (notif.userId !== req.user.id) return fail(res, 'Unauthorized', 403)

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    })

    return respond(res, updated, 'Notification marked as read')
  } catch (error) {
    console.error('markNotificationRead Error:', error)
    return fail(res, 'Unable to update notification', 500)
  }
}

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    })

    return respond(res, { success: true }, 'All notifications marked as read')
  } catch (error) {
    console.error('markAllNotificationsRead Error:', error)
    return fail(res, 'Unable to update notifications', 500)
  }
}
