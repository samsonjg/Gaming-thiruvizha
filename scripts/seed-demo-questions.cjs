// One-off Admin SDK script to add the 5 demo questions (+ options) from
// docs/PRD.md §3 to the Gaming Thiruvizha poll created by
// seed-demo-content.cjs. Same category as that script — manual setup
// convenience, not app runtime. See docs/DEVELOPMENT.md.
//
// Usage: node scripts/seed-demo-questions.cjs <pollId>
const path = require('path')
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json'
initializeApp({ credential: cert(require(path.resolve(keyPath))) })
const db = getFirestore()

const pollId = process.argv[2]
if (!pollId) {
  console.error('Usage: node scripts/seed-demo-questions.cjs <pollId>')
  process.exit(1)
}

const baseSettings = { resultsVisible: true, randomizeOptions: false }

const questions = [
  {
    type: 'single_choice',
    title: 'What are you most excited about at Gaming Thiruvizha?',
    required: true,
    order: 1,
    settings: { ...baseSettings },
    options: [
      { label: 'Gaming & Esports', emoji: '🎮' },
      { label: 'Cosplay & Anime', emoji: '🎭' },
      { label: 'Gaming Creator Awards', emoji: '🏆' },
      { label: 'Chess', emoji: '♟️' },
      { label: 'PC / Console Gaming', emoji: '🖥️' },
      { label: 'Art & Pop Culture', emoji: '🎨' },
      { label: 'Food & Carnival', emoji: '🍔' },
      { label: 'Live Entertainment', emoji: '🎤' },
    ],
  },
  {
    type: 'multiple_choice',
    title: 'Which zones are you planning to explore?',
    required: true,
    order: 2,
    settings: { ...baseSettings },
    options: [
      { label: 'Gaming Arena', emoji: '🎮' },
      { label: 'Cosplay Zone', emoji: '🎭' },
      { label: 'Anime Zone', emoji: '👘' },
      { label: 'Chess Zone', emoji: '♟️' },
      { label: 'PC Modding', emoji: '🖥️' },
      { label: 'BYOC', emoji: '💻' },
      { label: 'Food & Carnival', emoji: '🍢' },
      { label: 'Creator Zone', emoji: '📸' },
    ],
  },
  {
    type: 'rating',
    title: 'How excited are you for Gaming Thiruvizha?',
    required: true,
    order: 3,
    settings: { ...baseSettings, ratingScale: 5 },
    options: [],
  },
  {
    type: 'single_choice',
    title: 'Which activity would you recommend to your friends?',
    required: true,
    order: 4,
    settings: { ...baseSettings },
    options: [
      { label: 'Gaming & Esports', emoji: '🎮' },
      { label: 'Cosplay', emoji: '🎭' },
      { label: 'Chess', emoji: '♟️' },
      { label: 'Anime', emoji: '👘' },
      { label: 'Creator Awards', emoji: '🏆' },
      { label: 'Live Entertainment', emoji: '🎤' },
    ],
  },
  {
    type: 'text',
    title: 'What would you like to see at the next Gaming Thiruvizha?',
    required: false,
    order: 5,
    settings: { ...baseSettings, resultsVisible: false },
    options: [],
  },
]

async function main() {
  const pollSnap = await db.collection('polls').doc(pollId).get()
  if (!pollSnap.exists) {
    console.error(`No poll found with id ${pollId}`)
    process.exit(1)
  }

  for (const q of questions) {
    const { options, ...questionFields } = q
    const questionRef = db.collection('polls').doc(pollId).collection('questions').doc()
    await questionRef.set({ ...questionFields, pollId, status: 'published' })

    let i = 1
    for (const opt of options) {
      const optionRef = questionRef.collection('options').doc()
      await optionRef.set({ ...opt, questionId: questionRef.id, order: i, active: true })
      i++
    }

    console.log(`Created Q${q.order}: ${q.title} (${questionRef.id}, ${options.length} options)`)
  }

  console.log('\nDone. Poll is ready at /poll/<slug>.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to seed questions:', err.message)
    process.exit(1)
  })
