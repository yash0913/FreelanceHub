import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const clean = (value) => {
  if (value === null || value === undefined) return value
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object' && typeof value.toJSON === 'function') return value.toJSON()
  if (Array.isArray(value)) return value.map(clean)
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clean(item)]))
  return value
}

const respond = (res, data, message = null, status = 200) => res.status(status).json({ success: true, ...(message ? { message } : {}), data: clean(data) })
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message })
const idOf = (value) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}
const pageOf = (req) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12))
  return { page, limit, skip: (page - 1) * limit }
}
const numberOf = (value) => value === undefined || value === '' ? undefined : Number(value)
const userSelect = { id: true, name: true, email: true, role: true, status: true, professionalTitle: true }
const profileInclude = {
  skills: { include: { skill: true } },
  portfolioProjects: { include: { skills: { include: { skill: true } } }, orderBy: { createdAt: 'desc' } },
  user: { select: userSelect },
  _count: { select: { proposals: true } }
}

const requireUser = (req, res, roles = []) => {
  if (!req.user) {
    fail(res, 'Authentication required', 401)
    return false
  }
  if (roles.length && !roles.includes(req.user.role)) {
    fail(res, 'You do not have permission to perform this action', 403)
    return false
  }
  return true
}

const projectInclude = {
  client: { select: { id: true, name: true, customerProfile: true } },
  category: true,
  requiredSkills: { include: { skill: true } },
  _count: { select: { proposals: true } }
}

export const listCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { projects: true } } } })
    return respond(res, categories)
  } catch (error) { console.error(error); return fail(res, 'Unable to load categories', 500) }
}

export const listSkills = async (req, res) => {
  try {
    const skills = await prisma.skill.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { freelancers: true, projects: true } } } })
    return respond(res, skills)
  } catch (error) { console.error(error); return fail(res, 'Unable to load skills', 500) }
}

export const listProjects = async (req, res) => {
  try {
    const { page, limit, skip } = pageOf(req)
    const q = String(req.query.q || '').trim()
    const categoryId = idOf(req.query.categoryId)
    const skillId = idOf(req.query.skillId)
    const status = req.query.status && ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(req.query.status) ? req.query.status : undefined
    const experienceLevel = req.query.experienceLevel && ['ENTRY', 'INTERMEDIATE', 'EXPERT'].includes(req.query.experienceLevel) ? req.query.experienceLevel : undefined
    const minBudget = numberOf(req.query.minBudget)
    const maxBudget = numberOf(req.query.maxBudget)
    const where = {
      ...(status ? { status } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(experienceLevel ? { experienceLevel } : {}),
      ...(minBudget !== undefined || maxBudget !== undefined ? { budget: { ...(minBudget !== undefined ? { gte: minBudget } : {}), ...(maxBudget !== undefined ? { lte: maxBudget } : {}) } } : {}),
      ...(skillId ? { requiredSkills: { some: { skillId } } } : {}),
      ...(q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }] } : {})
    }
    const orderBy = req.query.sort === 'budget_high' ? { budget: 'desc' } : req.query.sort === 'budget_low' ? { budget: 'asc' } : req.query.sort === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' }
    const [items, total] = await prisma.$transaction([
      prisma.project.findMany({ where, include: projectInclude, orderBy, skip, take: limit }),
      prisma.project.count({ where })
    ])
    return respond(res, { items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } })
  } catch (error) { console.error(error); return fail(res, 'Unable to load projects', 500) }
}

export const getProject = async (req, res) => {
  try {
    const id = idOf(req.params.id)
    if (!id) return fail(res, 'Invalid project id')
    const project = await prisma.project.findUnique({ where: { id }, include: projectInclude })
    if (!project) return fail(res, 'Project not found', 404)
    return respond(res, project)
  } catch (error) { console.error(error); return fail(res, 'Unable to load project', 500) }
}

