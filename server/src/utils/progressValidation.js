export const VALID_PROGRESS_STAGES = Object.freeze([
  'REQUIREMENTS',
  'DEVELOPMENT',
  'CLIENT_REVIEW',
  'REVISIONS',
  'FINAL_DELIVERY',
  'COMPLETED'
])

export const VALID_PROGRESS_STATUSES = Object.freeze([
  'NOT_STARTED',
  'IN_PROGRESS',
  'CLIENT_REVIEW',
  'WAITING_FOR_CLIENT',
  'BLOCKED',
  'COMPLETED'
])

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/
const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{16,64}$/

const dateFromInput = (value) => {
  if (value === undefined || value === null || value === '') return { valid: true, date: null }
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return { valid: false, date: null }
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return { valid: false, date: null }
  const calendarDate = new Date(`${value.slice(0, 10)}T00:00:00.000Z`)
  if (!Number.isFinite(calendarDate.getTime()) || calendarDate.toISOString().slice(0, 10) !== value.slice(0, 10)) {
    return { valid: false, date: null }
  }
  return { valid: true, date }
}

export const validateProgressSubmission = (body, idempotencyKey) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'A valid progress update is required' }
  }
  if (typeof idempotencyKey !== 'string' || !IDEMPOTENCY_KEY.test(idempotencyKey)) {
    return { error: 'A valid Idempotency-Key header is required' }
  }

  const { stage, progressPercentage, status, note, actionRequired = false, actionNote = '', expectedCompletion } = body
  if (typeof stage !== 'string' || !VALID_PROGRESS_STAGES.includes(stage)) {
    return { error: `Invalid stage. Choose one of: ${VALID_PROGRESS_STAGES.join(', ')}` }
  }
  if (typeof status !== 'string' || !VALID_PROGRESS_STATUSES.includes(status)) {
    return { error: `Invalid status. Choose one of: ${VALID_PROGRESS_STATUSES.join(', ')}` }
  }
  const percentage = typeof progressPercentage === 'number'
    ? progressPercentage
    : typeof progressPercentage === 'string' && /^\d{1,3}$/.test(progressPercentage)
      ? Number(progressPercentage)
      : NaN
  if (!Number.isSafeInteger(percentage) || percentage < 0 || percentage > 100) {
    return { error: 'Progress percentage must be a whole number from 0 to 100' }
  }
  if (typeof note !== 'string' || !note.trim()) {
    return { error: 'Add a short progress note before saving' }
  }
  if (note.trim().length > 5000) return { error: 'Progress note must be 5000 characters or fewer' }
  if (typeof actionRequired !== 'boolean') return { error: 'Client action required must be a boolean' }
  if (typeof actionNote !== 'string') return { error: 'Client action details must be text' }
  const cleanActionNote = actionNote.trim()
  if (cleanActionNote.length > 2000) return { error: 'Client action details must be 2000 characters or fewer' }
  if (actionRequired && cleanActionNote.length < 5) {
    return { error: 'Describe the client action required (at least 5 characters)' }
  }
  const parsedDate = dateFromInput(expectedCompletion)
  if (!parsedDate.valid) return { error: 'Expected completion must be a valid ISO date' }

  const completionRequested = stage === 'COMPLETED' || status === 'COMPLETED' || percentage === 100
  if (completionRequested && (stage !== 'COMPLETED' || status !== 'COMPLETED' || percentage !== 100)) {
    return { error: 'To mark the project complete, select Completed for both stage and status and set progress to 100%' }
  }

  return {
    data: {
      stage,
      progressPercentage: percentage,
      status,
      note: note.trim(),
      actionRequired,
      actionNote: actionRequired ? cleanActionNote : null,
      expectedCompletion: parsedDate.date,
      completionRequested,
      submissionId: idempotencyKey || null
    }
  }
}

export const validateProgressTransition = (previous, next) => {
  if (!previous) return null
  if (previous.status === 'COMPLETED' || previous.stage === 'COMPLETED') {
    return 'This project progress is already marked complete and cannot be moved backward'
  }
  if (next.progressPercentage < previous.progressPercentage) {
    return 'Progress percentage cannot be lower than the last saved update'
  }
  const previousStageIndex = VALID_PROGRESS_STAGES.indexOf(previous.stage)
  const nextStageIndex = VALID_PROGRESS_STAGES.indexOf(next.stage)
  if (previousStageIndex >= 0 && nextStageIndex < previousStageIndex) {
    return 'Project stage cannot move backward'
  }
  return null
}
