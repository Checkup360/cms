import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  fetchMemberRiskContext,
  RiskWeightsUnavailableError,
} from '@/lib/riskWeights'

const backendRequest = (options?: { cookie?: string | null }) => {
  const headers = new Headers()
  if (options?.cookie) headers.set('cookie', options.cookie)

  return { headers } as any
}

const mockBackend = (response: { ok: boolean; status?: number; body?: unknown }) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 500),
    json: async () => response.body,
  } as Response)

describe('fetchMemberRiskContext', () => {
  afterEach(() => vi.restoreAllMocks())

  it('rejects when there is no auth token', async () => {
    await expect(fetchMemberRiskContext(backendRequest())).rejects.toBeInstanceOf(
      RiskWeightsUnavailableError
    )
  })

  it('reports the backend status when the request fails', async () => {
    mockBackend({ ok: false, status: 502 })

    await expect(fetchMemberRiskContext(backendRequest({ cookie: 'auth=t' }))).rejects.toThrow(
      /502/
    )
  })

  it('reports an unreachable backend', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'))

    await expect(fetchMemberRiskContext(backendRequest({ cookie: 'auth=t' }))).rejects.toThrow(
      /ECONNREFUSED/
    )
  })

  it('rejects a response without weights', async () => {
    mockBackend({ ok: true, body: { user_id: 'u-1' } })

    await expect(fetchMemberRiskContext(backendRequest({ cookie: 'auth=t' }))).rejects.toBeInstanceOf(
      RiskWeightsUnavailableError
    )
  })

  it('maps the weights and the readable topic names', async () => {
    mockBackend({
      ok: true,
      body: {
        user_id: 'u-1',
        risk_weights: { diabetes: 0.7, hypertension: 0.3 },
        highest_risk: 'diabetes',
        categories: [
          { key: 'diabetes', label: 'Diabetes', active: true },
          { key: 'hypertension', label: 'High blood pressure', active: true },
        ],
      },
    })

    const result = await fetchMemberRiskContext(backendRequest({ cookie: 'auth=t' }))

    expect(result.weights).toEqual({ diabetes: 0.7, hypertension: 0.3 })
    expect(result.labels).toEqual({
      diabetes: 'Diabetes',
      hypertension: 'High blood pressure',
    })
  })

  it('keeps an empty weight set when the organization has no active risk', async () => {
    mockBackend({
      ok: true,
      body: { user_id: 'u-1', risk_weights: {}, categories: [] },
    })

    const result = await fetchMemberRiskContext(backendRequest({ cookie: 'auth=t' }))

    expect(result.weights).toEqual({})
    expect(result.labels).toEqual({})
  })

  it('sends the session cookie and hits the member risk priorities endpoint', async () => {
    const fetchMock = mockBackend({ ok: true, body: { risk_weights: {} } })

    await fetchMemberRiskContext(backendRequest({ cookie: 'auth=tok' }))

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/members/me/risk-priorities'),
      expect.objectContaining({ headers: { cookie: 'auth=tok' } }),
    )
  })
})