export const listProjectProposals = async (req, res) => {
  try {
    if (!requireUser(req, res, ['CUSTOMER', 'ADMIN'])) return
    const projectId = idOf(req.params.id)
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { clientId: true } })
    if (!project) return fail(res, 'Project not found', 404)
    if (req.user.role !== 'ADMIN' && project.clientId !== req.user.id) return fail(res, 'You can only view proposals on your own projects', 403)
    const proposals = await prisma.proposal.findMany({ where: { projectId }, include: { freelancerProfile: { include: { user: { select: userSelect }, skills: { include: { skill: true } } } }, contract: true }, orderBy: { createdAt: 'desc' } })
    return respond(res, proposals)
  } catch (error) { console.error(error); return fail(res, 'Unable to load project proposals', 500) }
}

export const listFreelancers = async (req, res) => {
  try {
    const { page, limit, skip } = pageOf(req)
    const q = String(req.query.q || '').trim()
    const skillId = idOf(req.query.skillId)
    const availability = req.query.availability && ['FULL_TIME', 'PART_TIME', 'NOT_AVAILABLE'].includes(req.query.availability) ? req.query.availability : undefined
    const experienceLevel = req.query.experienceLevel && ['ENTRY', 'INTERMEDIATE', 'EXPERT'].includes(req.query.experienceLevel) ? req.query.experienceLevel : undefined
    const minRate = numberOf(req.query.minRate)
    const maxRate = numberOf(req.query.maxRate)
    const where = {
      user: { status: 'ACTIVE', ...(q ? { OR: [{ name: { contains: q } }, { professionalTitle: { contains: q } }] } : {}) },
      ...(skillId ? { skills: { some: { skillId } } } : {}),
      ...(availability ? { availability } : {}),
      ...(experienceLevel ? { experienceLevel } : {}),
      ...(minRate !== undefined || maxRate !== undefined ? { hourlyRate: { ...(minRate !== undefined ? { gte: minRate } : {}), ...(maxRate !== undefined ? { lte: maxRate } : {}) } } : {})
    }
    const [items, total] = await prisma.$transaction([
      prisma.freelancerProfile.findMany({ where, include: { ...profileInclude, user: { select: userSelect }, skills: { include: { skill: true } }, _count: { select: { proposals: true, portfolioProjects: true } } }, orderBy: req.query.sort === 'rate_low' ? { hourlyRate: 'asc' } : { updatedAt: 'desc' }, skip, take: limit }),
      prisma.freelancerProfile.count({ where })
    ])
    return respond(res, { items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } })
  } catch (error) { console.error(error); return fail(res, 'Unable to load freelancers', 500) }
}

export const getFreelancer = async (req, res) => {
  try {
    const id = idOf(req.params.id)
    if (!id) return fail(res, 'Invalid freelancer id')
    const profile = await prisma.freelancerProfile.findUnique({ where: { id }, include: profileInclude })
    if (!profile || profile.user.status !== 'ACTIVE') return fail(res, 'Freelancer not found', 404)
    const reviews = await prisma.review.findMany({ where: { reviewedUserId: profile.userId }, include: { reviewer: { select: userSelect }, project: { select: { id: true, title: true } } }, orderBy: { createdAt: 'desc' } })
    return respond(res, { ...profile, reviews })
  } catch (error) { console.error(error); return fail(res, 'Unable to load freelancer', 500) }
}

export const getProfile = async (req, res) => {
  try {
    if (!requireUser(req, res)) return
    const profile = req.user.role === 'FREELANCER'
      ? await prisma.freelancerProfile.findUnique({ where: { userId: req.user.id }, include: profileInclude })
      : req.user.role === 'CUSTOMER'
        ? await prisma.customerProfile.findUnique({ where: { userId: req.user.id }, include: { user: { select: userSelect } } })
        : await prisma.user.findUnique({ where: { id: req.user.id }, select: userSelect })
    return respond(res, profile || { user: req.user })
  } catch (error) { console.error(error); return fail(res, 'Unable to load profile', 500) }
}

