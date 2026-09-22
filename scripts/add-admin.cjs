// One-off Admin SDK script that creates a new Firebase Auth user with a
// temporary password AND grants them the `admin` custom claim in one
// step — see docs/ADMIN_PANEL.md "Bootstrapping the first admin" for the
// full manual process this shortcuts. Still requires service-account.json
// in the project root (Firebase console -> Project settings -> Service
// accounts -> Generate new private key) and `npm install --no-save
// firebase-admin`.
//
// There is deliberately no web UI for this — creating accounts and
// setting passwords can only be done with the Admin SDK (server-side
// only; the browser SDK cannot do either for another user), and wiring
// that into the admin panel would require a Cloud Function, which needs
// the paid Blaze plan. This script does the same thing for free, run
// locally by whoever owns the Firebase project.
//
// Usage:
//   node scripts/add-admin.cjs <email> <temporary-password> [display name]
//
// The temporary password is exactly that — share it with the new admin
// out-of-band (Slack/in person, not email/chat you wouldn't trust) and
// have them change it after first sign-in. There's no "must change
// password" enforcement in the app today (no change-password screen
// exists yet) — this is a manual/trust step, not a technical guarantee.
const path = require('path')
const { initializeApp, cert } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json'
initializeApp({ credential: cert(require(path.resolve(keyPath))) })

const [, , email, password, ...nameParts] = process.argv
const displayName = nameParts.join(' ') || undefined

if (!email || !password) {
  console.error('Usage: node scripts/add-admin.cjs <email> <temporary-password> [display name]')
  process.exit(1)
}
if (password.length < 6) {
  console.error('Firebase requires passwords to be at least 6 characters.')
  process.exit(1)
}

async function main() {
  const user = await getAuth().createUser({ email, password, displayName })
  await getAuth().setCustomUserClaims(user.uid, { admin: true })

  console.log(`Created admin account for ${email}`)
  console.log(`UID: ${user.uid}`)
  console.log(`Temporary password: ${password}`)
  console.log('\nShare the email + temporary password with them out-of-band. They can sign in at /admin immediately.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to create admin:', err.message)
    process.exit(1)
  })
