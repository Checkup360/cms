import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Pages } from '@/collections/Pages'
import { fetchMemberRiskContext } from '@/lib/riskWeights'

vi.mock('@/lib/riskWeights', () => ({
  fetchMemberRiskContext: vi.fn(),
}))

const mockRiskWeights = (
  weights: Record<string, number> | null,
  labels: Record<string, string> = {}
) => {
  vi.mocked(fetchMemberRiskContext).mockResolvedValue({ weights, labels })
}

describe('Recommended Endpoint - Server Side Risk Weights', () => {
  const endpoints = Array.isArray(Pages.endpoints) ? Pages.endpoints : []
  const recommendedEndpoint = endpoints.find(
    (e) => e.path === '/recommended' && e.method === 'get'
  )

  beforeEach(() => {
    vi.clearAllMocks()
    mockRiskWeights(null)
  })

  it('endpoint handler is defined', () => {
    expect(recommendedEndpoint).toBeDefined()
    expect(recommendedEndpoint?.handler).toBeTypeOf('function')
  })

  it('resolves the weights from the backend instead of reading them from the request', async () => {
    mockRiskWeights({ diabetes: 0.9, cardiovascular: 0.3 })
    const mockFind = vi.fn().mockResolvedValue({ docs: [] })

    const req = {
      url: 'http://localhost:3000/api/pages/recommended',
      payload: { find: mockFind },
      user: { organizationId: 'org-1' },
    }

    await (recommendedEndpoint?.handler as any)(req)

    expect(fetchMemberRiskContext).toHaveBeenCalledWith(req)
  })

  it('ignores a weights query parameter sent by the client', async () => {
    mockRiskWeights({ diabetes: 0.9, cardiovascular: 0.1 })
    const mockFind = vi.fn().mockResolvedValue({
      docs: [
        {
          id: 'page-diabetes',
          title: 'Managing Diabetes',
          diseaseTypes: ['diabetes'],
          publishedAt: '2026-09-01T00:00:00Z',
        },
        {
          id: 'page-cardio',
          title: 'Heart Health',
          diseaseTypes: ['cardiovascular'],
          publishedAt: '2026-09-01T00:00:00Z',
        },
      ],
    })

    const req = {
      url: 'http://localhost:3000/api/pages/recommended?weights=%7B%22cardiovascular%22%3A1%7D',
      payload: { find: mockFind },
      user: { organizationId: 'org-1' },
    }

    const response = await (recommendedEndpoint?.handler as any)(req)
    const data = await response.json()

    expect(data.docs[0].id).toBe('page-diabetes')
    expect(data.docs[1].id).toBe('page-cardio')
  })

  it('applies the resolved weights to matching disease types', async () => {
    mockRiskWeights({ diabetes: 0.9, cardiovascular: 0.3 })
    const mockFind = vi.fn().mockResolvedValue({
      docs: [
        {
          id: 'page-diabetes',
          title: 'Managing Diabetes',
          diseaseTypes: ['diabetes'],
          publishedAt: '2026-09-01T00:00:00Z',
        },
        {
          id: 'page-cardio',
          title: 'Heart Health',
          diseaseTypes: ['cardiovascular'],
          publishedAt: '2026-09-01T00:00:00Z',
        },
      ],
    })

    const req = {
      url: 'http://localhost:3000/api/pages/recommended',
      payload: { find: mockFind },
      user: { organizationId: 'org-1' },
    }

    const response = await (recommendedEndpoint?.handler as any)(req)
    const data = await response.json()

    expect(data.docs).toHaveLength(2)
    expect(data.docs[0].id).toBe('page-diabetes')
    expect(data.docs[1].id).toBe('page-cardio')
  })

  it('keeps general and uncategorized articles visible and ranks them with the default weight', async () => {
    mockRiskWeights({ diabetes: 0.9 })
    const mockFind = vi.fn().mockResolvedValue({
      docs: [
        {
          id: 'page-diabetes',
          title: 'Managing Diabetes',
          diseaseTypes: ['diabetes'],
          publishedAt: '2026-09-01T00:00:00Z',
        },
        {
          id: 'page-general',
          title: 'General Wellness',
          diseaseTypes: ['general'],
          publishedAt: '2026-09-01T00:00:00Z',
        },
        {
          id: 'page-uncategorized',
          title: 'Uncategorized Article',
          diseaseTypes: [],
          publishedAt: '2026-09-01T00:00:00Z',
        },
      ],
    })

    const req = {
      url: 'http://localhost:3000/api/pages/recommended',
      payload: { find: mockFind },
      user: { organizationId: 'org-1' },
    }

    const response = await (recommendedEndpoint?.handler as any)(req)
    const data = await response.json()

    const ids = data.docs.map((doc: any) => doc.id)
    expect(ids).toContain('page-general')
    expect(ids).toContain('page-uncategorized')
    expect(ids[0]).toBe('page-diabetes')
  })

  it('returns the readable category labels resolved together with the weights', async () => {
    mockRiskWeights({ diabetes: 0.9 }, { diabetes: 'Diabetes' })
    const mockFind = vi.fn().mockResolvedValue({ docs: [] })

    const req = {
      url: 'http://localhost:3000/api/pages/recommended',
      payload: { find: mockFind },
      user: { organizationId: 'org-1' },
    }

    const response = await (recommendedEndpoint?.handler as any)(req)
    const data = await response.json()

    expect(data.categoryLabels).toEqual({ diabetes: 'Diabetes' })
    expect(data.personalized).toBe(true)
  })

  it('serves the content unfiltered when the weights cannot be resolved', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(fetchMemberRiskContext).mockRejectedValue(new Error('backend unavailable'))
    const mockFind = vi.fn().mockResolvedValue({
      docs: [
        {
          id: 'page-diabetes',
          title: 'Managing Diabetes',
          diseaseTypes: ['diabetes'],
          publishedAt: '2026-09-01T00:00:00Z',
        },
        {
          id: 'page-cardio',
          title: 'Heart Health',
          diseaseTypes: ['cardiovascular'],
          publishedAt: '2026-09-01T00:00:00Z',
        },
      ],
    })

    const req = {
      url: 'http://localhost:3000/api/pages/recommended',
      payload: { find: mockFind },
      user: { organizationId: 'org-1' },
    }

    const response = await (recommendedEndpoint?.handler as any)(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.docs).toHaveLength(2)
    expect(data.personalized).toBe(false)
    expect(data.categoryLabels).toEqual({})
  })

  it('answers 401 when the request has no organization', async () => {
    const mockFind = vi.fn().mockResolvedValue({ docs: [] })

    const req = {
      url: 'http://localhost:3000/api/pages/recommended',
      payload: { find: mockFind },
      user: {},
    }

    const response = await (recommendedEndpoint?.handler as any)(req)

    expect(response.status).toBe(401)
    expect(mockFind).not.toHaveBeenCalled()
    expect(fetchMemberRiskContext).not.toHaveBeenCalled()
  })
})
