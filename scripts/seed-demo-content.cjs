// One-off Admin SDK script to create a dummy Gaming Thiruvizha 2026 event
// + poll (published), using the same field shapes as
// repositories/events.repository.ts and repositories/polls.repository.ts.
// Bypasses the admin UI entirely — writes directly via the Admin SDK,
// which is allowed regardless of firestore.rules (the Admin SDK is
// privileged and does not go through security rules). Not part of the
// app's runtime — a manual setup convenience, same category as
// scripts/set-admin-claim.cjs. See docs/DEVELOPMENT.md.
//
// Usage: node scripts/seed-demo-content.cjs
const path = require('path')
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json'
initializeApp({ credential: cert(require(path.resolve(keyPath))) })
const db = getFirestore()

async function main() {
  const eventRef = db.collection('events').doc()
  const pollRef = db.collection('polls').doc()

  const event = {
    name: 'Gaming Thiruvizha 2026',
    description:
      'Gaming Thiruvizha is a flagship Pop Culture, Animation Visual Effects, Gaming and Comics IP and esports festival celebrating Indian gamers, cosplayers, anime enthusiasts, creators, digital youth and pop culture.',
    startDate: '2026-09-26',
    endDate: '2026-09-27',
    venue: 'Chennai Trade Centre, Nandambakkam',
    location: 'Ramapuram',
    categories: ['Experiences', 'Hangout'],
    kynEventId: 'kyn-evt-demo-001',
    pollId: pollRef.id,
    status: 'published',
  }

  const poll = {
    eventId: eventRef.id,
    name: 'Gaming Thiruvizha Audience Poll',
    status: 'published',
    publicSlug: 'gaming-thiruvizha-2026',
    flowMode: 'sequential',
    questionsPerScreen: 1,
  }

  await eventRef.set(event)
  await pollRef.set(poll)

  console.log('Created event:', eventRef.id)
  console.log('Created poll:', pollRef.id)
  console.log('Public poll URL: /poll/' + poll.publicSlug)
  console.log('\nNo questions were added — add them from the admin UI (Polls -> Questions -> Create Question) once signed in.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to seed demo content:', err.message)
    process.exit(1)
  })
