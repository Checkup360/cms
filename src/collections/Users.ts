import type { CollectionConfig } from 'payload'

import {
  backendAuthStrategy,
  getBackendTokenExpiration,
} from '../auth/backendAuthStrategy'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    disableLocalStrategy: true,
    strategies: [backendAuthStrategy],
  },
  access: {
    read: ({ req, id }) => Boolean(req.user && String(req.user.id) === String(id)),
    create: () => false,
    update: ({ req, id }) => Boolean(req.user && String(req.user.id) === String(id)),
    delete: () => false,
  },
  endpoints: [
    {
      path: '/logout',
      method: 'post',
      handler: async () => {
        const response = Response.json({ success: true })
        response.headers.set(
          'Set-Cookie',
          'auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
        )
        return response
      },
    },
  ],
  hooks: {
    afterRead: [
      ({ doc, req }) => {
        if (req.user && String(req.user.id) === String(doc.id)) {
          const user = req.user as any
          doc.organizationName = user.organizationName
          doc.organizationId = user.organizationId
          doc.roles = user.roles
          doc.isSysadmin = user.isSysadmin
        }
        return doc
      },
    ],
    me: [
      ({ args }) => {
        if (args.req.user) {
          return {
            exp: getBackendTokenExpiration(args.req.headers),
            user: args.req.user,
          }
        }
        return undefined
      },
    ],
  },
  fields: [
    {
      name: 'id',
      type: 'text',
      admin: {
        hidden: true,
        disableListColumn: true,
        disableListFilter: true,
      },
    },
    {
      name: 'email',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'organizationId',
      type: 'text',
      admin: {
        hidden: true,
        disableListColumn: true,
        disableListFilter: true,
      },
    },
    {
      name: 'organizationName',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'roles',
      type: 'json',
      admin: {
        hidden: true,
        disableListColumn: true,
        disableListFilter: true,
      },
    },
    {
      name: 'isSysadmin',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        hidden: true,
        disableListColumn: true,
        disableListFilter: true,
      },
    },
  ],
}
