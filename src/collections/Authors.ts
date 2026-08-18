import type { CollectionConfig } from 'payload'

import { organizationAdminScoped, organizationScoped } from '../auth/access'

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['image', 'name', 'websiteName', 'createdAt'],
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
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Full name of the author.',
      },
    },
    {
      name: 'image',
      label: 'Photo / Avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Avatar or portrait photo of the author.',
      },
    },
    {
      name: 'website',
      label: 'Website URL',
      type: 'text',
      admin: {
        description: 'Personal or organization website link.',
      },
    },
    {
      name: 'websiteName',
      label: 'Website / Organization Name',
      type: 'text',
      admin: {
        description: 'Name of the website, company, or organization.',
      },
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
}
