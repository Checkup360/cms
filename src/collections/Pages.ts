import type { CollectionConfig } from 'payload'

import { organizationCmsScoped, organizationScoped } from '../auth/access'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['coverImage','title', 'diseaseTypes', 'publishedAt', 'createdAt'],
  },
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
      admin: {
        components: {
          Cell: './components/TitleCell',
        },
      },
    },
    {
      name: 'summary',
      label: 'Summary / Subtitle',
      type: 'textarea',
      admin: {
        description: 'Brief summary or excerpt displayed on article cards and under the title.',
      },
    },
    {
      name: 'author',
      label: 'Author',
      type: 'relationship',
      relationTo: 'authors',
      admin: {
        description: 'Author of the article/page.',
      },
    },
    {
      name: 'publishedAt',
      label: 'Publication Date',
      type: 'date',
      admin: {
        description: 'Visible publication date of the article. If empty, creation date is used.',
      },
    },
    {
      name: 'readTime',
      label: 'Read Time (minutes)',
      type: 'number',
      min: 1,
      admin: {
        description: 'Custom estimated reading time in minutes (optional). If empty, it will be calculated automatically from content.',
      },
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
