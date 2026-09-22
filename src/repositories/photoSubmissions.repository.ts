import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as fbLimit,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import type { PhotoSubmission, PhotoGalleryItem, SubmissionStatus } from '../types/schema'
import { requireDb, withId } from './_firestore'
import { getStorageInstance } from '../services/firebase/app'
import { fileExtension } from '../utils/imageValidation'

function submissionsCollection(challengeId: string) {
  return collection(requireDb(), 'photoChallenges', challengeId, 'submissions')
}

function galleryCollection(challengeId: string) {
  return collection(requireDb(), 'photoChallenges', challengeId, 'gallery')
}

async function uploadPhoto(challengeId: string, uid: string, file: File, version: number): Promise<{ url: string; path: string }> {
  const storage = await getStorageInstance()
  if (!storage) throw new Error('Firebase is not configured.')
  const path = `photoChallenges/${challengeId}/${uid}/photo_${version}.${fileExtension(file)}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file, { contentType: file.type })
  const url = await getDownloadURL(storageRef)
  return { url, path }
}

export async function getMySubmission(challengeId: string, uid: string): Promise<PhotoSubmission | undefined> {
  const snap = await getDoc(doc(submissionsCollection(challengeId), uid))
  return snap.exists() ? withId<Omit<PhotoSubmission, 'id'>>(snap) : undefined
}

export interface SubmitPhotoInput {
  challengeId: string
  uid: string
  file: File
  termsVersion: string
}

// The ONE original submission. Doc id is the uid — a second call for the
// same user is a Firestore *update* (rejected by firestore.rules), never
// a second create. See docs/SECURITY.md.
export async function submitPhoto(input: SubmitPhotoInput): Promise<PhotoSubmission> {
  const { url, path } = await uploadPhoto(input.challengeId, input.uid, input.file, 0)
  const now = new Date().toISOString()

  const submission: Omit<PhotoSubmission, 'id'> = {
    challengeId: input.challengeId,
    userId: input.uid,
    imageUrl: url,
    storagePath: path,
    fileName: input.file.name,
    fileSize: input.file.size,
    contentType: input.file.type,
    status: 'pending',
    photoChangeCount: 0,
    termsAccepted: true,
    termsAcceptedAt: now,
    termsVersion: input.termsVersion,
    realPhotoConfirmed: true,
    realPhotoConfirmedAt: now,
    submittedAt: now,
    updatedAt: now,
  }

  await setDoc(doc(submissionsCollection(input.challengeId), input.uid), submission)
  return { ...submission, id: input.uid }
}

// The ONE allowed replacement. firestore.rules independently enforces
// photoChangeCount can only move from 0 -> 1 (never further, never
// backward, never by anyone but the doc's own uid) — this client-side
// check is only a fast UX short-circuit, same pattern as the Poll's
// duplicate-answer guard. See docs/SECURITY.md.
export async function changePhoto(input: SubmitPhotoInput): Promise<PhotoSubmission> {
  const existing = await getMySubmission(input.challengeId, input.uid)
  if (!existing) throw new Error('No existing submission to change.')

  const nextVersion = existing.photoChangeCount + 1
  const { url, path } = await uploadPhoto(input.challengeId, input.uid, input.file, nextVersion)
  const now = new Date().toISOString()

  await updateDoc(doc(submissionsCollection(input.challengeId), input.uid), {
    imageUrl: url,
    storagePath: path,
    fileName: input.file.name,
    fileSize: input.file.size,
    contentType: input.file.type,
    photoChangeCount: nextVersion,
    updatedAt: now,
  })

  return (await getMySubmission(input.challengeId, input.uid))!
}

export interface SubmissionFilters {
  status?: SubmissionStatus
}

// Admin-only (firestore.rules restricts `list` on submissions to admins).
export async function getSubmissions(challengeId: string, filters: SubmissionFilters = {}): Promise<PhotoSubmission[]> {
  const clauses = filters.status ? [where('status', '==', filters.status)] : []
  const snap = await getDocs(query(submissionsCollection(challengeId), ...clauses, orderBy('submittedAt', 'desc')))
  return snap.docs.map((d) => withId<Omit<PhotoSubmission, 'id'>>(d))
}

export async function approveSubmission(challengeId: string, uid: string, adminUid: string): Promise<void> {
  const submission = await getMySubmission(challengeId, uid)
  if (!submission) throw new Error('Submission not found.')
  const now = new Date().toISOString()

  await updateDoc(doc(submissionsCollection(challengeId), uid), {
    status: 'approved',
    approvedBy: adminUid,
    approvedAt: now,
    updatedAt: now,
  })

  const galleryItem: Omit<PhotoGalleryItem, 'id'> = { imageUrl: submission.imageUrl, submittedAt: submission.submittedAt }
  await setDoc(doc(galleryCollection(challengeId), uid), galleryItem)
}

// Used for both "Reject" and "Remove" (Remove additionally purges the
// Storage object — see removeSubmissionPhoto). Never deletes the
// Firestore record itself: keeps rejectionReason/rejectedBy/rejectedAt as
// an audit trail. See docs/PRD.md "Admin Submissions".
export async function rejectSubmission(challengeId: string, uid: string, adminUid: string, reason: string): Promise<void> {
  const now = new Date().toISOString()
  await updateDoc(doc(submissionsCollection(challengeId), uid), {
    status: 'rejected',
    rejectedBy: adminUid,
    rejectedAt: now,
    rejectionReason: reason,
    updatedAt: now,
  })
  await deleteDoc(doc(galleryCollection(challengeId), uid)).catch(() => undefined)
}

// "Remove" — additionally deletes the Storage object(s) for a submission
// already rejected, per docs/PRD.md section 14. The Firestore record
// (with its rejection reason/admin/timestamp) is intentionally kept.
export async function removeSubmissionPhoto(submission: PhotoSubmission): Promise<void> {
  const storage = await getStorageInstance()
  if (!storage) return
  for (let v = 0; v <= submission.photoChangeCount; v++) {
    const ext = submission.storagePath.split('.').pop()
    await deleteObject(ref(storage, `photoChallenges/${submission.challengeId}/${submission.userId}/photo_${v}.${ext}`)).catch(
      () => undefined,
    )
  }
}

export interface GalleryPage {
  items: PhotoGalleryItem[]
  cursor: QueryDocumentSnapshot<DocumentData> | undefined
}

// Public. Paginated — never loads every approved photo at once. See
// docs/PRD.md "Community Gallery" / "Free Firebase Tier" constraints.
export async function getGalleryPage(challengeId: string, pageSize = 12, cursor?: QueryDocumentSnapshot<DocumentData>): Promise<GalleryPage> {
  const clauses = [orderBy('submittedAt', 'desc'), fbLimit(pageSize)]
  const q = cursor
    ? query(galleryCollection(challengeId), ...clauses, startAfter(cursor))
    : query(galleryCollection(challengeId), ...clauses)
  const snap = await getDocs(q)
  return {
    items: snap.docs.map((d) => withId<Omit<PhotoGalleryItem, 'id'>>(d)),
    cursor: snap.docs[snap.docs.length - 1],
  }
}
