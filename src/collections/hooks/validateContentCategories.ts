import { APIError, ValidationError, type CollectionBeforeChangeHook } from 'payload'

import { fetchContentCategories, normalizeCategoryKeys } from '../../lib/contentCategories'

const FIELD = 'diseaseTypes'

/**
 * Only categories enabled for the organization can be added to an article.
 * Categories the article already had are kept even if the organization later
 * disabled them, so re-enabling a risk restores its content unchanged.
 */
export const validateContentCategories: CollectionBeforeChangeHook = async ({
  collection,
  data,
  originalDoc,
  req,
}) => {
  if (!(FIELD in data)) return data

  const categories = normalizeCategoryKeys(data[FIELD])
  const previous = new Set(normalizeCategoryKeys(originalDoc?.[FIELD]))
  const added = categories.filter((key) => !previous.has(key))
  if (added.length === 0) return { ...data, [FIELD]: categories }

  let allowed: Set<string>
  try {
    const available = await fetchContentCategories(req)
    allowed = new Set(available.filter((c) => c.active).map((c) => c.key))
  } catch {
    throw new APIError('Content categories could not be verified. Try again later.', 503)
  }

  const notAllowed = added.filter((key) => !allowed.has(key))
  if (notAllowed.length > 0) {
    throw new ValidationError({
      collection: collection.slug,
      errors: [
        {
          path: FIELD,
          message: `Not enabled for your organization: ${notAllowed.join(', ')}`,
        },
      ],
      req,
    })
  }
  return { ...data, [FIELD]: categories }
}
