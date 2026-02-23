export function toAbsoluteUrl(url, base = import.meta.env.VITE_API_URL) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  // base = "http://localhost:3000/api/v1" -> queremos "http://localhost:3000"
  const origin = base.replace(/\/api\/v1\/?$/, '')
  return `${origin}${url}`
}
