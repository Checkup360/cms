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
    beforeValidate: [
      ({ data, req }) => {
        if (data && (!data.alt || typeof data.alt !== 'string' || data.alt.trim() === '')) {
          const rawName = req.file?.name || data.filename || 'Imagen'
          data.alt = rawName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim() || 'Imagen'
        }
        return data
      },
    ],
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
      admin: {
        description:
          'Descripción breve de la imagen para accesibilidad. Si se deja en blanco, se usará el nombre del archivo.',
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
  upload: true,
}