export const updateProfile = async (req, res) => {
  try {
    if (!requireUser(req, res)) return
    const { name, professionalTitle, bio, hourlyRate, experienceLevel, location, availability, companyName, profileImage, skillIds } = req.body
    const user = await prisma.user.update({ where: { id: req.user.id }, data: { ...(name ? { name: String(name).trim() } : {}), ...(professionalTitle !== undefined ? { professionalTitle: professionalTitle ? String(professionalTitle).trim() : null } : {}) }, select: userSelect })
    if (req.user.role === 'FREELANCER') {
      const profile = await prisma.freelancerProfile.upsert({ where: { userId: req.user.id }, create: { userId: req.user.id }, update: { ...(bio !== undefined ? { bio } : {}), ...(hourlyRate !== undefined && hourlyRate !== '' ? { hourlyRate: Number(hourlyRate) } : {}), ...(experienceLevel ? { experienceLevel } : {}), ...(location !== undefined ? { location } : {}), ...(availability ? { availability } : {}), ...(profileImage !== undefined ? { profileImage } : {}) } })
      if (Array.isArray(skillIds)) {
        await prisma.freelancerSkill.deleteMany({ where: { freelancerProfileId: profile.id } })
        if (skillIds.length) await prisma.freelancerSkill.createMany({ data: [...new Set(skillIds.map(Number).filter(Boolean))].map((skillId) => ({ freelancerProfileId: profile.id, skillId })) })
      }
      return respond(res, await prisma.freelancerProfile.findUnique({ where: { id: profile.id }, include: profileInclude }), 'Profile updated')
    }
    if (req.user.role === 'CUSTOMER') return respond(res, await prisma.customerProfile.upsert({ where: { userId: req.user.id }, create: { userId: req.user.id, bio, companyName, location, profileImage }, update: { ...(bio !== undefined ? { bio } : {}), ...(companyName !== undefined ? { companyName } : {}), ...(location !== undefined ? { location } : {}), ...(profileImage !== undefined ? { profileImage } : {}) }, include: { user: { select: userSelect } } }), 'Profile updated')
    return respond(res, user, 'Profile updated')
  } catch (error) { console.error(error); return fail(res, 'Unable to update profile', 400) }
}

export const listMyProjects = async (req, res) => {
  try {
    if (!requireUser(req, res, ['CUSTOMER', 'ADMIN'])) return
    const where = req.user.role === 'ADMIN' ? {} : { clientId: req.user.id }
    const projects = await prisma.project.findMany({ where, include: projectInclude, orderBy: { updatedAt: 'desc' } })
    return respond(res, projects)
  } catch (error) { console.error(error); return fail(res, 'Unable to load your projects', 500) }
}

export const createProject = async (req, res) => {
  try {
    if (!requireUser(req, res, ['CUSTOMER'])) return
    const { title, description, budget, deadline, categoryId, experienceLevel, skillIds } = req.body
    if (!title?.trim() || !description?.trim()) return fail(res, 'Title and description are required')
    const project = await prisma.project.create({ data: { clientId: req.user.id, title: title.trim(), description: description.trim(), ...(budget !== '' && budget !== undefined ? { budget: Number(budget) } : {}), ...(deadline ? { deadline: new Date(deadline) } : {}), ...(categoryId ? { categoryId: idOf(categoryId) } : {}), ...(experienceLevel ? { experienceLevel } : {}), ...(Array.isArray(skillIds) && skillIds.length ? { requiredSkills: { create: [...new Set(skillIds.map(Number).filter(Boolean))].map(skillId => ({ skill: { connect: { id: skillId } } })) } } : {}) }, include: projectInclude })
    return respond(res, project, 'Project published', 201)
  } catch (error) { console.error(error); return fail(res, 'Unable to create project. Check the selected category and skills.', 400) }
}

