import { doc, getDoc } from 'firebase/firestore'
import type { Question } from '../types/schema'
import { requireDb } from './_firestore'
import * as optionsRepository from './options.repository'
import * as questionsRepository from './questions.repository'
import * as responsesRepository from './responses.repository'

export interface OptionResult {
  optionId: string
  label: string
  emoji?: string
  count: number
  pct: number
}

interface QuestionStatsDoc {
  optionCounts?: Record<string, number>
  ratingSum?: number
  ratingCount?: number
  totalResponses?: number
  textCount?: number
}

// Public-safe aggregate: reads the questionStats counters doc, never the
// raw responses subcollection. See docs/FIREBASE_SCHEMA.md "Aggregated
// results without exposing individual responses" — this is what the
// public poll results screen calls.
export async function getOptionResults(pollId: string, questionId: string): Promise<OptionResult[]> {
  const [options, statsSnap] = await Promise.all([
    optionsRepository.getOptions(pollId, questionId),
    getDoc(doc(requireDb(), 'polls', pollId, 'questionStats', questionId)),
  ])
  const stats = (statsSnap.data() as QuestionStatsDoc | undefined) ?? {}
  const counts = stats.optionCounts ?? {}
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return options
    .map((o) => ({
      optionId: o.id,
      label: o.label,
      emoji: o.emoji,
      count: counts[o.id] ?? 0,
      pct: total > 0 ? Math.round(((counts[o.id] ?? 0) / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

// Admin-only (used by the Analytics screen, which sits behind RequireAdmin)
// — reads raw responses for the full 1-5/1-10 distribution, which the
// public questionStats counters doc doesn't carry.
export async function getRatingAverage(
  pollId: string,
  questionId: string,
): Promise<{ average: number; count: number; distribution: Record<number, number> }> {
  const rows = await responsesRepository.getResponseRows({ pollId, questionId })
  const values = rows.map((r) => r.answer?.ratingValue).filter((v): v is number => typeof v === 'number')
  const distribution: Record<number, number> = {}
  values.forEach((v) => {
    distribution[v] = (distribution[v] ?? 0) + 1
  })
  const average = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0
  return { average, count: values.length, distribution }
}

export async function getTextAnswers(pollId: string, questionId: string): Promise<string[]> {
  const rows = await responsesRepository.getResponseRows({ pollId, questionId })
  return rows.map((r) => r.answer?.textValue).filter((v): v is string => Boolean(v))
}

export interface PollAnalytics {
  participants: number
  totalResponses: number
  completionRate: number
  activeQuestions: number
  kynPct: number
  externalPct: number
  trend: { date: string; count: number }[]
  funnel: { stage: string; count: number }[]
  questionPerformance: { questionId: string; title: string; responses: number }[]
}

// Admin-only — reads raw responses (session/source/timestamp granularity
// that the public counters doc doesn't have). See RequireAdmin on the
// Dashboard/Analytics routes and firestore.rules for the actual boundary.
export async function getPollAnalytics(pollId: string): Promise<PollAnalytics> {
  const questions: Question[] = await questionsRepository.getQuestions(pollId)
  const activeQuestions = questions.filter((q) => q.status === 'published')
  const rows = await responsesRepository.getResponseRows({ pollId })

  const sessions = new Set(rows.map((r) => r.response.sessionId))
  const participants = sessions.size

  const kynCount = rows.filter((r) => r.response.source === 'kyn').length
  const externalCount = rows.length - kynCount

  const first = activeQuestions[0]
  const last = activeQuestions[activeQuestions.length - 1]
  let completedSessions = 0
  let completionBase = 1
  if (first && last) {
    const firstSet = new Set(rows.filter((r) => r.response.questionId === first.id).map((r) => r.response.sessionId))
    const lastSet = new Set(rows.filter((r) => r.response.questionId === last.id).map((r) => r.response.sessionId))
    completedSessions = [...firstSet].filter((s) => lastSet.has(s)).length
    completionBase = firstSet.size || 1
  }

  const trendMap = new Map<string, number>()
  rows.forEach((r) => {
    const date = r.response.createdAt.slice(0, 10)
    trendMap.set(date, (trendMap.get(date) ?? 0) + 1)
  })
  const trend = [...trendMap.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, count]) => ({ date, count }))

  const funnel = activeQuestions.map((q, idx) => {
    const answeredSessions = new Set(rows.filter((r) => r.response.questionId === q.id).map((r) => r.response.sessionId))
    return { stage: `Q${idx + 1} answered`, count: answeredSessions.size }
  })

  const questionPerformance = activeQuestions.map((q) => ({
    questionId: q.id,
    title: q.title,
    responses: rows.filter((r) => r.response.questionId === q.id).length,
  }))

  return {
    participants,
    totalResponses: rows.length,
    completionRate: Math.round((completedSessions / completionBase) * 100),
    activeQuestions: activeQuestions.length,
    kynPct: rows.length ? Math.round((kynCount / rows.length) * 100) : 0,
    externalPct: rows.length ? Math.round((externalCount / rows.length) * 100) : 0,
    trend,
    funnel,
    questionPerformance,
  }
}
