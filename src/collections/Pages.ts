import type { CollectionConfig } from 'payload'

import { organizationAdminScoped, organizationScoped } from '../auth/access'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'organization', 'updatedAt'],
  },
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
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
    },
    {
      name: 'organization',
      type: 'text',
      index: true,
      admin: {
        hidden: true,
      },
    },
  ],
}
