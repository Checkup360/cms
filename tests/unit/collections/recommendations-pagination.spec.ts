import { beforeEach, describe, it, expect, vi } from 'vitest'

import { Pages } from '@/collections/Pages'
import { fetchMemberRiskContext } from '@/lib/riskWeights'

vi.mock('@/lib/riskWeights', () => ({
  fetchMemberRiskContext: vi.fn(),
}))

const mockRiskWeights = (weights: Record<string, number> | null) => {
  vi.mocked(fetchMemberRiskContext).mockResolvedValue({ weights, labels: {} })
}

describe('Recommended Endpoint - Scoping, Pagination & Error Handling', () => {
  const endpoints = Array.isArray(Pages.endpoints) ? Pages.endpoints : []
  const recommendedEndpoint = endpoints.find(
    (e) => e.path === '/recommended' && e.method === 'get'
  )

  beforeEach(() => {
    vi.clearAllMocks()
    mockRiskWeights(null)
  })

  it('filters by user organization when present on req.user', async () => {
    const mockFind = vi.fn().mockResolvedValue({ docs: [] })
    const req = {
      url: 'http://localhost:3000/api/pages/recommended',
      payload: { find: mockFind },
      user: { organizationId: 'org-abc' },
    }

    await (recommendedEndpoint?.handler as any)(req)

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organization: { equals: 'org-abc' } },
        limit: 0,
      })
    )
  })

  it('ignores an organization query parameter sent by the client', async () => {
    const mockFind = vi.fn().mockResolvedValue({ docs: [] })
    const req = {
      url: 'http://localhost:3000/api/pages/recommended?organization=org-from-query',
      payload: { find: mockFind },
      user: { organizationId: 'org-abc' },
    }

    await (recommendedEndpoint?.handler as any)(req)

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organization: { equals: 'org-abc' } },
      })
    )
  })

  it('answers 401 when the request has no organization', async () => {
    const mockFind = vi.fn().mockResolvedValue({ docs: [] })
    const req = {
      url: 'http://localhost:3000/api/pages/recommended?organization=org-from-query',
      payload: { find: mockFind },
      user: {},
    }

    const response = await (recommendedEndpoint?.handler as any)(req)

    expect(response.status).toBe(401)
    expect(mockFind).not.toHaveBeenCalled()
  })

  it('applies pagination parameters and calculates correct metadata', async () => {
    const docs = Array.from({ length: 25 }, (_, i) => ({
      id: `doc-${i + 1}`,
      title: `Article ${i + 1}`,
      publishedAt: '2026-09-01T12:00:00Z',
    }))

    const mockFind = vi.fn().mockResolvedValue({ docs })
    const req = {
      url: 'http://localhost:3000/api/pages/recommended?page=2&limit=10',
      payload: { find: mockFind },
      user: { organizationId: 'org-abc' },
    }

    const response = await (recommendedEndpoint?.handler as any)(req)
    const data = await response.json()

    expect(data.page).toBe(2)
    expect(data.limit).toBe(10)
    expect(data.totalDocs).toBe(25)
    expect(data.totalPages).toBe(3)
    expect(data.hasPrevPage).toBe(true)
    expect(data.hasNextPage).toBe(true)
    expect(data.prevPage).toBe(1)
    expect(data.nextPage).toBe(3)
    expect(data.docs).toHaveLength(10)
    expect(data.docs[0].id).toBe('doc-11')
    expect(data.docs[9].id).toBe('doc-20')
  })

  it('returns HTTP 500 when payload.find throws an unexpected error', async () => {
    const mockFind = vi.fn().mockRejectedValue(new Error('Database connection failure'))
    const req = {
      url: 'http://localhost:3000/api/pages/recommended',
      payload: { find: mockFind },
      user: { organizationId: 'org-abc' },
    }

    const response = await (recommendedEndpoint?.handler as any)(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to calculate recommended pages')
    expect(data.message).toBe('Database connection failure')
  })
})
