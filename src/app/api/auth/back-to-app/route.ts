import { NextResponse } from 'next/server'

import { PUBLIC_WEB_ORIGIN } from '@/auth/frontend'

export async function GET() {
  return NextResponse.redirect(PUBLIC_WEB_ORIGIN)
}
