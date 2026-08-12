import type { CollectionConfig } from 'payload'

import { organizationAdminScoped, organizationScoped } from '../auth/access'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: organizationAdminScoped,
    read: organizationScoped,
    update: organizationAdminScoped,
    delete: organizationAdminScoped,
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
