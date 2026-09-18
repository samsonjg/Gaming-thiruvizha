// One-off Admin SDK script to grant/revoke the `admin` custom claim.
// See docs/ADMIN_PANEL.md "Bootstrapping the first admin". This is
// deliberately NOT part of the app's runtime — it requires a service
// account key (a real secret, gitignored, never shipped to the browser).
//
// Usage:
//   node scripts/set-admin-claim.cjs <uid>            grant admin
//   node scripts/set-admin-claim.cjs <uid> --revoke     revoke admin
const path = require('path')
const { initializeApp, cert } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json'
initializeApp({ credential: cert(require(path.resolve(keyPath))) })

const uid = process.argv[2]
const revoke = process.argv.includes('--revoke')

if (!uid) {
  console.error('Usage: node scripts/set-admin-claim.cjs <uid> [--revoke]')
  process.exit(1)
}

getAuth()
  .setCustomUserClaims(uid, revoke ? {} : { admin: true })
  .then(() => {
    console.log(`${revoke ? 'Revoked' : 'Granted'} admin claim for uid ${uid}`)
    console.log('The user must sign out and back in for this to take effect.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Failed to set custom claim:', err.message)
    process.exit(1)
  })
