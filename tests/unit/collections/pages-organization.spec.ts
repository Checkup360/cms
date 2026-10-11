import { describe, it, expect } from 'vitest'

import { Pages } from '@/collections/Pages'

const beforeChange = Pages.hooks?.beforeChange?.[0] as any

describe('Pages collection - organization scoping hook', () => {
  it('assigns the editor organization to the page', async () => {
    const data: any = { title: 'New article' }

    const result = await beforeChange({
      data,
      req: { user: { organizationId: 'org-1' } },
    })

    expect(result.organization).toBe('org-1')
  })

  it('leaves the page untouched when the editor has no organization', async () => {
    const data: any = { title: 'New article' }

    const result = await beforeChange({ data, req: { user: null } })

    expect(result.organization).toBeUndefined()
  })
})
