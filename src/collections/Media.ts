import type { CollectionConfig } from 'payload'

import { organizationCmsScoped, organizationScoped } from '../auth/access'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: organizationCmsScoped,
    read: organizationScoped,
    update: organizationCmsScoped,
    delete: organizationCmsScoped,
  },
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        const user = req.user as { organizationId?: string | null } | null
        if (user?.organizationId) {
          data.organization = user.organizationId
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'organization',
      type: 'text',
      index: true,
      admin: {
        hidden: true,
        disableListColumn: true,
        disableListFilter: true,
      },
    },
  ],
  upload: true,
}
