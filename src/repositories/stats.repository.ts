import type { Question } from '../types/schema'
import { getOptions } from './options.repository'
import { getQuestions } from './questions.repository'
import { getResponseRows } from './responses.repository'

export interface OptionResult {
  optionId: string
  label: string
  emoji?: string
  count: number
  pct: number
}

// [TEMPORARY / NOT PRODUCTION READY] These aggregation functions currently
// scan raw responses client-side, which is only acceptable because the
// prototype's localStorage store has no other real users to protect. The
// Firestore version of this repository must read a public `questionStats`
// counters document instead of raw responses — see docs/FIREBASE_SCHEMA.md
// ("Aggregated Results without exposing individual responses").
export async function getOptionResults(questionId: string): Promise<OptionResult[]> {
  const options = await getOptions(questionId)
  const rows = await getResponseRows({ questionId })
  const counts = new Map<string, number>()
  let total = 0

  for (const row of rows) {
    for (const optId of row.answer?.optionIds ?? []) {
      counts.set(optId, (counts.get(optId) ?? 0) + 1)
      total += 1
    }
  }

  return options
    .map((o) => ({
      optionId: o.id,
      label: o.label,
      emoji: o.emoji,
      count: counts.get(o.id) ?? 0,
      pct: total > 0 ? Math.round(((counts.get(o.id) ?? 0) / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

export async function getRatingAverage(
  questionId: string,
): Promise<{ average: number; count: number; distribution: Record<number, number> }> {
  const rows = await getResponseRows({ questionId })
  const values = rows.map((r) => r.answer?.ratingValue).filter((v): v is number => typeof v === 'number')
  const distribution: Record<number, number> = {}
  values.forEach((v) => {
    distribution[v] = (distribution[v] ?? 0) + 1
  })
  const average = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0
  return { average, count: values.length, distribution }
}

export async function getTextAnswers(questionId: string): Promise<string[]> {
  const rows = await getResponseRows({ questionId })
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

export async function getPollAnalytics(pollId: string): Promise<PollAnalytics> {
  const questions: Question[] = await getQuestions(pollId)
  const activeQuestions = questions.filter((q) => q.status === 'published')
  const rows = await getResponseRows({ pollId })

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
