import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { APIError, ValidationError } from 'payload'

import { Pages } from '@/collections/Pages'
import { validateContentCategories } from '@/collections/hooks/validateContentCategories'

const BACKEND_CATEGORIES = [
  { key: 'diabetes', label: 'Diabetes', active: true },
  { key: 'audit_c', label: 'Alcohol Risk Assessment', active: true },
  { key: 'eoss', label: 'Obesity-related Health Impact', active: false },
]

const editorRequest = (roles: string[] = ['content_manager']) =>
  ({
    user: { organizationId: 'org-1', roles },
    headers: new Headers({ cookie: 'auth=token-123' }),
  }) as any

const mockBackend = (response: { ok: boolean; status?: number; body?: unknown }) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 500),
    json: async () => response.body,
  } as Response)

describe('Content categories', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  describe('GET /api/pages/content-categories', () => {
    const endpoint = (Pages.endpoints || []).find(
      (e) => e.path === '/content-categories' && e.method === 'get'
    )

    it('returns General plus the organization categories from the backend', async () => {
      const fetchMock = mockBackend({ ok: true, body: BACKEND_CATEGORIES })

      const response = await (endpoint?.handler as any)(editorRequest())
      const data = await response.json()

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/organizations/org-1/content-categories'),
        expect.objectContaining({ headers: { cookie: 'auth=token-123' } })
      )
      expect(data.categories.map((c: any) => c.key)).toEqual([
        'general',
        'diabetes',
        'audit_c',
        'eoss',
      ])
    })

    it('rejects users without a CMS role', async () => {
      const fetchMock = mockBackend({ ok: true, body: BACKEND_CATEGORIES })

      const response = await (endpoint?.handler as any)(editorRequest(['member']))

      expect(response.status).toBe(403)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('answers 503 when the backend cannot provide categories', async () => {
      mockBackend({ ok: false, status: 503 })

      const response = await (endpoint?.handler as any)(editorRequest())

      expect(response.status).toBe(503)
    })
  })

  describe('validateContentCategories hook', () => {
    const run = (data: any, originalDoc?: any) =>
      (validateContentCategories as any)({
        collection: { slug: 'pages' },
        data,
        originalDoc,
        req: editorRequest(),
      })

    it('accepts newly added categories enabled for the organization', async () => {
      mockBackend({ ok: true, body: BACKEND_CATEGORIES })

      const result = await run({ diseaseTypes: ['Diabetes', 'audit_c', 'general'] })

      expect(result.diseaseTypes).toEqual(['diabetes', 'audit_c', 'general'])
    })

    it('rejects newly added categories that are disabled', async () => {
      mockBackend({ ok: true, body: BACKEND_CATEGORIES })

      await expect(run({ diseaseTypes: ['diabetes', 'eoss'] })).rejects.toBeInstanceOf(
        ValidationError
      )
    })

    it('keeps categories the article already had even if now disabled', async () => {
      const fetchMock = mockBackend({ ok: true, body: BACKEND_CATEGORIES })

      const result = await run({ diseaseTypes: ['eoss'] }, { diseaseTypes: ['eoss'] })

      expect(result.diseaseTypes).toEqual(['eoss'])
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('fails clearly when categories cannot be verified', async () => {
      mockBackend({ ok: false, status: 500 })

      await expect(run({ diseaseTypes: ['diabetes'] })).rejects.toBeInstanceOf(APIError)
    })

    it('does nothing when the update does not touch categories', async () => {
      const fetchMock = mockBackend({ ok: true, body: BACKEND_CATEGORIES })

      const result = await run({ title: 'New title' })

      expect(result).toEqual({ title: 'New title' })
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })
})
