import { beforeEach, describe, it, expect, vi } from 'vitest'

import { Pages } from '@/collections/Pages'
import { fetchMemberRiskContext } from '@/lib/riskWeights'

vi.mock('@/lib/riskWeights', () => ({
  fetchMemberRiskContext: vi.fn(),
}))

const mockRiskWeights = (weights: Record<string, number> | null) => {
  vi.mocked(fetchMemberRiskContext).mockResolvedValue({ weights, labels: {} })
}

describe('Recommended Endpoint - Category & Search Filters', () => {
  const endpoints = Array.isArray(Pages.endpoints) ? Pages.endpoints : []
  const recommendedEndpoint = endpoints.find(
    (e) => e.path === '/recommended' && e.method === 'get'
  )

  const callEndpoint = async (query: string, find: ReturnType<typeof vi.fn>) => {
    const req = {
      url: `http://localhost:3000/api/pages/recommended?${query}`,
      payload: { find },
      user: { organizationId: 'org-1' },
    }
    const response = await (recommendedEndpoint?.handler as any)(req)
    return response.json()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRiskWeights(null)
  })

  it('filters articles by category in the database query', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] })

    await callEndpoint('category=Sleep_Apnea', find)

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        depth: 2,
        where: {
          and: [
            { organization: { equals: 'org-1' } },
            { diseaseTypes: { in: ['sleep_apnea'] } },
          ],
        },
      })
    )
  })

  it('searches title and summary in the database query', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] })

    await callEndpoint('search=%20sleep%20', find)

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        depth: 2,
        where: {
          and: [
            { organization: { equals: 'org-1' } },
            { or: [{ title: { like: 'sleep' } }, { summary: { like: 'sleep' } }] },
          ],
        },
      })
    )
  })

  it('returns every organization category regardless of the active filters', async () => {
    const find = vi.fn().mockImplementation(async (args: any) =>
      args.select
        ? {
            docs: [
              { diseaseTypes: ['sleep_apnea', 'diabetes'] },
              { diseaseTypes: ['Diabetes'] },
              { diseaseTypes: [] },
            ],
          }
        : { docs: [] }
    )

    const data = await callEndpoint('category=depression', find)

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organization: { equals: 'org-1' } },
        select: { diseaseTypes: true },
      })
    )
    expect(data.categories).toEqual(['diabetes', 'sleep_apnea'])
  })

  it('paginates only the articles that match the filters', async () => {
    const docs = Array.from({ length: 12 }, (_, index) => ({
      id: `doc-${index}`,
      diseaseTypes: ['diabetes'],
      publishedAt: '2026-09-01T12:00:00Z',
    }))
    const find = vi.fn().mockImplementation(async (args: any) =>
      args.select ? { docs: [] } : { docs }
    )

    const data = await callEndpoint('category=diabetes&limit=10&page=2', find)

    expect(data.totalDocs).toBe(12)
    expect(data.totalPages).toBe(2)
    expect(data.docs).toHaveLength(2)
  })
})
