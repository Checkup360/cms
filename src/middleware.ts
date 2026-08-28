import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { authenticateBackendUser } from './auth/backendAuthStrategy'
import { buildLoginUrl } from './auth/frontend'

export async function middleware(request: NextRequest) {
  const user = await authenticateBackendUser(request.headers)

  if (!user) {
    return NextResponse.redirect(buildLoginUrl(request.url))
  }

  const CMS_ROLES = ['admin', 'content_manager']
  if (!user.roles?.some((r) => CMS_ROLES.includes(r))) {
    const url = new URL('/access-denied', request.url)
    url.searchParams.set('next', request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
