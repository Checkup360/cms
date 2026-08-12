import type { Access } from 'payload'
import type { BackendUser } from './backendAuthStrategy'

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

export const organizationAdminScoped: Access = ({ req }) => {
  const organizationId = organizationIdOf(req)
  const user = req.user as BackendUser | null | undefined
  if (!organizationId || !user?.roles?.includes('admin')) return false
  return { organization: { equals: organizationId } }
}
