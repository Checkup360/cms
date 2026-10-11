import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SignJWT } from 'jose'

const { deleteCookieMock } = vi.hoisted(() => ({ deleteCookieMock: vi.fn() }))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ delete: deleteCookieMock })),
}))

import { Users } from '@/collections/Users'

const TEST_SECRET = process.env.AUTH_SECRET || 'test-secret'

async function createTestJwt(exp?: number): Promise<string> {
  const secretKey = new Uint8Array(Buffer.from(TEST_SECRET))
  const builder = new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience('fastapi-users:auth')
    .setSubject('user-123')
    .setExpirationTime(exp ?? '1h')

  return builder.sign(secretKey)
}

describe('Users collection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('access control', () => {
    const read = Users.access?.read as any
    const update = Users.access?.update as any

    it('lets a user read their own record', () => {
      expect(read({ req: { user: { id: 'u1' } }, id: 'u1' })).toBe(true)
    })

    it('blocks reading another user record', () => {
      expect(read({ req: { user: { id: 'u1' } }, id: 'u2' })).toBe(false)
    })

    it('blocks anonymous reads', () => {
      expect(read({ req: { user: null }, id: 'u1' })).toBe(false)
    })

    it('lets a user update their own record', () => {
      expect(update({ req: { user: { id: 'u1' } }, id: 'u1' })).toBe(true)
    })

    it('blocks updating another user record', () => {
      expect(update({ req: { user: { id: 'u1' } }, id: 'u2' })).toBe(false)
    })

    it('never allows creating users (the backend owns identities)', () => {
      expect((Users.access?.create as any)()).toBe(false)
    })

    it('never allows deleting users', () => {
      expect((Users.access?.delete as any)()).toBe(false)
    })
  })

  describe('afterRead hook', () => {
    const afterRead = Users.hooks?.afterRead?.[0] as any

    it('copies session fields onto the own user document', () => {
      const doc: any = { id: 'u1' }

      const result = afterRead({
        doc,
        req: {
          user: {
            id: 'u1',
            organizationId: 'org-1',
            organizationName: 'Acme',
            roles: ['admin'],
            isSysadmin: true,
          },
        },
      })

      expect(result.organizationId).toBe('org-1')
      expect(result.organizationName).toBe('Acme')
      expect(result.roles).toEqual(['admin'])
      expect(result.isSysadmin).toBe(true)
    })

    it('does not leak session fields onto other documents', () => {
      const doc: any = { id: 'u1' }

      const result = afterRead({
        doc,
        req: { user: { id: 'u2', organizationId: 'org-1', roles: ['admin'] } },
      })

      expect(result.organizationId).toBeUndefined()
      expect(result.roles).toBeUndefined()
    })
  })

  describe('me hook', () => {
    const me = Users.hooks?.me?.[0] as any

    it('returns the token expiry and the current user', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600
      const token = await createTestJwt(futureExp)

      const result = me({
        args: {
          req: {
            user: { id: 'u1' },
            headers: new Headers({ authorization: `Bearer ${token}` }),
          },
        },
      })

      expect(result.exp).toBe(futureExp)
      expect(result.user.id).toBe('u1')
    })

    it('returns undefined when there is no user', () => {
      const result = me({ args: { req: { user: null } } })

      expect(result).toBeUndefined()
    })
  })

  describe('POST /users/logout', () => {
    const handler = (Users.endpoints || []).find((e) => e.path === '/logout')?.handler as any

    it('notifies the backend and clears the auth cookies', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        headers: new Headers({ 'set-cookie': 'auth=cleared; Path=/' }),
      } as Response)

      const response = await handler({ headers: new Headers({ cookie: 'auth=token-123' }) })

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          headers: { cookie: 'auth=token-123' },
        }),
      )
      expect(deleteCookieMock).toHaveBeenCalledWith('auth')
      expect(await response.json()).toEqual({ success: true })
      expect(response.headers.getSetCookie()).toContain('auth=cleared; Path=/')
    })

    it('does not call the backend when there is no session cookie', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        headers: new Headers(),
      } as Response)

      const response = await handler({ headers: new Headers() })

      expect(fetchMock).not.toHaveBeenCalled()
      expect(await response.json()).toEqual({ success: true })
    })

    it('still logs out when the backend call fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'))
      vi.spyOn(console, 'warn').mockImplementation(() => {})

      const response = await handler({ headers: new Headers({ cookie: 'auth=token-123' }) })

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ success: true })
      expect(deleteCookieMock).toHaveBeenCalledWith('auth')
    })
  })
})
