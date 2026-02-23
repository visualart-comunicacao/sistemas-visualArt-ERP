const KEY = 'branding'

export function getBranding() {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setBranding(branding) {
  localStorage.setItem(KEY, JSON.stringify(branding))
}

export function getLogoUrl() {
  return getBranding()?.logoUrl || null
}
