// Core reusable data model for the Kyn Event Poll & Engagement Platform.
// Nothing in here is event-specific — Gaming Thiruvizha content lives only in seed data.

export type EventStatus = 'draft' | 'published' | 'closed'
export type PollStatus = 'draft' | 'published' | 'closed'
export type QuestionStatus = 'draft' | 'published' | 'unpublished'
export type FlowMode = 'sequential' | 'randomized'
export type ResponseSource = 'kyn' | 'external'

export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'rating'
  | 'emoji'
  | 'yes_no'
  | 'text'
  | 'image_choice'
  | 'ranking'

export interface EventRecord {
  id: string
  name: string
  description: string
  startDate: string // ISO date
  endDate: string // ISO date
  venue: string
  location: string
  categories: string[]
  imageUrl?: string
  kynEventId: string
  pollId: string
  status: EventStatus
}

export interface Poll {
  id: string
  eventId: string
  name: string
  status: PollStatus
  publicSlug: string
  flowMode: FlowMode
  questionsPerScreen: number
}

export interface QuestionSettings {
  resultsVisible: boolean
  randomizeOptions: boolean
  startAt?: string
  endAt?: string
  ratingScale?: 5 | 10
}

export interface Question {
  id: string
  pollId: string
  type: QuestionType
  title: string
  description?: string
  required: boolean
  order: number
  status: QuestionStatus
  settings: QuestionSettings
}

export interface QuestionOption {
  id: string
  questionId: string
  label: string
  emoji?: string
  imageUrl?: string
  order: number
  active: boolean
}

export interface Response {
  id: string
  pollId: string
  questionId: string
  sessionId: string
  userId?: string
  source: ResponseSource
  createdAt: string
}

export interface ResponseAnswer {
  responseId: string
  optionIds?: string[]
  textValue?: string
  ratingValue?: number
  rankingOrder?: string[]
}

export interface UserSession {
  sessionId: string
  userId?: string
  source: ResponseSource
  campaign?: string
  eventId?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

// Answer value shape used inside the in-progress poll flow (before persisting).
export type AnswerValue =
  | { kind: 'options'; optionIds: string[] }
  | { kind: 'text'; text: string }
  | { kind: 'rating'; rating: number }
  | { kind: 'ranking'; order: string[] }

export interface QuestionTypeMeta {
  type: QuestionType
  label: string
  description: string
  icon: string
  hasOptions: boolean
  supportsMultiple: boolean
}

// ---------------- Photo Challenge ----------------
// A second, independent engagement module alongside the Poll — see
// docs/PRD.md "Photo Challenge" and docs/FIREBASE_SCHEMA.md. Nothing here
// is referenced by any Poll type above; the two features share only the
// Firebase project, the admin shell, and the UI kit.

export type PhotoChallengeStatus = 'draft' | 'active' | 'inactive'
export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

export interface PhotoChallenge {
  id: string
  title: string
  question: string
  description: string
  rewardPoints: number
  status: PhotoChallengeStatus
  startAt: string // ISO date
  endAt: string // ISO date
  maxPhotos: number
  allowedPhotoChanges: number
  maxFileSizeBytes: number
  allowedFileTypes: string[] // MIME types, e.g. 'image/jpeg'
  termsContent: string
  termsVersion: string
  aiDeclarationText: string
  createdAt: string
  updatedAt: string
}

export interface PhotoSubmission {
  id: string // == userId
  challengeId: string
  userId: string
  imageUrl: string
  storagePath: string
  fileName: string
  fileSize: number
  contentType: string
  status: SubmissionStatus
  photoChangeCount: number
  termsAccepted: boolean
  termsAcceptedAt: string
  termsVersion: string
  realPhotoConfirmed: boolean
  realPhotoConfirmedAt: string
  submittedAt: string
  updatedAt: string
  rejectionReason?: string
  rejectedBy?: string
  rejectedAt?: string
  approvedBy?: string
  approvedAt?: string
}

// Public-safe denormalization of an approved submission — the only shape
// the public gallery ever reads. See FIREBASE_SCHEMA.md "gallery".
export interface PhotoGalleryItem {
  id: string
  imageUrl: string
  submittedAt: string
}
