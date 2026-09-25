import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  professionalTitle: true,
  freelancerProfile: {
    select: {
      id: true,
      bio: true,
      hourlyRate: true,
      experienceLevel: true,
      location: true,
      availability: true,
      skills: {
        include: { skill: true }
      }
    }
  }
}

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
 * Public & Freelancer: Discover Collaboration Opportunities
 */
export const listOpportunities = async (req, res) => {
  try {
    const { search, type, workMode, compensationType, status, skill } = req.query

    const validStatus = status && ['OPEN', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ALL'].includes(status)
      ? (status === 'ALL' ? undefined : status)
      : 'OPEN'

    const where = {
      ...(validStatus ? { status: validStatus } : {}),
      ...(type && ['INTERNSHIP', 'PROJECT_COLLABORATION', 'FREELANCE_ASSISTANCE', 'CO_FREELANCER', 'MENTORSHIP'].includes(type) ? { type } : {}),
      ...(workMode && ['REMOTE', 'ON_SITE', 'HYBRID'].includes(workMode) ? { workMode } : {}),
      ...(compensationType && ['UNPAID', 'PAID', 'NEGOTIABLE'].includes(compensationType) ? { compensationType } : {}),
      ...(search ? {
        OR: [
          { title: { contains: String(search).trim() } },
          { roleNeeded: { contains: String(search).trim() } },
          { description: { contains: String(search).trim() } },
          { skills: { contains: String(search).trim() } }
        ]
      } : {}),
      ...(skill ? { skills: { contains: String(skill).trim() } } : {})
    }

    const opportunities = await prisma.collaborationOpportunity.findMany({
      where,
      include: {
        creator: { select: userSelect },
        relatedProject: { select: { id: true, title: true, budget: true, status: true } },
        _count: {
          select: { applications: true, verifiedWorks: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return respond(res, opportunities)
  } catch (error) {
    console.error('List collaboration opportunities error:', error)
    return fail(res, 'Unable to load collaboration opportunities', 500)
  }
}

/**
 * Get Single Opportunity Details
 */
export const getOpportunity = async (req, res) => {
  try {
    const id = idOf(req.params.id)
    if (!id) return fail(res, 'Invalid opportunity identifier')

    const opportunity = await prisma.collaborationOpportunity.findUnique({
      where: { id },
      include: {
        creator: { select: userSelect },
        relatedProject: { select: { id: true, title: true, budget: true, status: true, description: true } },
        applications: req.user ? {
          where: req.user.role === 'FREELANCER' && req.user.id !== undefined ? undefined : { id: 0 },
          include: {
            applicant: { select: userSelect }
          },
          orderBy: { createdAt: 'desc' }
        } : false,
        verifiedWorks: {
          include: {
            freelancer: { select: userSelect }
          }
        },
        _count: {
          select: { applications: true }
        }
      }
    })

    if (!opportunity) return fail(res, 'Collaboration opportunity not found', 404)

    // Security filter: If user is not the creator, only return their own application (if any)
    if (opportunity.applications && (!req.user || req.user.id !== opportunity.creatorId)) {
      opportunity.applications = opportunity.applications.filter((app) => app.applicantId === req.user?.id)
    }

    return respond(res, opportunity)
  } catch (error) {
    console.error('Get opportunity error:', error)
    return fail(res, 'Unable to load opportunity details', 500)
  }
}

/**
 * Freelancer: Create Collaboration Opportunity
 */
export const createOpportunity = async (req, res) => {
  try {
    if (!requireUser(req, res, ['FREELANCER'])) return

    const {
      title,
      roleNeeded,
      description,
      expectedContribution,
      type,
      compensationType,
      compensation,
      workMode,
      location,
      duration,
      startDate,
      endDate,
      maxCollaborators,
      requirements,
      skills,
      relatedProjectId
    } = req.body

    if (!title?.trim()) return fail(res, 'Collaboration title is required')
    if (!roleNeeded?.trim()) return fail(res, 'Role needed is required (e.g. Frontend Developer, UI Designer)')
    if (!description?.trim()) return fail(res, 'Please provide a description of the collaboration')

    const validType = ['INTERNSHIP', 'PROJECT_COLLABORATION', 'FREELANCE_ASSISTANCE', 'CO_FREELANCER', 'MENTORSHIP'].includes(type)
      ? type
      : 'PROJECT_COLLABORATION'

    const validCompType = ['UNPAID', 'PAID', 'NEGOTIABLE'].includes(compensationType)
      ? compensationType
      : 'UNPAID'

    const validWorkMode = ['REMOTE', 'ON_SITE', 'HYBRID'].includes(workMode)
      ? workMode
      : 'REMOTE'

    let checkedProjectId = null
    if (relatedProjectId) {
      const pid = idOf(relatedProjectId)
      if (pid) {
        const project = await prisma.project.findUnique({ where: { id: pid } })
        if (project) checkedProjectId = pid
      }
    }

    const opportunity = await prisma.collaborationOpportunity.create({
      data: {
        creatorId: req.user.id,
        title: title.trim(),
        roleNeeded: roleNeeded.trim(),
        description: description.trim(),
        expectedContribution: expectedContribution ? String(expectedContribution).trim() : null,
        type: validType,
        compensationType: validCompType,
        compensation: compensation ? String(compensation).trim() : null,
        workMode: validWorkMode,
        location: location ? String(location).trim() : null,
        duration: duration ? String(duration).trim() : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        maxCollaborators: Math.max(1, Number(maxCollaborators) || 1),
        requirements: requirements ? String(requirements).trim() : null,
        skills: skills ? (Array.isArray(skills) ? skills.join(', ') : String(skills).trim()) : null,
        relatedProjectId: checkedProjectId,
        status: 'OPEN'
      },
      include: {
        creator: { select: userSelect },
        relatedProject: { select: { id: true, title: true } }
      }
    })

    return respond(res, opportunity, 'Collaboration opportunity posted successfully', 201)
  } catch (error) {
    console.error('Create collaboration opportunity error:', error)
    return fail(res, 'Unable to create collaboration opportunity', 500)
  }
}

/**
 * Freelancer: Update Collaboration Opportunity
 */
export const updateOpportunity = async (req, res) => {
  try {
    if (!requireUser(req, res, ['FREELANCER'])) return
    const id = idOf(req.params.id)
    if (!id) return fail(res, 'Invalid opportunity identifier')

    const opportunity = await prisma.collaborationOpportunity.findUnique({ where: { id } })
    if (!opportunity) return fail(res, 'Collaboration opportunity not found', 404)

    // Security check: Only creator can update
    if (opportunity.creatorId !== req.user.id) {
      return fail(res, 'You can only update opportunities you created', 403)
    }

    const {
      title,
      roleNeeded,
      description,
      expectedContribution,
      type,
      compensationType,
      compensation,
      workMode,
      location,
      duration,
      startDate,
      endDate,
      maxCollaborators,
      requirements,
      skills,
      status
    } = req.body

    const validStatuses = ['OPEN', 'ACTIVE', 'COMPLETED', 'CANCELLED']
    if (status && !validStatuses.includes(status)) {
      return fail(res, 'Unsupported opportunity status')
    }

    // If changing to COMPLETED, delegate to complete workflow
    if (status === 'COMPLETED' && opportunity.status !== 'COMPLETED') {
      return await completeCollaborationLogic(req, res, opportunity)
    }

    const updated = await prisma.collaborationOpportunity.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: String(title).trim() } : {}),
        ...(roleNeeded !== undefined ? { roleNeeded: String(roleNeeded).trim() } : {}),
        ...(description !== undefined ? { description: String(description).trim() } : {}),
        ...(expectedContribution !== undefined ? { expectedContribution: expectedContribution ? String(expectedContribution).trim() : null } : {}),
        ...(type && ['INTERNSHIP', 'PROJECT_COLLABORATION', 'FREELANCE_ASSISTANCE', 'CO_FREELANCER', 'MENTORSHIP'].includes(type) ? { type } : {}),
        ...(compensationType && ['UNPAID', 'PAID', 'NEGOTIABLE'].includes(compensationType) ? { compensationType } : {}),
        ...(compensation !== undefined ? { compensation: compensation ? String(compensation).trim() : null } : {}),
        ...(workMode && ['REMOTE', 'ON_SITE', 'HYBRID'].includes(workMode) ? { workMode } : {}),
        ...(location !== undefined ? { location: location ? String(location).trim() : null } : {}),
        ...(duration !== undefined ? { duration: duration ? String(duration).trim() : null } : {}),
        ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
        ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
        ...(maxCollaborators !== undefined ? { maxCollaborators: Math.max(1, Number(maxCollaborators) || 1) } : {}),
        ...(requirements !== undefined ? { requirements: requirements ? String(requirements).trim() : null } : {}),
        ...(skills !== undefined ? { skills: skills ? (Array.isArray(skills) ? skills.join(', ') : String(skills).trim()) : null } : {}),
        ...(status ? { status } : {})
      },
      include: {
        creator: { select: userSelect },
        relatedProject: { select: { id: true, title: true } }
      }
    })

    return respond(res, updated, 'Opportunity updated')
  } catch (error) {
    console.error('Update collaboration opportunity error:', error)
    return fail(res, 'Unable to update collaboration opportunity', 500)
  }
}

/**
 * Freelancer: Apply to Join Collaboration
 */
export const applyOpportunity = async (req, res) => {
  try {
    if (!requireUser(req, res, ['FREELANCER'])) return
    const opportunityId = idOf(req.params.id)
    if (!opportunityId) return fail(res, 'Invalid opportunity identifier')

    const opportunity = await prisma.collaborationOpportunity.findUnique({
      where: { id: opportunityId },
      include: { applications: true }
    })
    if (!opportunity) return fail(res, 'Collaboration opportunity not found', 404)

    // Cannot apply to own opportunity
    if (opportunity.creatorId === req.user.id) {
      return fail(res, 'You cannot apply to your own collaboration opportunity')
    }

    // Opportunity must be OPEN
    if (opportunity.status !== 'OPEN') {
      return fail(res, 'This collaboration opportunity is no longer open for applications')
    }

    // Check duplicate application
    const existing = await prisma.collaborationApplication.findUnique({
      where: {
        opportunityId_applicantId: {
          opportunityId,
          applicantId: req.user.id
        }
      }
    })
    if (existing) {
      return fail(res, `You have already applied to this opportunity (Status: ${existing.status})`)
    }

    const message = String(req.body.message || '').trim()
    if (!message) return fail(res, 'Please include a message or note explaining how you can contribute')

    const application = await prisma.collaborationApplication.create({
      data: {
        opportunityId,
        applicantId: req.user.id,
        message,
        status: 'PENDING'
      },
      include: {
        applicant: { select: userSelect },
        opportunity: {
          include: {
            creator: { select: userSelect }
          }
        }
      }
    })

    return respond(res, application, 'Application submitted successfully', 201)
  } catch (error) {
    console.error('Apply collaboration error:', error)
    return fail(res, 'Unable to submit application', 500)
  }
}

/**
 * Freelancer: List My Submitted Applications
 */
export const listMyApplications = async (req, res) => {
  try {
    if (!requireUser(req, res, ['FREELANCER'])) return

    const applications = await prisma.collaborationApplication.findMany({
      where: { applicantId: req.user.id },
      include: {
        opportunity: {
          include: {
            creator: { select: userSelect },
            relatedProject: { select: { id: true, title: true } }
          }
        },
        verifiedWork: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return respond(res, applications)
  } catch (error) {
    console.error('List my applications error:', error)
    return fail(res, 'Unable to load applications', 500)
  }
}

/**
 * Freelancer: List Opportunities Created by Current User (with all applicants)
 */
export const listMyCreatedOpportunities = async (req, res) => {
  try {
    if (!requireUser(req, res, ['FREELANCER'])) return

    const opportunities = await prisma.collaborationOpportunity.findMany({
      where: { creatorId: req.user.id },
      include: {
        applications: {
          include: {
            applicant: { select: userSelect }
          },
          orderBy: { createdAt: 'desc' }
        },
        relatedProject: { select: { id: true, title: true } },
        verifiedWorks: {
          include: {
            freelancer: { select: userSelect }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return respond(res, opportunities)
  } catch (error) {
    console.error('List created opportunities error:', error)
    return fail(res, 'Unable to load your created opportunities', 500)
  }
}

/**
 * Update Application Status (Owner can ACCEPT/REJECT, Applicant can WITHDRAW)
 */
export const updateApplicationStatus = async (req, res) => {
  try {
    if (!requireUser(req, res, ['FREELANCER'])) return
    const id = idOf(req.params.id)
    if (!id) return fail(res, 'Invalid application identifier')

    const application = await prisma.collaborationApplication.findUnique({
      where: { id },
      include: { opportunity: true }
    })
    if (!application) return fail(res, 'Application not found', 404)

    const { status } = req.body
    if (!['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(status)) {
      return fail(res, 'Unsupported application status')
    }

    const isCreator = application.opportunity.creatorId === req.user.id
    const isApplicant = application.applicantId === req.user.id

    if (status === 'WITHDRAWN') {
      if (!isApplicant) return fail(res, 'Only the applicant can withdraw this application', 403)
    } else {
      if (!isCreator) return fail(res, 'Only the opportunity creator can accept or reject applications', 403)
    }

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.collaborationApplication.update({
        where: { id },
        data: { status },
        include: {
          applicant: { select: userSelect },
          opportunity: true
        }
      })

      // If accepted, check if opportunity should move to ACTIVE
      if (status === 'ACCEPTED') {
        const acceptedCount = await tx.collaborationApplication.count({
          where: { opportunityId: application.opportunityId, status: 'ACCEPTED' }
        })
        if (acceptedCount >= application.opportunity.maxCollaborators && application.opportunity.status === 'OPEN') {
          await tx.collaborationOpportunity.update({
            where: { id: application.opportunityId },
            data: { status: 'ACTIVE' }
          })
        }
      }

      return app
    })

    return respond(res, updated, `Application status updated to ${status}`)
  } catch (error) {
    console.error('Update application status error:', error)
    return fail(res, 'Unable to update application status', 500)
  }
}

/**
 * Owner: Complete Collaboration and Generate Verified Work History
 */
const completeCollaborationLogic = async (req, res, opportunity) => {
  // Fetch all accepted applications
  const acceptedApps = await prisma.collaborationApplication.findMany({
    where: { opportunityId: opportunity.id, status: 'ACCEPTED' },
    include: { applicant: { select: userSelect } }
  })

  const result = await prisma.$transaction(async (tx) => {
    // 1. Mark opportunity COMPLETED
    const completedOpp = await tx.collaborationOpportunity.update({
      where: { id: opportunity.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      },
      include: {
        creator: { select: userSelect }
      }
    })

    // 2. Generate VerifiedCollaboration for each accepted collaborator
    for (const app of acceptedApps) {
      await tx.verifiedCollaboration.upsert({
        where: { applicationId: app.id },
        create: {
          freelancerId: app.applicantId,
          collaboratorId: opportunity.creatorId,
          opportunityId: opportunity.id,
          applicationId: app.id,
          projectTitle: opportunity.title,
          role: opportunity.roleNeeded,
          skills: opportunity.skills,
          description: opportunity.description,
          duration: opportunity.duration,
          compensationType: opportunity.compensationType,
          compensation: opportunity.compensation,
          isVerified: true,
          completedAt: new Date()
        },
        update: {
          projectTitle: opportunity.title,
          role: opportunity.roleNeeded,
          skills: opportunity.skills,
          completedAt: new Date()
        }
      })
    }

    return completedOpp
  })

  return respond(res, result, `Collaboration completed successfully! ${acceptedApps.length} collaborator(s) received verified work history entries.`)
}

export const completeOpportunity = async (req, res) => {
  try {
    if (!requireUser(req, res, ['FREELANCER'])) return
    const id = idOf(req.params.id)
    if (!id) return fail(res, 'Invalid opportunity identifier')

    const opportunity = await prisma.collaborationOpportunity.findUnique({ where: { id } })
    if (!opportunity) return fail(res, 'Collaboration opportunity not found', 404)

    if (opportunity.creatorId !== req.user.id) {
      return fail(res, 'Only the creator can mark a collaboration completed', 403)
    }

    return await completeCollaborationLogic(req, res, opportunity)
  } catch (error) {
    console.error('Complete opportunity error:', error)
    return fail(res, 'Unable to complete collaboration opportunity', 500)
  }
}

/**
 * Public & Authenticated: List Verified Collaborations for a Freelancer
 */
export const listVerifiedCollaborations = async (req, res) => {
  try {
    let targetUserId = null

    if (req.params.id) {
      const paramId = idOf(req.params.id)
      // Check if paramId matches a User.id or FreelancerProfile.id
      const user = await prisma.user.findUnique({ where: { id: paramId } })
      if (user) {
        targetUserId = user.id
      } else {
        const profile = await prisma.freelancerProfile.findUnique({ where: { id: paramId } })
        if (profile) targetUserId = profile.userId
      }
    } else if (req.query.userId) {
      targetUserId = idOf(req.query.userId)
    } else if (req.query.freelancerProfileId) {
      const profile = await prisma.freelancerProfile.findUnique({ where: { id: idOf(req.query.freelancerProfileId) } })
      if (profile) targetUserId = profile.userId
    } else if (req.user) {
      targetUserId = req.user.id
    }

    if (!targetUserId) {
      return respond(res, [])
    }

    const verified = await prisma.verifiedCollaboration.findMany({
      where: { freelancerId: targetUserId },
      include: {
        collaborator: { select: userSelect },
        opportunity: {
          select: {
            id: true,
            title: true,
            type: true,
            workMode: true,
            compensationType: true,
            duration: true
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    })

    return respond(res, verified)
  } catch (error) {
    console.error('List verified collaborations error:', error)
    return fail(res, 'Unable to load verified collaborations', 500)
  }
}
