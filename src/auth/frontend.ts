import type { NextRequest } from 'next/server'

export const PUBLIC_WEB_ORIGIN = (
  process.env.PUBLIC_WEB_ORIGIN || 'http://localhost:5173'
).replace(/\/$/, '')

export function getPublicRequestUrl(request: NextRequest): string {
  const path = request.nextUrl.pathname + request.nextUrl.search

  const host = (
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    request.nextUrl.host
  )
    .split(',')[0]
    .trim()

  const proto = (
    request.headers.get('x-forwarded-proto') ||
    request.nextUrl.protocol.replace(':', '') ||
    'https'
  )
    .split(',')[0]
    .trim()

  return `${proto}://${host}${path}`
}

export function buildLoginUrl(returnUrl: string): string {
  const url = new URL('/login', PUBLIC_WEB_ORIGIN)
  url.searchParams.set('next', returnUrl)
  return url.toString()
}
