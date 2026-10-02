import { describe, it, expect, vi } from 'vitest'
import { Pages } from '@/collections/Pages'

describe('Recommended Endpoint - Organization Active Categories', () => {
  const endpoints = Array.isArray(Pages.endpoints) ? Pages.endpoints : []
  const recommendedEndpoint = endpoints.find(
    (e) => e.path === '/recommended' && e.method === 'get'
  )

  const publishedAt = '2026-09-01T12:00:00Z'
  const docs = [
    { id: 'active-only', diseaseTypes: ['diabetes'], publishedAt },
    { id: 'mixed', diseaseTypes: ['eoss', 'diabetes'], publishedAt },
    { id: 'disabled-only', diseaseTypes: ['eoss', 'cardiovascular'], publishedAt },
    { id: 'general', diseaseTypes: ['general'], publishedAt },
    { id: 'uncategorized', diseaseTypes: [], publishedAt },
  ]

  const callEndpoint = async (query: string) => {
    const find = vi.fn().mockResolvedValue({ docs })
    const req = {
      url: `http://localhost:3000/api/pages/recommended?${query}`,
      payload: { find },
      user: { organizationId: 'org-1' },
    }
    const response = await (recommendedEndpoint?.handler as any)(req)
    return response.json()
  }

  const activeWeights = encodeURIComponent(JSON.stringify({ diabetes: 0.7, depression: 0.3 }))

  it('hides articles whose categories are all disabled for the organization', async () => {
    const data = await callEndpoint(`weights=${activeWeights}`)
    const ids = data.docs.map((doc: any) => doc.id)

    expect(ids).not.toContain('disabled-only')
    expect(ids).toEqual(
      expect.arrayContaining(['active-only', 'mixed', 'general', 'uncategorized'])
    )
    expect(data.totalDocs).toBe(4)
  })

  it('keeps only the active categories of mixed articles', async () => {
    const data = await callEndpoint(`weights=${activeWeights}`)
    const mixed = data.docs.find((doc: any) => doc.id === 'mixed')

    expect(mixed.diseaseTypes).toEqual(['diabetes'])
  })

  it('lists only active categories and general as filters', async () => {
    const data = await callEndpoint(`weights=${activeWeights}`)

    expect(data.categories).toEqual(['diabetes', 'general'])
  })

  it('only shows general and uncategorized articles when no risk is active', async () => {
    const data = await callEndpoint(`weights=${encodeURIComponent('{}')}`)
    const ids = data.docs.map((doc: any) => doc.id)

    expect(ids.sort()).toEqual(['general', 'uncategorized'])
  })

  it('does not filter categories when the caller sends no weights', async () => {
    const data = await callEndpoint('')

    expect(data.totalDocs).toBe(docs.length)
    expect(data.categories).toEqual(['cardiovascular', 'diabetes', 'eoss', 'general'])
  })
})
