import type {
  EventRecord,
  Poll,
  Question,
  QuestionOption,
  Response,
  ResponseAnswer,
} from '../types/schema'

export const GT_EVENT_ID = 'evt-gaming-thiruvizha-2026'
export const GT_POLL_ID = 'poll-gt-2026-audience'
export const GT_POLL_SLUG = 'gaming-thiruvizha-2026'

export const seedEvent: EventRecord = {
  id: GT_EVENT_ID,
  name: 'Gaming Thiruvizha 2026',
  description:
    'Gaming Thiruvizha is a flagship Pop Culture, Animation Visual Effects, Gaming and Comics IP and esports festival celebrating Indian gamers, cosplayers, anime enthusiasts, creators, digital youth and pop culture.',
  startDate: '2026-09-26',
  endDate: '2026-09-27',
  venue: 'Chennai Trade Centre, Nandambakkam',
  location: 'Ramapuram',
  categories: ['Experiences', 'Hangout'],
  imageUrl: '',
  kynEventId: 'kyn-evt-10293',
  pollId: GT_POLL_ID,
  status: 'published',
}

export const seedPoll: Poll = {
  id: GT_POLL_ID,
  eventId: GT_EVENT_ID,
  name: 'Gaming Thiruvizha Audience Poll',
  status: 'published',
  publicSlug: GT_POLL_SLUG,
  flowMode: 'sequential',
  questionsPerScreen: 1,
}

const baseSettings = {
  resultsVisible: true,
  randomizeOptions: false,
}

export const seedQuestions: Question[] = [
  {
    id: 'q1-excited',
    pollId: GT_POLL_ID,
    type: 'single_choice',
    title: 'What are you most excited about at Gaming Thiruvizha?',
    required: true,
    order: 1,
    status: 'published',
    settings: { ...baseSettings },
  },
  {
    id: 'q2-zones',
    pollId: GT_POLL_ID,
    type: 'multiple_choice',
    title: 'Which zones are you planning to explore?',
    required: true,
    order: 2,
    status: 'published',
    settings: { ...baseSettings },
  },
  {
    id: 'q3-excitement-rating',
    pollId: GT_POLL_ID,
    type: 'rating',
    title: 'How excited are you for Gaming Thiruvizha?',
    required: true,
    order: 3,
    status: 'published',
    settings: { ...baseSettings, ratingScale: 5 },
  },
  {
    id: 'q4-recommend',
    pollId: GT_POLL_ID,
    type: 'single_choice',
    title: 'Which activity would you recommend to your friends?',
    required: true,
    order: 4,
    status: 'published',
    settings: { ...baseSettings },
  },
  {
    id: 'q5-next-time',
    pollId: GT_POLL_ID,
    type: 'text',
    title: 'What would you like to see at the next Gaming Thiruvizha?',
    required: false,
    order: 5,
    status: 'published',
    settings: { ...baseSettings, resultsVisible: false },
  },
]

export const seedOptions: QuestionOption[] = [
  // Q1
  { id: 'q1-o1', questionId: 'q1-excited', label: 'Gaming & Esports', emoji: '🎮', order: 1, active: true },
  { id: 'q1-o2', questionId: 'q1-excited', label: 'Cosplay & Anime', emoji: '🎭', order: 2, active: true },
  { id: 'q1-o3', questionId: 'q1-excited', label: 'Gaming Creator Awards', emoji: '🏆', order: 3, active: true },
  { id: 'q1-o4', questionId: 'q1-excited', label: 'Chess', emoji: '♟️', order: 4, active: true },
  { id: 'q1-o5', questionId: 'q1-excited', label: 'PC / Console Gaming', emoji: '🖥️', order: 5, active: true },
  { id: 'q1-o6', questionId: 'q1-excited', label: 'Art & Pop Culture', emoji: '🎨', order: 6, active: true },
  { id: 'q1-o7', questionId: 'q1-excited', label: 'Food & Carnival', emoji: '🍔', order: 7, active: true },
  { id: 'q1-o8', questionId: 'q1-excited', label: 'Live Entertainment', emoji: '🎤', order: 8, active: true },
  // Q2
  { id: 'q2-o1', questionId: 'q2-zones', label: 'Gaming Arena', emoji: '🎮', order: 1, active: true },
  { id: 'q2-o2', questionId: 'q2-zones', label: 'Cosplay Zone', emoji: '🎭', order: 2, active: true },
  { id: 'q2-o3', questionId: 'q2-zones', label: 'Anime Zone', emoji: '👘', order: 3, active: true },
  { id: 'q2-o4', questionId: 'q2-zones', label: 'Chess Zone', emoji: '♟️', order: 4, active: true },
  { id: 'q2-o5', questionId: 'q2-zones', label: 'PC Modding', emoji: '🖥️', order: 5, active: true },
  { id: 'q2-o6', questionId: 'q2-zones', label: 'BYOC', emoji: '💻', order: 6, active: true },
  { id: 'q2-o7', questionId: 'q2-zones', label: 'Food & Carnival', emoji: '🍢', order: 7, active: true },
  { id: 'q2-o8', questionId: 'q2-zones', label: 'Creator Zone', emoji: '📸', order: 8, active: true },
  // Q4
  { id: 'q4-o1', questionId: 'q4-recommend', label: 'Gaming & Esports', emoji: '🎮', order: 1, active: true },
  { id: 'q4-o2', questionId: 'q4-recommend', label: 'Cosplay', emoji: '🎭', order: 2, active: true },
  { id: 'q4-o3', questionId: 'q4-recommend', label: 'Chess', emoji: '♟️', order: 3, active: true },
  { id: 'q4-o4', questionId: 'q4-recommend', label: 'Anime', emoji: '👘', order: 4, active: true },
  { id: 'q4-o5', questionId: 'q4-recommend', label: 'Creator Awards', emoji: '🏆', order: 5, active: true },
  { id: 'q4-o6', questionId: 'q4-recommend', label: 'Live Entertainment', emoji: '🎤', order: 6, active: true },
]