export const updateProject = async (req, res) => {
  try {
    if (!requireUser(req, res, ['CUSTOMER', 'ADMIN'])) return
    const id = idOf(req.params.id)
    const existing = await prisma.project.findUnique({ where: { id } })
    if (!existing) return fail(res, 'Project not found', 404)
    if (req.user.role !== 'ADMIN' && existing.clientId !== req.user.id) return fail(res, 'You can only edit your own projects', 403)
    const { title, description, budget, deadline, categoryId, experienceLevel, status } = req.body
    const allowedStatus = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    const project = await prisma.project.update({ where: { id }, data: { ...(title !== undefined ? { title: String(title).trim() } : {}), ...(description !== undefined ? { description: String(description).trim() } : {}), ...(budget !== undefined && budget !== '' ? { budget: Number(budget) } : {}), ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}), ...(categoryId !== undefined ? { categoryId: categoryId ? idOf(categoryId) : null } : {}), ...(experienceLevel ? { experienceLevel } : {}), ...(status && allowedStatus.includes(status) ? { status } : {}) }, include: projectInclude })
    return respond(res, project, 'Project updated')
  } catch (error) { console.error(error); return fail(res, 'Unable to update project', 400) }
}

export const listMyProposals = async (req, res) => {
  try {
    if (!requireUser(req, res, ['FREELANCER', 'CUSTOMER', 'ADMIN'])) return
    const where = req.user.role === 'FREELANCER' ? { freelancerProfile: { userId: req.user.id } } : req.user.role === 'CUSTOMER' ? { project: { clientId: req.user.id } } : {}
    const proposals = await prisma.proposal.findMany({ where, include: { project: { include: { category: true, client: { select: { id: true, name: true, customerProfile: true } } } }, freelancerProfile: { include: { user: { select: userSelect }, skills: { include: { skill: true } } } }, contract: true }, orderBy: { updatedAt: 'desc' } })
    return respond(res, proposals)
  } catch (error) { console.error(error); return fail(res, 'Unable to load proposals', 500) }
}

export const createProposal = async (req, res) => {
  try {
    if (!requireUser(req, res, ['FREELANCER'])) return
    const projectId = idOf(req.params.projectId)
    const { proposedPrice, estimatedDays, coverLetter } = req.body
    const profile = await prisma.freelancerProfile.findUnique({ where: { userId: req.user.id } })
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!profile) return fail(res, 'Complete your freelancer profile before applying')
    if (!project || project.status !== 'OPEN') return fail(res, 'This project is no longer accepting proposals', 400)
    if (!proposedPrice || Number(proposedPrice) <= 0) return fail(res, 'Enter a valid proposed price')
    const proposal = await prisma.proposal.create({ data: { projectId, freelancerProfileId: profile.id, proposedPrice: Number(proposedPrice), ...(estimatedDays ? { estimatedDays: Number(estimatedDays) } : {}), ...(coverLetter ? { coverLetter: String(coverLetter).trim() } : {}) }, include: { project: { include: { category: true } } } })
    return respond(res, proposal, 'Proposal submitted', 201)
  } catch (error) { console.error(error); return fail(res, error.code === 'P2002' ? 'You already submitted a proposal for this project' : 'Unable to submit proposal', 400) }
}

export const updateProposal = async (req, res) => {
  try {
    if (!requireUser(req, res, ['FREELANCER', 'CUSTOMER', 'ADMIN'])) return
    const id = idOf(req.params.id)
    const proposal = await prisma.proposal.findUnique({ where: { id }, include: { project: true, freelancerProfile: true } })
    if (!proposal) return fail(res, 'Proposal not found', 404)
    const { status, proposedPrice, estimatedDays, coverLetter } = req.body
    if (req.user.role === 'FREELANCER') {
      if (proposal.freelancerProfile.userId !== req.user.id || proposal.status !== 'PENDING') return fail(res, 'This proposal can no longer be changed', 403)
      return respond(res, await prisma.proposal.update({ where: { id }, data: { ...(status === 'WITHDRAWN' ? { status } : {}), ...(proposedPrice ? { proposedPrice: Number(proposedPrice) } : {}), ...(estimatedDays ? { estimatedDays: Number(estimatedDays) } : {}), ...(coverLetter !== undefined ? { coverLetter } : {}) } }), 'Proposal updated')
    }
    if (req.user.role !== 'ADMIN' && proposal.project.clientId !== req.user.id) return fail(res, 'You can only manage proposals on your projects', 403)
    if (!['ACCEPTED', 'REJECTED'].includes(status)) return fail(res, 'Unsupported proposal action')
    if (status === 'REJECTED') return respond(res, await prisma.proposal.update({ where: { id }, data: { status } }), 'Proposal rejected')
    const result = await prisma.$transaction(async (tx) => {
      await tx.proposal.updateMany({ where: { projectId: proposal.projectId, id: { not: id }, status: 'PENDING' }, data: { status: 'REJECTED' } })
      const accepted = await tx.proposal.update({ where: { id }, data: { status: 'ACCEPTED' } })
      const contract = await tx.contract.create({ data: { projectId: proposal.projectId, proposalId: id, clientId: proposal.project.clientId, freelancerId: proposal.freelancerProfile.userId, agreedAmount: proposal.proposedPrice } })
      await tx.project.update({ where: { id: proposal.projectId }, data: { status: 'IN_PROGRESS' } })
      return { accepted, contract }
    })
    return respond(res, result, 'Proposal accepted and contract created')
  } catch (error) { console.error(error); return fail(res, 'Unable to update proposal', 400) }
}

