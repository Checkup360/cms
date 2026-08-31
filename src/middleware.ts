import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { authenticateBackendUser } from './auth/backendAuthStrategy'
import { buildLoginUrl, getPublicRequestUrl } from './auth/frontend'

export async function middleware(request: NextRequest) {
  const user = await authenticateBackendUser(request.headers)
  const publicUrl = getPublicRequestUrl(request)

  if (!user) {
    return NextResponse.redirect(buildLoginUrl(publicUrl))
  }

  const CMS_ROLES = ['admin', 'content_manager']
  if (!user.roles?.some((r) => CMS_ROLES.includes(r))) {
    const url = new URL('/access-denied', publicUrl)
    url.searchParams.set('next', publicUrl)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
