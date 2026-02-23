export function normalizeCustomerResponse(data) {
  // aceita tanto { user, profile, addresses } quanto “flatten”
  const user = data?.user || data
  const profile = data?.profile || data?.customerProfile || user?.profile || null
  const addresses = data?.addresses || user?.addresses || []

  return { user, profile, addresses }
}
