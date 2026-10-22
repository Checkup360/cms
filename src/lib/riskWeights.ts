import type { PayloadRequest } from 'payload'

import {
  AUTH_COOKIE_NAME,
  BACKEND_URL,
  getTokenFromHeaders,
} from '../auth/backendAuthStrategy'

export type MemberRiskContext = {
  weights: Record<string, number> | null
  labels: Record<string, string>
}

interface RiskPrioritiesResponse {
  risk_weights?: Record<string, number> | null
  categories?: Array<{ key: string; label: string }> | null
}

export class RiskWeightsUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RiskWeightsUnavailableError'
  }
}

export async function fetchMemberRiskContext(
  req: PayloadRequest
): Promise<MemberRiskContext> {
  const token = getTokenFromHeaders(req.headers)
  if (!token) {
    throw new RiskWeightsUnavailableError('Missing session')
  }

  let response: Response
  try {
    response = await fetch(`${BACKEND_URL}/members/me/risk-priorities`, {
      headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
      cache: 'no-store',
    })
  } catch (error) {
    throw new RiskWeightsUnavailableError(
      `Backend unreachable for risk priorities: ${(error as Error)?.message}`
    )
  }

  if (!response.ok) {
    throw new RiskWeightsUnavailableError(
      `Backend answered ${response.status} for risk priorities`
    )
  }

  let body: RiskPrioritiesResponse
  try {
    body = (await response.json()) as RiskPrioritiesResponse
  } catch {
    throw new RiskWeightsUnavailableError('Malformed risk priorities response')
  }

  const weights = body?.risk_weights
  if (!weights || typeof weights !== 'object' || Array.isArray(weights)) {
    throw new RiskWeightsUnavailableError('Risk priorities response has no weights')
  }

  const labels: Record<string, string> = {}
  for (const category of body?.categories ?? []) {
    if (category?.key && category?.label) {
      labels[category.key] = category.label
    }
  }

  return { weights, labels }
}
