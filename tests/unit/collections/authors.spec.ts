import { describe, it, expect } from 'vitest'

import { Authors } from '@/collections/Authors'

const beforeChange = Authors.hooks?.beforeChange?.[0] as any

describe('Authors collection', () => {
  describe('beforeChange - organization scoping', () => {
    it('assigns the editor organization to the author document', async () => {
      const data: any = { name: 'Jane Doe' }

      const result = await beforeChange({
        data,
        req: { user: { organizationId: 'org-1' } },
      })

      expect(result.organization).toBe('org-1')
    })

    it('always scopes the document to the editor organization', async () => {
      const data: any = { name: 'Jane Doe', organization: 'org-existing' }

      const result = await beforeChange({
        data,
        req: { user: { organizationId: 'org-1' } },
      })

      expect(result.organization).toBe('org-1')
    })

    it('leaves the document untouched when the user has no organization', async () => {
      const data: any = { name: 'Jane Doe' }

      const result = await beforeChange({ data, req: { user: null } })

      expect(result.organization).toBeUndefined()
    })
  })
})
