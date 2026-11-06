import { redirect } from "@sveltejs/kit"
import {
  fetchSubscription,
  getOrCreateCustomerId,
} from "../../subscription_helpers.server"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user
  if (!user?.id) {
    redirect(303, "/login/sign_in")
  }

  const { customerId } = await getOrCreateCustomerId({ user })

  const { primarySubscription, hasEverHadSubscription } =
    await fetchSubscription({
      customerId: customerId || `cus_${user.id}`,
    })

  return {
    isActiveCustomer: !!primarySubscription,
    hasEverHadSubscription,
    currentPlanId: primarySubscription?.appSubscription?.id,
  }
}
