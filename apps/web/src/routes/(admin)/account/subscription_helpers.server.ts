export interface UserSessionData {
  id: string
  email?: string
  name?: string
}

export const getOrCreateCustomerId = async ({
  user,
}: {
  user: UserSessionData
}) => {
  return { customerId: `cus_${user.id}` }
}

export const fetchSubscription = async ({
  customerId,
}: {
  customerId: string
}) => {
  void customerId
  return {
    primarySubscription: null as { appSubscription?: { id: string } } | null,
    hasEverHadSubscription: false,
    error: null,
  }
}
