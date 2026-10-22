import { describe, it, expect } from 'vitest'
import type { PayloadRequest } from 'payload'
import {
  organizationScoped,
  organizationCmsScoped,
} from '@/auth/access'
import type { BackendUser } from '@/auth/backendAuthStrategy'

function createMockRequest(user?: Partial<BackendUser> | null): PayloadRequest {
  return {
    user: user as BackendUser,
  } as unknown as PayloadRequest
}

describe('Access Control Rules', () => {
  const orgId = 'org-abc-123'

  describe('organizationScoped', () => {
    it('returns equality query when user belongs to an organization', () => {
      const req = createMockRequest({
        id: 'user-1',
        email: 'user@example.com',
        organizationId: orgId,
        roles: ['member'],
      })

      const result = organizationScoped({ req } as any)
      expect(result).toEqual({ organization: { equals: orgId } })
    })

    it('returns false when user has no organizationId', () => {
      const req = createMockRequest({
        id: 'user-2',
        email: 'sysadmin@example.com',
        organizationId: null,
        roles: [],
      })

      const result = organizationScoped({ req } as any)
      expect(result).toBe(false)
    })

    it('returns false when request has no user', () => {
      const req = createMockRequest(null)

      const result = organizationScoped({ req } as any)
      expect(result).toBe(false)
    })
  })

  describe('organizationCmsScoped', () => {
    it('grants access when user has admin role', () => {
      const req = createMockRequest({
        id: 'admin-1',
        email: 'admin@example.com',
        organizationId: orgId,
        roles: ['admin'],
      })

      const result = organizationCmsScoped({ req } as any)
      expect(result).toEqual({ organization: { equals: orgId } })
    })

    it('grants access when user has content_manager role', () => {
      const req = createMockRequest({
        id: 'cm-1',
        email: 'cm@example.com',
        organizationId: orgId,
        roles: ['content_manager'],
      })

      const result = organizationCmsScoped({ req } as any)
      expect(result).toEqual({ organization: { equals: orgId } })
    })

    it('grants access when user has combined member and content_manager roles', () => {
      const req = createMockRequest({
        id: 'cm-member',
        email: 'cm-member@example.com',
        organizationId: orgId,
        roles: ['member', 'content_manager'],
      })

      const result = organizationCmsScoped({ req } as any)
      expect(result).toEqual({ organization: { equals: orgId } })
    })

    it('denies access when user only has member role', () => {
      const req = createMockRequest({
        id: 'member-1',
        email: 'member@example.com',
        organizationId: orgId,
        roles: ['member'],
      })

      const result = organizationCmsScoped({ req } as any)
      expect(result).toBe(false)
    })

    it('denies access when user has empty roles list', () => {
      const req = createMockRequest({
        id: 'norole-1',
        email: 'norole@example.com',
        organizationId: orgId,
        roles: [],
      })

      const result = organizationCmsScoped({ req } as any)
      expect(result).toBe(false)
    })

    it('denies access when user has content_manager role but no organizationId', () => {
      const req = createMockRequest({
        id: 'cm-no-org',
        email: 'cm@example.com',
        organizationId: null,
        roles: ['content_manager'],
      })

      const result = organizationCmsScoped({ req } as any)
      expect(result).toBe(false)
    })

    it('denies access when request has no user', () => {
      const req = createMockRequest(null)

      const result = organizationCmsScoped({ req } as any)
      expect(result).toBe(false)
    })
  })
})
