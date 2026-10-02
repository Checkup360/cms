import type { PayloadRequest } from 'payload'

import {
  AUTH_COOKIE_NAME,
  BACKEND_URL,
  getTokenFromHeaders,
  type BackendUser,
} from '../auth/backendAuthStrategy'

export type ContentCategory = {
  key: string
  label: string
  active: boolean
}

/** "General" is not a health risk: it is always available to tag content. */
export const GENERAL_CATEGORY: ContentCategory = {
  key: 'general',
  label: 'General Health',
  active: true,
}

export class ContentCategoriesUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContentCategoriesUnavailableError'
  }
}

/**
 * Categories content can be tagged with for the editor's organization. The
 * backend owns the catalog of health topics and which ones are enabled, so new
 * scores show up here without CMS changes.
 */
export async function fetchContentCategories(req: PayloadRequest): Promise<ContentCategory[]> {
  const organizationId = (req.user as BackendUser | null | undefined)?.organizationId
  const token = getTokenFromHeaders(req.headers)
  if (!organizationId || !token) {
    throw new ContentCategoriesUnavailableError('Missing organization or session')
  }

  const response = await fetch(
    `${BACKEND_URL}/organizations/${organizationId}/content-categories`,
    { headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` }, cache: 'no-store' },
  )
  if (!response.ok) {
    throw new ContentCategoriesUnavailableError(
      `Backend answered ${response.status} for content categories`,
    )
  }

  const categories = (await response.json()) as ContentCategory[]
  return [GENERAL_CATEGORY, ...categories.filter((c) => c.key !== GENERAL_CATEGORY.key)]
}

export function normalizeCategoryKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const keys = value.map((key) => String(key).trim().toLowerCase()).filter(Boolean)
  return [...new Set(keys)]
}
