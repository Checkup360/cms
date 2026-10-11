import { describe, it, expect } from 'vitest'

import { Media } from '@/collections/Media'

const beforeValidate = Media.hooks?.beforeValidate?.[0] as any
const beforeChange = Media.hooks?.beforeChange?.[0] as any

const runBeforeValidate = (data: any, req: any = { user: null }) =>
  beforeValidate({ data, req })

describe('Media collection', () => {
  describe('beforeValidate - automatic alt text', () => {
    it('derives alt text from the uploaded file name', async () => {
      const result = await runBeforeValidate(
        {},
        { user: null, file: { name: 'my-photo_file.png' } },
      )

      expect(result.alt).toBe('my photo file')
    })

    it('falls back to the stored filename when there is no uploaded file', async () => {
      const result = await runBeforeValidate({ filename: 'header-image.jpeg' })

      expect(result.alt).toBe('header image')
    })

    it('strips the file extension', async () => {
      const result = await runBeforeValidate({ filename: 'Blood.Pressure.PNG' })

      expect(result.alt).toBe('Blood.Pressure')
    })

    it('keeps an alt text that was provided', async () => {
      const result = await runBeforeValidate({ alt: 'Custom alt', filename: 'x.png' })

      expect(result.alt).toBe('Custom alt')
    })

    it('replaces a blank alt text', async () => {
      const result = await runBeforeValidate({ alt: '   ', filename: 'blank.png' })

      expect(result.alt).toBe('blank')
    })

    it('uses a generic fallback when there is no name at all', async () => {
      const result = await runBeforeValidate({})

      expect(result.alt).toBe('Imagen')
    })
  })

  describe('beforeChange - organization scoping', () => {
    it('assigns the editor organization to the media document', async () => {
      const data: any = {}

      const result = await beforeChange({
        data,
        req: { user: { organizationId: 'org-1' } },
      })

      expect(result.organization).toBe('org-1')
    })

    it('leaves the document untouched when the user has no organization', async () => {
      const data: any = { alt: 'x' }

      const result = await beforeChange({ data, req: { user: null } })

      expect(result.organization).toBeUndefined()
    })
  })
})
