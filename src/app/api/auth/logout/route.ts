import { NextRequest, NextResponse } from 'next/server'

import { PUBLIC_WEB_ORIGIN } from '@/auth/frontend'

const BACKEND_URL = (
  process.env.BACKEND_URL || 'http://backend:8000'
).replace(/\/$/, '')

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'auth'

export async function POST(request: NextRequest) {
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value

  if (authCookie) {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          cookie: `${AUTH_COOKIE_NAME}=${authCookie}`,
        },
      })
    } catch (err) {
      console.error('[cms-logout] Failed to notify backend logout:', err)
    }
  }

  const response = NextResponse.json({
    success: true,
    redirectUrl: `${PUBLIC_WEB_ORIGIN}/login`,
  })

  response.cookies.set(AUTH_COOKIE_NAME, '', {
    path: '/',
    expires: new Date(0),
  })

  response.cookies.set('payload-token', '', {
    path: '/',
    expires: new Date(0),
  })

  return response
}
