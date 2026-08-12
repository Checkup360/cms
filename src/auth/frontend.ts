export const WEB_ORIGIN = (
  process.env.WEB_ORIGIN ||
  process.env.PUBLIC_WEB_ORIGIN ||
  'http://localhost:5173'
).replace(/\/$/, '')

export function buildLoginUrl(returnUrl: string): string {
  const url = new URL('/login', WEB_ORIGIN)
  url.searchParams.set('next', returnUrl)
  return url.toString()
}
