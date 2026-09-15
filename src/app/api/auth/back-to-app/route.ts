import { NextResponse } from 'next/server'

const WEB_ORIGIN = (
  process.env.PUBLIC_WEB_ORIGIN ||
  process.env.WEB_ORIGIN ||
  'http://localhost:5173'
).replace(/\/$/, '')

export async function GET() {
  return NextResponse.redirect(WEB_ORIGIN)
}
