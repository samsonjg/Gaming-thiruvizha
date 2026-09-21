// One-off Admin SDK script to wipe test responses + questionStats for a
// poll, without touching the event/poll/questions/options themselves.
// Used once to clear out data written while testing (including data
// corrupted by the optionCounts dotted-key bug — see docs/CHANGELOG.md).
// Usage: node scripts/reset-test-data.cjs <pollId>
const path = require('path')
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
initializeApp({ credential: cert(require(path.resolve('./service-account.json'))) })
const db = getFirestore()

async function deleteCollection(ref) {
  const snap = await ref.get()
  const batch = db.batch()
  snap.docs.forEach((d) => batch.delete(d.ref))
  if (snap.docs.length) await batch.commit()
  return snap.docs.length
}

async function main() {
  const pollId = process.argv[2]
  if (!pollId) {
    console.error('Usage: node scripts/reset-test-data.cjs <pollId>')
    process.exit(1)
  }

  const responsesCount = await deleteCollection(db.collection('polls').doc(pollId).collection('responses'))
  const statsCount = await deleteCollection(db.collection('polls').doc(pollId).collection('questionStats'))

  console.log(`Deleted ${responsesCount} response(s) and ${statsCount} questionStats doc(s) for poll ${pollId}.`)
}

main().then(() => process.exit(0))