export const listContracts = async (req, res) => {
  try {
    if (!requireUser(req, res, ['CUSTOMER', 'FREELANCER', 'ADMIN'])) return
    const where = req.user.role === 'ADMIN' ? {} : req.user.role === 'CUSTOMER' ? { clientId: req.user.id } : { freelancerId: req.user.id }
    const contracts = await prisma.contract.findMany({ where, include: { project: { include: { category: true } }, proposal: true, client: { select: userSelect }, freelancer: { select: userSelect }, payment: true, review: true }, orderBy: { updatedAt: 'desc' } })
    return respond(res, contracts)
  } catch (error) { console.error(error); return fail(res, 'Unable to load contracts', 500) }
}

export const updateContract = async (req, res) => {
  try {
    if (!requireUser(req, res, ['CUSTOMER', 'FREELANCER', 'ADMIN'])) return
    const id = idOf(req.params.id)
    const contract = await prisma.contract.findUnique({ where: { id } })
    if (!contract) return fail(res, 'Contract not found', 404)
    if (req.user.role !== 'ADMIN' && ![contract.clientId, contract.freelancerId].includes(req.user.id)) return fail(res, 'You are not part of this contract', 403)
    const { status, endDate } = req.body
    if (!['ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED'].includes(status)) return fail(res, 'Unsupported contract status')
    const updated = await prisma.contract.update({ where: { id }, data: { status, ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}) }, include: { project: true, client: { select: userSelect }, freelancer: { select: userSelect }, payment: true } })
    if (status === 'COMPLETED') await prisma.project.update({ where: { id: contract.projectId }, data: { status: 'COMPLETED' } })
    return respond(res, updated, 'Contract updated')
  } catch (error) { console.error(error); return fail(res, 'Unable to update contract', 400) }
}

const participantWhere = (conversationId, userId) => ({ conversationId_userId: { conversationId, userId } })
export const listConversations = async (req, res) => {
  try {
    if (!requireUser(req, res)) return
    const conversations = await prisma.conversation.findMany({ where: { participants: { some: { userId: req.user.id } } }, include: { participants: { include: { user: { select: userSelect } } }, messages: { orderBy: { sentAt: 'desc' }, take: 1, include: { sender: { select: userSelect } } } }, orderBy: { updatedAt: 'desc' } })
    return respond(res, conversations)
  } catch (error) { console.error(error); return fail(res, 'Unable to load conversations', 500) }
}

export const createConversation = async (req, res) => {
  try {
    if (!requireUser(req, res)) return
    const participantId = idOf(req.body.participantId)
    if (!participantId || participantId === req.user.id) return fail(res, 'Choose another user to start a conversation')
    const participant = await prisma.user.findUnique({ where: { id: participantId } })
    if (!participant) return fail(res, 'User not found', 404)
    const existing = await prisma.conversation.findFirst({ where: { AND: [{ participants: { some: { userId: req.user.id } } }, { participants: { some: { userId: participantId } } }] }, include: { participants: { include: { user: { select: userSelect } } } } })
    if (existing) return respond(res, existing)
    const conversation = await prisma.conversation.create({ data: { participants: { create: [{ userId: req.user.id }, { userId: participantId }] } }, include: { participants: { include: { user: { select: userSelect } } } } })
    return respond(res, conversation, 'Conversation started', 201)
  } catch (error) { console.error(error); return fail(res, 'Unable to start conversation', 400) }
}

