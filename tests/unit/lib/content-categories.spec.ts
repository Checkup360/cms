import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  ContentCategoriesUnavailableError,
  fetchContentCategories,
  GENERAL_CATEGORY,
  normalizeCategoryKeys,
} from '@/lib/contentCategories'

const backendRequest = (options?: {
  organizationId?: string | null
  cookie?: string | null
}) => {
  const headers = new Headers()
  if (options?.cookie) headers.set('cookie', options.cookie)

  const organizationId =
    options && 'organizationId' in options ? options.organizationId : 'org-1'

  return {
    user: { organizationId },
    headers,
  } as any
}

const mockBackend = (response: { ok: boolean; status?: number; body?: unknown }) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 500),
    json: async () => response.body,
  } as Response)

describe('fetchContentCategories', () => {
  afterEach(() => vi.restoreAllMocks())

  it('rejects when the session has no organization', async () => {
    await expect(
      fetchContentCategories(backendRequest({ organizationId: null, cookie: 'auth=t' })),
    ).rejects.toBeInstanceOf(ContentCategoriesUnavailableError)
  })

  it('rejects when there is no auth token', async () => {
    await expect(
      fetchContentCategories(backendRequest({ organizationId: 'org-1' })),
    ).rejects.toBeInstanceOf(ContentCategoriesUnavailableError)
  })

  it('reports the backend status when the request fails', async () => {
    mockBackend({ ok: false, status: 502 })

    await expect(
      fetchContentCategories(backendRequest({ cookie: 'auth=t' })),
    ).rejects.toThrow(/502/)
  })

  it('puts General first and drops duplicates coming from the backend', async () => {
    mockBackend({
      ok: true,
      body: [
        { key: 'diabetes', label: 'Diabetes', active: true },
        { key: 'general', label: 'Duplicate general', active: true },
      ],
    })

    const result = await fetchContentCategories(backendRequest({ cookie: 'auth=t' }))

    expect(result[0]).toEqual(GENERAL_CATEGORY)
    expect(result.map((c) => c.key)).toEqual(['general', 'diabetes'])
  })

  it('sends the session cookie and hits the organization endpoint', async () => {
    const fetchMock = mockBackend({ ok: true, body: [] })

    await fetchContentCategories(backendRequest({ organizationId: 'org-9', cookie: 'auth=tok' }))

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/organizations/org-9/content-categories'),
      expect.objectContaining({ headers: { cookie: 'auth=tok' } }),
    )
  })
})

describe('normalizeCategoryKeys', () => {
  it('returns an empty list for non-array input', () => {
    expect(normalizeCategoryKeys(undefined)).toEqual([])
    expect(normalizeCategoryKeys('diabetes')).toEqual([])
    expect(normalizeCategoryKeys({ 0: 'diabetes' })).toEqual([])
  })

  it('trims, lowercases, drops blanks and dedupes', () => {
    expect(normalizeCategoryKeys([' Diabetes ', 'diabetes', '', '   ', 'Audit_C'])).toEqual([
      'diabetes',
      'audit_c',
    ])
  })
})
