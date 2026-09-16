import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'
import { middleware } from '@/middleware'
import * as authStrategy from '@/auth/backendAuthStrategy'

vi.mock('@/auth/backendAuthStrategy', () => ({
  authenticateBackendUser: vi.fn(),
}))

function createMockNextRequest(url: string, headers?: Record<string, string>): NextRequest {
  const parsed = new URL(url)
  const headersMap = new Headers(headers || {})

  return {
    nextUrl: {
      pathname: parsed.pathname,
      search: parsed.search,
      host: parsed.host,
      protocol: parsed.protocol,
    },
    headers: headersMap,
    url,
  } as unknown as NextRequest
}

describe('Middleware Route Protection', () => {
  const adminUrl = 'http://localhost:3000/admin/collections/pages'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects unauthenticated users to the login page with next parameter', async () => {
    vi.mocked(authStrategy.authenticateBackendUser).mockResolvedValue(null)

    const req = createMockNextRequest(adminUrl)
    const response = await middleware(req)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('/login')
    expect(location).toContain(`next=${encodeURIComponent(adminUrl)}`)
  })

  it('redirects users with non-CMS role (e.g. member) to /access-denied', async () => {
    vi.mocked(authStrategy.authenticateBackendUser).mockResolvedValue({
      id: 'member-123',
      email: 'member@example.com',
      collection: 'users',
      _strategy: 'backend-jwt',
      organizationId: 'org-1',
      organizationName: 'Org 1',
      roles: ['member'],
      isSysadmin: false,
      requiresOnboarding: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const req = createMockNextRequest(adminUrl)
    const response = await middleware(req)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('/access-denied')
    expect(location).toContain(`next=${encodeURIComponent(adminUrl)}`)
  })

  it('redirects users with empty roles list to /access-denied', async () => {
    vi.mocked(authStrategy.authenticateBackendUser).mockResolvedValue({
      id: 'norole-123',
      email: 'norole@example.com',
      collection: 'users',
      _strategy: 'backend-jwt',
      organizationId: 'org-1',
      organizationName: 'Org 1',
      roles: [],
      isSysadmin: false,
      requiresOnboarding: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const req = createMockNextRequest(adminUrl)
    const response = await middleware(req)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('/access-denied')
  })
})
