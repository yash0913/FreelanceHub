export const authorizeProgressUpdate = (user, project) => {
  if (!user || user.role !== 'FREELANCER') {
    return { status: 403, message: 'Only the assigned freelancer can update project progress' }
  }

  const contract = project?.contract
  if (!contract) {
    return { status: 409, message: 'This project does not have an active contract' }
  }
  if (contract.freelancerId !== user.id) {
    return { status: 403, message: 'You are not the freelancer assigned to this project' }
  }
  if (contract.projectId !== project.id || contract.clientId !== project.clientId ||
      contract.proposal?.projectId !== project.id ||
      contract.proposal?.freelancerProfile?.userId !== contract.freelancerId) {
    return { status: 409, message: 'The project and contract relationship is invalid' }
  }
  if (contract.proposal?.status !== 'ACCEPTED') {
    return { status: 409, message: 'The accepted proposal for this contract could not be verified' }
  }
  if (contract.status !== 'ACTIVE' || project.status !== 'IN_PROGRESS') {
    return { status: 409, message: 'Progress can only be updated for an active project contract' }
  }

  return null
}
