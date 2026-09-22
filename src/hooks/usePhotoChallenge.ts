import * as challengesRepository from '../repositories/photoChallenges.repository'
import * as submissionsRepository from '../repositories/photoSubmissions.repository'
import { useAsync } from './useAsync'

export function useActiveChallenge() {
  return useAsync(() => challengesRepository.getActiveChallenge(), [])
}

export function useCurrentChallenge() {
  return useAsync(() => challengesRepository.getCurrentChallenge(), [])
}

export function useMySubmission(challengeId: string | undefined, uid: string | undefined) {
  return useAsync(
    () => (challengeId && uid ? submissionsRepository.getMySubmission(challengeId, uid) : Promise.resolve(undefined)),
    [challengeId, uid],
  )
}

export function useSubmissions(challengeId: string | undefined, status?: submissionsRepository.SubmissionFilters['status']) {
  return useAsync(
    () => (challengeId ? submissionsRepository.getSubmissions(challengeId, { status }) : Promise.resolve([])),
    [challengeId, status],
  )
}
