import { beforeEach, describe, it, expect, vi } from 'vitest'

import { Pages } from '@/collections/Pages'
import { fetchMemberRiskContext } from '@/lib/riskWeights'

vi.mock('@/lib/riskWeights', () => ({
  fetchMemberRiskContext: vi.fn(),
}))

const mockRiskWeights = (weights: Record<string, number> | null) => {
  vi.mocked(fetchMemberRiskContext).mockResolvedValue({ weights, labels: {} })
}

describe('Recommended Endpoint - Recency Decay & Score Sorting', () => {
  const endpoints = Array.isArray(Pages.endpoints) ? Pages.endpoints : []
  const recommendedEndpoint = endpoints.find(
    (e) => e.path === '/recommended' && e.method === 'get'
  )

  const callEndpoint = async (weights: Record<string, number> | null, docs: any[]) => {
    mockRiskWeights(weights)
    const req = {
      url: 'http://localhost:3000/api/pages/recommended',
      payload: { find: vi.fn().mockResolvedValue({ docs }) },
      user: { organizationId: 'org-1' },
    }
    const response = await (recommendedEndpoint?.handler as any)(req)
    return response.json()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRiskWeights(null)
  })

  it('ranks recent article higher than older article with the same category weight', async () => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()

    const data = await callEndpoint({ diabetes: 0.8 }, [
      {
        id: 'old-article',
        title: 'Old Article',
        diseaseTypes: ['diabetes'],
        publishedAt: sixtyDaysAgo,
      },
      {
        id: 'recent-article',
        title: 'Recent Article',
        diseaseTypes: ['diabetes'],
        publishedAt: yesterday,
      },
    ])

    expect(data.docs).toHaveLength(2)
    expect(data.docs[0].id).toBe('recent-article')
    expect(data.docs[1].id).toBe('old-article')
  })

  it('tie-breaks equal score articles by newer publication timestamp', async () => {
    const date1 = '2026-09-01T10:00:00Z'
    const date2 = '2026-09-10T10:00:00Z'

    const data = await callEndpoint({ nutrition: 0.5 }, [
      {
        id: 'earlier-article',
        title: 'Earlier Article',
        diseaseTypes: ['nutrition'],
        publishedAt: date1,
      },
      {
        id: 'later-article',
        title: 'Later Article',
        diseaseTypes: ['nutrition'],
        publishedAt: date2,
      },
    ])

    expect(data.docs[0].id).toBe('later-article')
    expect(data.docs[1].id).toBe('earlier-article')
  })

  it('treats weights as clinical severity: the least healthy category ranks first', async () => {
    // Weights come from the backend as severity = (100 - health_index) / 100,
    // so a higher weight means a less healthy category.
    const publishedAt = '2026-09-01T10:00:00Z'

    const data = await callEndpoint({ diabetes: 0.9, sleep_apnea: 0.1 }, [
      { id: 'healthy-area', title: 'Sleep', diseaseTypes: ['sleep_apnea'], publishedAt },
      { id: 'unhealthy-area', title: 'Diabetes', diseaseTypes: ['diabetes'], publishedAt },
    ])

    expect(data.docs[0].id).toBe('unhealthy-area')
    expect(data.docs[1].id).toBe('healthy-area')
  })
})
