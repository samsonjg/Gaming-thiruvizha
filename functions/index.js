const { onMessagePublished } = require('firebase-functions/v2/pubsub')
const { CloudBillingClient } = require('@google-cloud/billing')

// Hard billing cutoff — last-resort safety net, not a substitute for the
// email budget alerts (50%/80%/100%) set up in Google Cloud Billing. This
// function is triggered by the SAME budget's Pub/Sub notification and,
// only once actual spend has reached or exceeded the configured budget
// amount, disables billing for this project entirely. That takes Hosting,
// Firestore, Storage and Auth OFFLINE immediately — there is no grace
// period, and it must be manually re-enabled in the Cloud Console
// afterward (Billing -> link a billing account to the project again).
//
// Setup this function alone does NOT complete — see docs/DEPLOYMENT.md
// "Billing hard cutoff" for the required manual console steps (creating
// the Pub/Sub topic from the budget's "Manage notifications" screen, and
// granting this function's runtime service account the Billing Account
// Administrator role on the billing account). Those steps grant a
// genuinely sensitive permission and are intentionally left for the
// project owner to do themselves, not automated here.
//
// Adapted from Google's own documented pattern:
// https://cloud.google.com/billing/docs/how-to/notify#cap_disable_billing_to_stop_usage
exports.stopBillingOnBudgetExceeded = onMessagePublished(
  { topic: 'budget-alerts', region: 'us-central1' },
  async (event) => {
    const budgetNotification = event.data.message.json
    const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT

    if (!budgetNotification || typeof budgetNotification.costAmount !== 'number') {
      console.log('Ignoring malformed or non-budget Pub/Sub message.')
      return
    }

    if (budgetNotification.costAmount <= budgetNotification.budgetAmount) {
      console.log(
        `No action necessary — current cost ${budgetNotification.costAmount} ${budgetNotification.currencyCode} ` +
          `is within the ${budgetNotification.budgetAmount} ${budgetNotification.currencyCode} budget.`,
      )
      return
    }

    console.warn(
      `Budget exceeded: cost ${budgetNotification.costAmount} ${budgetNotification.currencyCode} > ` +
        `budget ${budgetNotification.budgetAmount} ${budgetNotification.currencyCode}. Disabling billing for ${projectId}.`,
    )
    await disableBillingForProject(projectId)
  },
)

async function disableBillingForProject(projectId) {
  const billing = new CloudBillingClient()
  const projectName = `projects/${projectId}`

  const [billingInfo] = await billing.getProjectBillingInfo({ name: projectName })
  if (!billingInfo.billingEnabled) {
    console.log('Billing is already disabled for this project — nothing to do.')
    return
  }

  await billing.updateProjectBillingInfo({
    name: projectName,
    projectBillingInfo: { billingAccountName: '' },
  })
  console.warn(`Billing disabled for ${projectId}. Re-enable manually in Cloud Console when ready.`)
}