// ---- Mock historical responses, so the admin dashboard/analytics have realistic numbers ----

function pickWeighted<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = Math.random() * total
  for (const item of items) {
    if (r < item.weight) return item.value
    r -= item.weight
  }
  return items[items.length - 1].value
}

function randomDateInLastDays(days: number): string {
  const now = Date.now()
  const past = now - Math.random() * days * 24 * 60 * 60 * 1000
  return new Date(past).toISOString()
}

export function generateMockResponses(count = 1284): {
  responses: Response[]
  answers: ResponseAnswer[]
} {
  const responses: Response[] = []
  const answers: ResponseAnswer[] = []

  const q1Weights = [
    { value: 'q1-o1', weight: 42 },
    { value: 'q1-o2', weight: 28 },
    { value: 'q1-o3', weight: 8 },
    { value: 'q1-o4', weight: 14 },
    { value: 'q1-o5', weight: 4 },
    { value: 'q1-o6', weight: 2 },
    { value: 'q1-o7', weight: 1 },
    { value: 'q1-o8', weight: 1 },
  ]

  const q2Options = seedOptions.filter((o) => o.questionId === 'q2-zones')
  const q4Weights = [
    { value: 'q4-o1', weight: 38 },
    { value: 'q4-o2', weight: 24 },
    { value: 'q4-o3', weight: 12 },
    { value: 'q4-o4', weight: 14 },
    { value: 'q4-o5', weight: 7 },
    { value: 'q4-o6', weight: 5 },
  ]

  const textSuggestions = [
    'More indie game booths!',
    'Longer BGMI finals',
    'A dedicated retro gaming zone',
    'More cosplay competition slots',
    'Live music between matches',
    'Better queue management',
    'More merch variety',
  ]

  for (let i = 0; i < count; i++) {
    const sessionId = `mock-session-${i}`
    const source: 'kyn' | 'external' = Math.random() < 0.72 ? 'kyn' : 'external'
    const createdAt = randomDateInLastDays(14)

    // Not every mock session answers every question — models a completion funnel.
    const answeredQ1 = true
    const answeredQ2 = Math.random() < 0.91
    const answeredQ3 = Math.random() < 0.85
    const answeredQ4 = Math.random() < 0.8
    const answeredQ5 = Math.random() < 0.62

    if (answeredQ1) {
      const optionId = pickWeighted(q1Weights)
      const r: Response = {
        id: `r-${i}-q1`,
        pollId: GT_POLL_ID,
        questionId: 'q1-excited',
        sessionId,
        source,
        createdAt,
      }
      responses.push(r)
      answers.push({ responseId: r.id, optionIds: [optionId] })
    }

    if (answeredQ2) {
      const numPicks = 1 + Math.floor(Math.random() * 3)
      const shuffled = [...q2Options].sort(() => Math.random() - 0.5).slice(0, numPicks)
      const r: Response = {
        id: `r-${i}-q2`,
        pollId: GT_POLL_ID,
        questionId: 'q2-zones',
        sessionId,
        source,
        createdAt,
      }
      responses.push(r)
      answers.push({ responseId: r.id, optionIds: shuffled.map((o) => o.id) })
    }

    if (answeredQ3) {
      const rating = pickWeighted([
        { value: 1, weight: 2 },
        { value: 2, weight: 3 },
        { value: 3, weight: 10 },
        { value: 4, weight: 35 },
        { value: 5, weight: 50 },
      ])
      const r: Response = {
        id: `r-${i}-q3`,
        pollId: GT_POLL_ID,
        questionId: 'q3-excitement-rating',
        sessionId,
        source,
        createdAt,
      }
      responses.push(r)
      answers.push({ responseId: r.id, ratingValue: rating })
    }

    if (answeredQ4) {
      const optionId = pickWeighted(q4Weights)
      const r: Response = {
        id: `r-${i}-q4`,
        pollId: GT_POLL_ID,
        questionId: 'q4-recommend',
        sessionId,
        source,
        createdAt,
      }
      responses.push(r)
      answers.push({ responseId: r.id, optionIds: [optionId] })
    }

    if (answeredQ5) {
      const text = textSuggestions[Math.floor(Math.random() * textSuggestions.length)]
      const r: Response = {
        id: `r-${i}-q5`,
        pollId: GT_POLL_ID,
        questionId: 'q5-next-time',
        sessionId,
        source,
        createdAt,
      }
      responses.push(r)
      answers.push({ responseId: r.id, textValue: text })
    }
  }

  return { responses, answers }
}
