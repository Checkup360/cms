import type { CollectionConfig } from 'payload'

import { organizationAdminScoped, organizationScoped } from '../auth/access'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['coverImage', 'title', 'diseaseTypes', 'createdAt', 'updatedAt'],
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
      name: 'coverImage',
      label: 'Cover Image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Cover or featured image for the article/page.',
      },
    },
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
      name: 'diseaseTypes',
      label: 'Disease Types',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Cardiovascular', value: 'cardiovascular' },
        { label: 'Respiratory', value: 'respiratory' },
        { label: 'Diabetes', value: 'diabetes' },
        { label: 'Oncology', value: 'oncology' },
        { label: 'Neurology', value: 'neurology' },
      ],
      admin: {
        description: 'Predefined disease categories to help organize and highlight content.',
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
