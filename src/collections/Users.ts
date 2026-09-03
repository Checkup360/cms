import type { CollectionConfig } from 'payload'
import { cookies } from 'next/headers'

import {
  BACKEND_URL,
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
    read: ({ req, id }: { req: any; id?: any }) => Boolean(req.user && String(req.user.id) === String(id)),
    create: () => false,
    update: ({ req, id }: { req: any; id?: any }) => Boolean(req.user && String(req.user.id) === String(id)),
    delete: () => false,
  },
  endpoints: [
    {
      path: '/logout',
      method: 'post',
      handler: async (req: any) => {
        let backendSetCookie: string | null = null

        const cookieHeader = req.headers.get('cookie')
        if (cookieHeader) {
          try {
            const backendRes = await fetch(`${BACKEND_URL}/auth/logout`, {
              method: 'POST',
              headers: { cookie: cookieHeader },
              cache: 'no-store',
            })
            backendSetCookie = backendRes.headers.get('set-cookie')
          } catch (err) {
            console.warn('[cms-auth] failed to call backend logout:', err)
          }
        }

        try {
          const cookieStore = await cookies()
          cookieStore.delete('auth')
        } catch (err) {
          console.warn('[cms-auth] failed to delete cookie via cookies():', err)
        }

        const response = Response.json({ success: true })

        if (backendSetCookie) {
          response.headers.append('Set-Cookie', backendSetCookie)
        }

        response.headers.append(
          'Set-Cookie',
          'auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax; Secure'
        )
        response.headers.append(
          'Set-Cookie',
          'auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax'
        )

        return response
      },
    },
  ],
  hooks: {
    afterRead: [
      ({ doc, req }: { doc: any; req: any }) => {
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
      ({ args }: { args: any }) => {
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
    {
      name: 'createdAt',
      type: 'date',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'updatedAt',
      type: 'date',
      admin: {
        hidden: true,
      },
    },
  ],
}
