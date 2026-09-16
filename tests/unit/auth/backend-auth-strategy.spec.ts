import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SignJWT } from 'jose'
import {
  authenticateBackendUser,
  getBackendTokenExpiration,
  backendAuthStrategy,
} from '@/auth/backendAuthStrategy'

const TEST_SECRET = process.env.AUTH_SECRET || 'test-secret'

async function createTestJwt(options?: {
  sub?: string
  aud?: string
  exp?: number
  secret?: string
}): Promise<string> {
  const secretKey = new Uint8Array(Buffer.from(options?.secret ?? TEST_SECRET))
  const builder = new SignJWT({ user_id: options?.sub ?? 'user-123' })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(options?.aud ?? 'fastapi-users:auth')
    .setSubject(options?.sub ?? 'user-123')

  if (options?.exp) {
    builder.setExpirationTime(options.exp)
  } else {
    builder.setExpirationTime('1h')
  }

  return builder.sign(secretKey)
}

describe('Backend Auth Strategy', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  describe('authenticateBackendUser', () => {
    it('returns null when neither Authorization header nor auth cookie are present', async () => {
      const headers = new Headers()
      const user = await authenticateBackendUser(headers)
      expect(user).toBeNull()
    })

    it('authenticates successfully via Authorization: Bearer header', async () => {
      const token = await createTestJwt({ sub: 'admin-uuid-1' })
      const headers = new Headers({
        authorization: `Bearer ${token}`,
      })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          email: 'admin@checkup360.com',
          is_sysadmin: false,
          requires_onboarding: false,
          membership: {
            organization_id: 'org-456',
            organization_name: 'Acme Corp',
            roles: ['admin'],
          },
        }),
      } as Response)

      const user = await authenticateBackendUser(headers)

      expect(user).not.toBeNull()
      expect(user?.id).toBe('admin-uuid-1')
      expect(user?.email).toBe('admin@checkup360.com')
      expect(user?.organizationId).toBe('org-456')
      expect(user?.organizationName).toBe('Acme Corp')
      expect(user?.roles).toEqual(['admin'])
      expect(user?.isSysadmin).toBe(false)
      expect(user?.requiresOnboarding).toBe(false)
    })

    it('authenticates successfully via auth cookie', async () => {
      const token = await createTestJwt({ sub: 'cm-uuid-2' })
      const headers = new Headers({
        cookie: `theme=dark; auth=${token}; other=value`,
      })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          email: 'cm@checkup360.com',
          is_sysadmin: false,
          requires_onboarding: false,
          membership: {
            organization_id: 'org-789',
            organization_name: 'Health Org',
            roles: ['content_manager'],
          },
        }),
      } as Response)

      const user = await authenticateBackendUser(headers)

      expect(user).not.toBeNull()
      expect(user?.id).toBe('cm-uuid-2')
      expect(user?.roles).toEqual(['content_manager'])
    })

    it('returns null when JWT has wrong audience', async () => {
      const token = await createTestJwt({ aud: 'wrong-audience' })
      const headers = new Headers({
        authorization: `Bearer ${token}`,
      })

      const user = await authenticateBackendUser(headers)
      expect(user).toBeNull()
    })

    it('returns null when JWT has invalid signature', async () => {
      const token = await createTestJwt({ secret: 'completely-different-secret' })
      const headers = new Headers({
        authorization: `Bearer ${token}`,
      })

      const user = await authenticateBackendUser(headers)
      expect(user).toBeNull()
    })

    it('returns null when backend responds with 401 Unauthorized', async () => {
      const token = await createTestJwt({ sub: 'revoked-user' })
      const headers = new Headers({
        authorization: `Bearer ${token}`,
      })

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      } as Response)

      const user = await authenticateBackendUser(headers)
      expect(user).toBeNull()
    })

    it('handles user without membership (sysadmin)', async () => {
      const token = await createTestJwt({ sub: 'sysadmin-id' })
      const headers = new Headers({
        authorization: `Bearer ${token}`,
      })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          email: 'sysadmin@checkup360.com',
          is_sysadmin: true,
          requires_onboarding: false,
          membership: null,
        }),
      } as Response)

      const user = await authenticateBackendUser(headers)
      expect(user).not.toBeNull()
      expect(user?.isSysadmin).toBe(true)
      expect(user?.organizationId).toBeNull()
      expect(user?.roles).toEqual([])
    })
  })

  describe('getBackendTokenExpiration', () => {
    it('returns token exp timestamp from Authorization header', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600
      const token = await createTestJwt({ exp: futureExp })
      const headers = new Headers({ authorization: `Bearer ${token}` })

      const exp = getBackendTokenExpiration(headers)
      expect(exp).toBe(futureExp)
    })

    it('returns 0 when no token is present', () => {
      const headers = new Headers()
      expect(getBackendTokenExpiration(headers)).toBe(0)
    })
  })

  describe('backendAuthStrategy.authenticate', () => {
    it('provisions user row in Payload and returns user object', async () => {
      const token = await createTestJwt({ sub: 'user-provision-1' })
      const headers = new Headers({ authorization: `Bearer ${token}` })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          email: 'provision@example.com',
          is_sysadmin: false,
          requires_onboarding: false,
          membership: null,
        }),
      } as Response)

      const mockPayload = {
        find: vi.fn().mockResolvedValue({ docs: [] }),
        create: vi.fn().mockResolvedValue({ id: 'user-provision-1' }),
      }

      const result = await backendAuthStrategy.authenticate({
        headers,
        payload: mockPayload as any,
      } as any)

      expect(result.user).not.toBeNull()
      expect(result.user?.id).toBe('user-provision-1')
      expect(mockPayload.find).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'users',
          overrideAccess: true,
        })
      )
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'users',
          data: { id: 'user-provision-1', email: 'provision@example.com' },
        })
      )
    })
  })
})
