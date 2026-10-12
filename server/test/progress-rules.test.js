import test from 'node:test'
import assert from 'node:assert/strict'
import { authorizeProgressUpdate } from '../src/utils/progressAuthorization.js'
import { validateProgressSubmission, validateProgressTransition } from '../src/utils/progressValidation.js'
import { isProfileComplete } from '../src/utils/profileCompletion.js'
import { buildUserProfileUpdateData } from '../src/utils/profileUpdate.js'

const key = 'a-valid-idempotency-key-0001'
const validBody = {
  stage: 'DEVELOPMENT',
  progressPercentage: 55,
  status: 'IN_PROGRESS',
  note: 'Backend work is underway.',
  actionRequired: false,
  actionNote: '',
  expectedCompletion: '2026-11-01'
}
const activeProject = {
  id: 20,
  clientId: 3,
  status: 'IN_PROGRESS',
  contract: {
    id: 30,
    projectId: 20,
    clientId: 3,
    freelancerId: 4,
    status: 'ACTIVE',
    proposal: { status: 'ACCEPTED', projectId: 20, freelancerProfile: { userId: 4 } }
  }
}

test('accepts valid progress and parses a date-only completion date consistently', () => {
  const result = validateProgressSubmission(validBody, key)
  assert.equal(result.error, undefined)
  assert.equal(result.data.progressPercentage, 55)
  assert.equal(result.data.expectedCompletion.toISOString(), '2026-11-01T00:00:00.000Z')
  assert.equal(result.data.submissionId, key)
})

test('rejects missing idempotency keys and malformed progress payloads', () => {
  assert.match(validateProgressSubmission(validBody).error, /Idempotency-Key header/)
  assert.match(validateProgressSubmission(validBody, 'bad key').error, /Idempotency-Key header/)
  assert.match(validateProgressSubmission(null, key).error, /valid progress update/)
})

test('rejects invalid percentages, stages, statuses, notes, and dates', () => {
  for (const value of [-1, 101, 2.5, '', null, '100.5']) {
    assert.match(validateProgressSubmission({ ...validBody, progressPercentage: value }, key).error, /percentage/)
  }
  assert.match(validateProgressSubmission({ ...validBody, stage: 'UNKNOWN' }, key).error, /stage/)
  assert.match(validateProgressSubmission({ ...validBody, status: 'UNKNOWN' }, key).error, /status/)
  assert.match(validateProgressSubmission({ ...validBody, note: '  ' }, key).error, /note/)
  assert.match(validateProgressSubmission({ ...validBody, expectedCompletion: '2026-02-30' }, key).error, /ISO date/)
})

test('requires meaningful client-action details only when action is requested', () => {
  assert.match(validateProgressSubmission({ ...validBody, actionRequired: true, actionNote: '' }, key).error, /client action/)
  const result = validateProgressSubmission({ ...validBody, actionRequired: false, actionNote: '' }, key)
  assert.equal(result.data.actionNote, null)
})

test('requires explicit completion stage, status, and 100 percent together', () => {
  assert.match(validateProgressSubmission({ ...validBody, progressPercentage: 100 }, key).error, /100%/)
  assert.match(validateProgressSubmission({ ...validBody, stage: 'COMPLETED', progressPercentage: 100 }, key).error, /both stage and status/)
  assert.match(validateProgressSubmission({ ...validBody, status: 'COMPLETED', progressPercentage: 100 }, key).error, /both stage and status/)
  const result = validateProgressSubmission({ ...validBody, stage: 'COMPLETED', status: 'COMPLETED', progressPercentage: 100 }, key)
  assert.equal(result.data.completionRequested, true)
})

test('prevents progress stage or percentage from regressing after a saved update', () => {
  const previous = { stage: 'DEVELOPMENT', status: 'IN_PROGRESS', progressPercentage: 55 }
  assert.match(validateProgressTransition(previous, { ...validBody, progressPercentage: 50 }), /percentage cannot be lower/)
  assert.match(validateProgressTransition(previous, { ...validBody, stage: 'REQUIREMENTS' }), /stage cannot move backward/)
  assert.match(validateProgressTransition({ ...previous, status: 'COMPLETED', stage: 'COMPLETED' }, validBody), /already marked complete/)
  assert.equal(validateProgressTransition(previous, { ...validBody, progressPercentage: 60 }), null)
})

test('allows only the assigned freelancer on the active accepted contract to submit', () => {
  assert.equal(authorizeProgressUpdate({ id: 4, role: 'FREELANCER' }, activeProject), null)
  assert.equal(authorizeProgressUpdate({ id: 3, role: 'CUSTOMER' }, activeProject).status, 403)
  assert.equal(authorizeProgressUpdate({ id: 4, role: 'ADMIN' }, activeProject).status, 403)
  assert.equal(authorizeProgressUpdate({ id: 5, role: 'FREELANCER' }, activeProject).status, 403)
  assert.equal(authorizeProgressUpdate({ id: 4, role: 'FREELANCER' }, { ...activeProject, contract: { ...activeProject.contract, status: 'CANCELLED' } }).status, 409)
  assert.equal(authorizeProgressUpdate({ id: 4, role: 'FREELANCER' }, { ...activeProject, contract: { ...activeProject.contract, proposal: { status: 'PENDING' } } }).status, 409)
})

test('profile completion uses role-specific fields and preserves valid existing accounts', () => {
  assert.equal(isProfileComplete({ role: 'FREELANCER', name: 'A', professionalTitle: 'Dev', freelancerProfile: { bio: 'About' } }), true)
  assert.equal(isProfileComplete({ role: 'FREELANCER', name: 'A', professionalTitle: '', freelancerProfile: { bio: 'About' } }), false)
  assert.equal(isProfileComplete({ role: 'CUSTOMER', name: 'A', isProfileCompleted: true, customerProfile: { bio: 'Existing legacy profile' } }), true)
  assert.equal(isProfileComplete({ role: 'CUSTOMER', name: 'A', isProfileCompleted: false, customerProfile: { bio: 'About' } }), false)
})

test('customer profile writes ignore freelancer-only headline fields', () => {
  assert.deepEqual(buildUserProfileUpdateData('CUSTOMER', { name: ' Customer ', professionalTitle: 'Injected headline' }), { name: 'Customer' })
  assert.deepEqual(buildUserProfileUpdateData('FREELANCER', { name: ' Talent ', professionalTitle: ' Engineer ' }), { name: 'Talent', professionalTitle: 'Engineer' })
})
