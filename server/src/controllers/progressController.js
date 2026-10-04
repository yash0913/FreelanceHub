import { PrismaClient } from '@prisma/client'

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
          include: {
            updatedBy: { select: userSelect }
          },
          orderBy: { createdAt: 'desc' }
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
      include: { contract: true }
    })

    if (!project) return fail(res, 'Project not found', 404)

    // Admins retain their existing operational override. Other users must be
    // the freelancer assigned to this exact project's contract.
    const isFreelancer = req.user.role === 'FREELANCER' && project.contract?.freelancerId === req.user.id
    const isAdmin = req.user.role === 'ADMIN'
    if (!isFreelancer && !isAdmin) {
      return fail(res, 'Only the assigned freelancer or an admin can update progress for this project', 403)
    }

    const {
      stage,
      progressPercentage,
      status,
      note,
      actionRequired,
      actionNote,
      expectedCompletion
    } = req.body

    if (!stage || !VALID_STAGES.includes(stage)) {
      return fail(res, `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}`, 400)
    }

    const percentage = Number(progressPercentage)
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      return fail(res, 'Progress percentage must be between 0 and 100', 400)
    }
    if (status !== undefined && !VALID_PROGRESS_STATUSES.includes(status)) {
      return fail(res, `Invalid progress status. Must be one of: ${VALID_PROGRESS_STATUSES.join(', ')}`, 400)
    }
    if (actionRequired !== undefined && typeof actionRequired !== 'boolean') {
      return fail(res, 'Action required must be a boolean', 400)
    }

    const requestedDate = expectedCompletion ? new Date(expectedCompletion) : null
    if (requestedDate && !Number.isFinite(requestedDate.getTime())) {
      return fail(res, 'Expected completion must be a valid date', 400)
    }

    const roundedPercentage = Math.round(percentage)
    const isComplete = stage === 'COMPLETED' || status === 'COMPLETED' || roundedPercentage === 100
    const savedPercentage = isComplete ? 100 : roundedPercentage
    const savedStage = isComplete ? 'COMPLETED' : stage
    const savedStatus = isComplete ? 'COMPLETED' : (status || 'IN_PROGRESS')
    const requiresAction = actionRequired === true
    const cleanNote = note ? String(note).trim() : null
    const cleanActionNote = requiresAction && actionNote ? String(actionNote).trim() : null
    const targetDate = requestedDate

    const progressUpdate = await prisma.$transaction(async (tx) => {
      const update = await tx.projectProgressUpdate.create({
        data: {
          projectId,
          contractId: project.contract?.id || null,
          updatedById: req.user.id,
          stage: savedStage,
          progressPercentage: savedPercentage,
          status: savedStatus,
          note: cleanNote,
          actionRequired: requiresAction,
          actionNote: cleanActionNote,
          expectedCompletion: targetDate
        },
        include: { updatedBy: { select: userSelect } }
      })

      if (isComplete) {
        // These are the existing Prisma enum values: ProjectStatus.COMPLETED
        // and ContractStatus.COMPLETED (not progress-only status strings).
        await tx.project.update({ where: { id: projectId }, data: { status: 'COMPLETED' } })
        if (project.contract) {
          await tx.contract.update({
            where: { id: project.contract.id },
            data: { status: 'COMPLETED', endDate: new Date() }
          })
        }
      }

      const stageName = STAGE_LABELS[savedStage] || savedStage
      const notifTitle = requiresAction
        ? `Action Required: ${project.title}`
        : isComplete
          ? `Project Completed: ${project.title}`
          : `Progress Update: ${project.title}`
      const notifMsg = requiresAction
        ? `${req.user.name} requested action on "${project.title}": ${cleanActionNote || 'Please review progress.'}`
        : `${req.user.name} updated "${project.title}" to ${stageName} (${savedPercentage}%). ${cleanNote || ''}`
      await tx.notification.create({
        data: {
          userId: project.clientId,
          title: notifTitle,
          message: notifMsg.trim(),
          type: requiresAction ? 'ACTION_REQUIRED' : isComplete ? 'COMPLETED' : 'PROGRESS_UPDATE',
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
