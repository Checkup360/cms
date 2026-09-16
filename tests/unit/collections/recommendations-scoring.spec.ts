import { describe, it, expect, vi } from 'vitest'
import { Pages } from '@/collections/Pages'

describe('Recommended Endpoint - Recency Decay & Score Sorting', () => {
  const endpoints = Array.isArray(Pages.endpoints) ? Pages.endpoints : []
  const recommendedEndpoint = endpoints.find(
    (e) => e.path === '/recommended' && e.method === 'get'
  )

  it('ranks recent article higher than older article with the same category weight', async () => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()

    const mockFind = vi.fn().mockResolvedValue({
      docs: [
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
      ],
    })

    const req = {
      url: 'http://localhost:3000/api/pages/recommended?weights=%7B%22diabetes%22%3A0.8%7D',
      payload: { find: mockFind },
      user: { organizationId: 'org-1' },
    }

    const response = await (recommendedEndpoint?.handler as any)(req)
    const data = await response.json()

    expect(data.docs).toHaveLength(2)
    expect(data.docs[0].id).toBe('recent-article')
    expect(data.docs[1].id).toBe('old-article')
  })

  it('tie-breaks equal score articles by newer publication timestamp', async () => {
    const date1 = '2026-09-01T10:00:00Z'
    const date2 = '2026-09-10T10:00:00Z'

    const mockFind = vi.fn().mockResolvedValue({
      docs: [
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
    expect(data.docs[0].id).toBe('later-article')
    expect(data.docs[1].id).toBe('earlier-article')
  })
})