export const listMessages = async (req, res) => {
  try {
    if (!requireUser(req, res)) return
    const conversationId = idOf(req.params.id)
    const member = await prisma.conversationParticipant.findUnique({ where: participantWhere(conversationId, req.user.id) })
    if (!member) return fail(res, 'Conversation not found', 404)
    await prisma.message.updateMany({ where: { conversationId, senderId: { not: req.user.id } }, data: { isRead: true } })
    const messages = await prisma.message.findMany({ where: { conversationId }, include: { sender: { select: userSelect } }, orderBy: { sentAt: 'asc' } })
    return respond(res, messages)
  } catch (error) { console.error(error); return fail(res, 'Unable to load messages', 500) }
}

export const sendMessage = async (req, res) => {
  try {
    if (!requireUser(req, res)) return
    const conversationId = idOf(req.params.id)
    const content = String(req.body.content || '').trim()
    if (!content) return fail(res, 'Message cannot be empty')
    const member = await prisma.conversationParticipant.findUnique({ where: participantWhere(conversationId, req.user.id) })
    if (!member) return fail(res, 'Conversation not found', 404)
    const message = await prisma.message.create({ data: { conversationId, senderId: req.user.id, content }, include: { sender: { select: userSelect } } })
    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } })
    return respond(res, message, 'Message sent', 201)
  } catch (error) { console.error(error); return fail(res, 'Unable to send message', 400) }
}

export const listPortfolio = async (req, res) => {
  try {
    if (!requireUser(req, res, ['FREELANCER'])) return
    const profile = await prisma.freelancerProfile.findUnique({ where: { userId: req.user.id } })
    if (!profile) return respond(res, [])
    return respond(res, await prisma.portfolioProject.findMany({ where: { freelancerProfileId: profile.id }, include: { skills: { include: { skill: true } } }, orderBy: { updatedAt: 'desc' } }))
  } catch (error) { console.error(error); return fail(res, 'Unable to load portfolio', 500) }
}

export const createPortfolio = async (req, res) => {
  try {
    if (!requireUser(req, res, ['FREELANCER'])) return
    const profile = await prisma.freelancerProfile.upsert({ where: { userId: req.user.id }, create: { userId: req.user.id }, update: {} })
    const { title, description, projectUrl, imageUrl, skillIds } = req.body
    if (!title?.trim()) return fail(res, 'Portfolio title is required')
    const item = await prisma.portfolioProject.create({ data: { freelancerProfileId: profile.id, title: title.trim(), description, projectUrl, imageUrl, ...(Array.isArray(skillIds) && skillIds.length ? { skills: { create: [...new Set(skillIds.map(Number).filter(Boolean))].map(skillId => ({ skill: { connect: { id: skillId } } })) } } : {}) }, include: { skills: { include: { skill: true } } } })
    return respond(res, item, 'Portfolio item added', 201)
  } catch (error) { console.error(error); return fail(res, 'Unable to add portfolio item', 400) }
}

export const updatePortfolio = async (req, res) => {
  try {
    if (!requireUser(req, res, ['FREELANCER'])) return
    const id = idOf(req.params.id)
    const item = await prisma.portfolioProject.findUnique({ where: { id }, include: { freelancerProfile: true } })
    if (!item || item.freelancerProfile.userId !== req.user.id) return fail(res, 'Portfolio item not found', 404)
    const { title, description, projectUrl, imageUrl } = req.body
    return respond(res, await prisma.portfolioProject.update({ where: { id }, data: { ...(title !== undefined ? { title: String(title).trim() } : {}), ...(description !== undefined ? { description } : {}), ...(projectUrl !== undefined ? { projectUrl } : {}), ...(imageUrl !== undefined ? { imageUrl } : {}) }, include: { skills: { include: { skill: true } } } }), 'Portfolio item updated')
  } catch (error) { console.error(error); return fail(res, 'Unable to update portfolio item', 400) }
}

