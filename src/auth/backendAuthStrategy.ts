import type { AuthStrategyFunctionArgs, Payload } from 'payload'
import { decodeJwt, jwtVerify } from 'jose'

const AUTH_SECRET = process.env.AUTH_SECRET || ''
export const BACKEND_URL = (process.env.BACKEND_URL || 'http://backend:8000').replace(
  /\/$/,
  ''
)
export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'auth'
const TOKEN_AUDIENCE = 'fastapi-users:auth'

export interface BackendUser {
  id: string
  email: string
  collection: 'users'
  _strategy: string
  organizationId: string | null
  organizationName: string | null
  roles: string[]
  isSysadmin: boolean
  requiresOnboarding: boolean
  createdAt: string
  updatedAt: string
}

interface AuthMeResponse {
  email: string
  is_sysadmin: boolean
  membership: {
    organization_id: string
    organization_name: string
    roles: string[]
  } | null
  requires_onboarding: boolean
}

export function getTokenFromHeaders(headers: Headers): string | null {
  const authHeader = headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length)
  }

  const cookieHeader = headers.get('cookie')
  if (!cookieHeader) return null

  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === AUTH_COOKIE_NAME) {
      return rest.join('=') || null
    }
  }

  return null
}

async function fetchBackendUser(token: string): Promise<BackendUser | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
      cache: 'no-store',
    })
    if (!response.ok) return null

    const me = (await response.json()) as AuthMeResponse
    const now = new Date().toISOString()
    return {
      id: '',
      email: me.email,
      collection: 'users',
      _strategy: 'backend-jwt',
      organizationId: me.membership?.organization_id ?? null,
      organizationName: me.membership?.organization_name ?? null,
      roles: me.membership?.roles ?? [],
      isSysadmin: me.is_sysadmin,
      requiresOnboarding: me.requires_onboarding,
      createdAt: now,
      updatedAt: now,
    }
  } catch {
    return null
  }
}

export async function authenticateBackendUser(
  headers: Headers
): Promise<BackendUser | null> {
  const token = getTokenFromHeaders(headers)
  if (!token) return null

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(AUTH_SECRET),
      { algorithms: ['HS256'], audience: TOKEN_AUDIENCE }
    )
    const sub = payload.sub
    if (!sub) return null

    const user = await fetchBackendUser(token)
    if (!user) return null

    return { ...user, id: sub }
  } catch {
    return null
  }
}

export function getBackendTokenExpiration(headers: Headers): number {
  const token = getTokenFromHeaders(headers)
  if (!token) return 0
  try {
    const { exp } = decodeJwt(token)
    return typeof exp === 'number' ? exp : 0
  } catch {
    return 0
  }
}

async function ensureUserRow(
  payload: Payload,
  id: string,
  email: string
): Promise<void> {
  try {
    const existing = await payload.find({
      collection: 'users',
      where: { id: { equals: id } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs.length === 0) {
      await payload.create({
        collection: 'users',
        data: { id, email },
        overrideAccess: true,
      })
    }
  } catch (err) {
    console.warn(`[cms-auth] failed to provision users row for ${id}:`, err)
  }
}

export const backendAuthStrategy = {
  name: 'backend-jwt',
  authenticate: async (args: AuthStrategyFunctionArgs) => {
    const user = await authenticateBackendUser(args.headers)
    if (user) {
      await ensureUserRow(args.payload, user.id, user.email)
    }
    return { user }
  },
}
