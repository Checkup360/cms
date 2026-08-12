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
    read: ({ req, id }) => Boolean(req.user && req.user.id === id),
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  hooks: {
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
    { name: 'id', type: 'text' },
    { name: 'email', type: 'text' },
    { name: 'organizationId', type: 'text' },
    { name: 'organizationName', type: 'text' },
    { name: 'roles', type: 'json' },
    { name: 'isSysadmin', type: 'checkbox', defaultValue: false },
  ],
}