export const deletePortfolio = async (req, res) => {
  try {
    if (!requireUser(req, res, ['FREELANCER'])) return
    const id = idOf(req.params.id)
    const item = await prisma.portfolioProject.findUnique({ where: { id }, include: { freelancerProfile: true } })
    if (!item || item.freelancerProfile.userId !== req.user.id) return fail(res, 'Portfolio item not found', 404)
    await prisma.portfolioProject.delete({ where: { id } })
    return respond(res, null, 'Portfolio item deleted')
  } catch (error) { console.error(error); return fail(res, 'Unable to delete portfolio item', 400) }
}

export const listReviews = async (req, res) => {
  try {
    if (!requireUser(req, res)) return
    const reviews = await prisma.review.findMany({ where: { OR: [{ reviewerId: req.user.id }, { reviewedUserId: req.user.id }] }, include: { reviewer: { select: userSelect }, reviewedUser: { select: userSelect }, project: { select: { id: true, title: true } }, contract: { select: { id: true, status: true } } }, orderBy: { createdAt: 'desc' } })
    return respond(res, reviews)
  } catch (error) { console.error(error); return fail(res, 'Unable to load reviews', 500) }
}

export const createReview = async (req, res) => {
  try {
    if (!requireUser(req, res, ['CUSTOMER', 'FREELANCER'])) return
    const contractId = idOf(req.body.contractId)
    const rating = Number(req.body.rating)
    const contract = await prisma.contract.findUnique({ where: { id: contractId }, include: { project: true } })
    if (!contract || contract.status !== 'COMPLETED') return fail(res, 'Reviews are available after a contract is completed')
    if (![contract.clientId, contract.freelancerId].includes(req.user.id)) return fail(res, 'You are not part of this contract', 403)
    const reviewedUserId = req.user.id === contract.clientId ? contract.freelancerId : contract.clientId
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail(res, 'Rating must be between 1 and 5')
    const review = await prisma.review.create({ data: { contractId, projectId: contract.projectId, reviewerId: req.user.id, reviewedUserId, rating, comment: req.body.comment ? String(req.body.comment).trim() : null }, include: { reviewer: { select: userSelect }, reviewedUser: { select: userSelect }, project: { select: { id: true, title: true } } } })
    return respond(res, review, 'Review published', 201)
  } catch (error) { console.error(error); return fail(res, error.code === 'P2002' ? 'A review already exists for this contract' : 'Unable to create review', 400) }
}

export const listPayments = async (req, res) => {
  try {
    if (!requireUser(req, res, ['CUSTOMER', 'FREELANCER', 'ADMIN'])) return
    const where = req.user.role === 'ADMIN' ? {} : { OR: [{ payerId: req.user.id }, { receiverId: req.user.id }] }
    return respond(res, await prisma.payment.findMany({ where, include: { contract: { include: { project: { select: { id: true, title: true } } } }, payer: { select: userSelect }, receiver: { select: userSelect } }, orderBy: { createdAt: 'desc' } }))
  } catch (error) { console.error(error); return fail(res, 'Unable to load payments', 500) }
}

export const createReport = async (req, res) => {
  try {
    if (!requireUser(req, res, ['CUSTOMER', 'FREELANCER'])) return
    const reportedUserId = idOf(req.body.reportedUserId)
    if (!reportedUserId || reportedUserId === req.user.id || !req.body.reason?.trim()) return fail(res, 'Choose a user and provide a reason')
    const reported = await prisma.user.findUnique({ where: { id: reportedUserId } })
    if (!reported) return fail(res, 'Reported user not found', 404)
    return respond(res, await prisma.report.create({ data: { reporterId: req.user.id, reportedUserId, reason: String(req.body.reason).trim(), description: req.body.description ? String(req.body.description).trim() : null }, include: { reportedUser: { select: userSelect } } }), 'Report submitted', 201)
  } catch (error) { console.error(error); return fail(res, 'Unable to submit report', 400) }
}

