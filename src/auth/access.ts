import type { Access } from 'payload'
import type { BackendUser } from './backendAuthStrategy'

export const CMS_ROLES = ['admin', 'content_manager']

function organizationIdOf(req: {
  user?: unknown
}): string | null | undefined {
  const user = req.user as BackendUser | null | undefined
  return user?.organizationId
}

export const organizationScoped: Access = ({ req }) => {
  const organizationId = organizationIdOf(req)
  if (!organizationId) return false
  return { organization: { equals: organizationId } }
}

/**
 * Grants write access to users with the `admin` or `content_manager` role
 * within their organisation. Used for CMS collections (Pages, Authors, Media).
 */
export const organizationCmsScoped: Access = ({ req }) => {
  const organizationId = organizationIdOf(req)
  const user = req.user as BackendUser | null | undefined
  if (!organizationId) return false
  if (!user?.roles?.some((r) => CMS_ROLES.includes(r))) return false
  return { organization: { equals: organizationId } }
}
