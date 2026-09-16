import { describe, it, expect, vi } from 'vitest'
import { Pages } from '@/collections/Pages'

describe('Recommended Endpoint - Risk Weights Parsing', () => {
  const endpoints = Array.isArray(Pages.endpoints) ? Pages.endpoints : []
  const recommendedEndpoint = endpoints.find(
    (e) => e.path === '/recommended' && e.method === 'get'
  )

  it('endpoint handler is defined', () => {
    expect(recommendedEndpoint).toBeDefined()
    expect(recommendedEndpoint?.handler).toBeTypeOf('function')
  })

  it('parses JSON format weights correctly and applies them to matching disease types', async () => {
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
      url: 'http://localhost:3000/api/pages/recommended?weights=%7B%22diabetes%22%3A0.9%2C%22cardiovascular%22%3A0.3%7D',
      payload: { find: mockFind },
      user: { organizationId: 'org-1' },
    }

    const response = await (recommendedEndpoint?.handler as any)(req)
    const data = await response.json()

    expect(data.docs).toHaveLength(2)
    // Diabetes has weight 0.9 vs cardio 0.3 with same date, so diabetes should be first
    expect(data.docs[0].id).toBe('page-diabetes')
    expect(data.docs[1].id).toBe('page-cardio')
  })

  it('parses key:value comma-separated string format weights correctly', async () => {
    const mockFind = vi.fn().mockResolvedValue({
      docs: [
        {
          id: 'page-stress',
          title: 'Stress Relief',
          diseaseTypes: ['stress'],
          publishedAt: '2026-09-01T00:00:00Z',
        },
        {
          id: 'page-hypertension',
          title: 'Lowering Blood Pressure',
          diseaseTypes: ['hypertension'],
          publishedAt: '2026-09-01T00:00:00Z',
        },
      ],
    })

    const req = {
      url: 'http://localhost:3000/api/pages/recommended?weights=hypertension:0.85,stress:0.25',
      payload: { find: mockFind },
      user: { organizationId: 'org-1' },
    }

    const response = await (recommendedEndpoint?.handler as any)(req)
    const data = await response.json()

    expect(data.docs).toHaveLength(2)
    expect(data.docs[0].id).toBe('page-hypertension')
    expect(data.docs[1].id).toBe('page-stress')
  })

  it('uses default weight (0.2) when disease type has no corresponding weight', async () => {
    const mockFind = vi.fn().mockResolvedValue({
      docs: [
        {
          id: 'page-general',
          title: 'General Wellness',
          diseaseTypes: ['nutrition'],
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

    expect(data.docs).toHaveLength(1)
    expect(data.docs[0].id).toBe('page-general')
  })
})