export const listMyReports = async (req, res) => {
  try {
    if (!requireUser(req, res, ['CUSTOMER', 'FREELANCER', 'ADMIN'])) return
    const where = req.user.role === 'ADMIN' ? {} : { reporterId: req.user.id }
    return respond(res, await prisma.report.findMany({ where, include: { reporter: { select: userSelect }, reportedUser: { select: userSelect }, resolvedBy: { select: userSelect } }, orderBy: { createdAt: 'desc' } }))
  } catch (error) { console.error(error); return fail(res, 'Unable to load reports', 500) }
}

export const adminStats = async (req, res) => {
  try {
    if (!requireUser(req, res, ['ADMIN'])) return
    const [users, customers, freelancers, projects, openProjects, proposals, contracts, completedContracts, paymentAggregate, pendingReports, resolvedReports] = await Promise.all([
      prisma.user.count(), prisma.user.count({ where: { role: 'CUSTOMER' } }), prisma.user.count({ where: { role: 'FREELANCER' } }), prisma.project.count(), prisma.project.count({ where: { status: 'OPEN' } }), prisma.proposal.count(), prisma.contract.count(), prisma.contract.count({ where: { status: 'COMPLETED' } }), prisma.payment.aggregate({ _sum: { amount: true } }), prisma.report.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } }), prisma.report.count({ where: { status: { in: ['RESOLVED', 'DISMISSED'] } } })
    ])
    return respond(res, { users, customers, freelancers, projects, openProjects, proposals, contracts, completedContracts, paymentVolume: paymentAggregate._sum.amount || 0, pendingReports, resolvedReports })
  } catch (error) { console.error(error); return fail(res, 'Unable to load admin statistics', 500) }
}

export const adminProjects = async (req, res) => {
  try {
    if (!requireUser(req, res, ['ADMIN'])) return
    const { page, limit, skip } = pageOf(req)
    const q = String(req.query.q || '').trim()
    const status = req.query.status && ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(req.query.status) ? req.query.status : undefined
    const where = { ...(status ? { status } : {}), ...(q ? { OR: [{ title: { contains: q } }, { client: { name: { contains: q } } }] } : {}) }
    const [items, total] = await prisma.$transaction([prisma.project.findMany({ where, include: projectInclude, orderBy: { updatedAt: 'desc' }, skip, take: limit }), prisma.project.count({ where })])
    return respond(res, { items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } })
  } catch (error) { console.error(error); return fail(res, 'Unable to load marketplace management data', 500) }
}

export const adminReports = async (req, res) => {
  try {
    if (!requireUser(req, res, ['ADMIN'])) return
    const where = req.query.status && ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].includes(req.query.status) ? { status: req.query.status } : {}
    return respond(res, await prisma.report.findMany({ where, include: { reporter: { select: userSelect }, reportedUser: { select: userSelect }, resolvedBy: { select: userSelect } }, orderBy: { createdAt: 'desc' } }))
  } catch (error) { console.error(error); return fail(res, 'Unable to load moderation queue', 500) }
}

export const updateReport = async (req, res) => {
  try {
    if (!requireUser(req, res, ['ADMIN'])) return
    const status = req.body.status
    if (!['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].includes(status)) return fail(res, 'Unsupported report status')
    const report = await prisma.report.update({ where: { id: idOf(req.params.id) }, data: { status, resolvedById: ['RESOLVED', 'DISMISSED'].includes(status) ? req.user.id : null, resolvedAt: ['RESOLVED', 'DISMISSED'].includes(status) ? new Date() : null }, include: { reporter: { select: userSelect }, reportedUser: { select: userSelect }, resolvedBy: { select: userSelect } } })
    return respond(res, report, 'Report status updated')
  } catch (error) { console.error(error); return fail(res, 'Unable to update report', 400) }
}
