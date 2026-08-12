import Link from 'next/link'

import { buildLoginUrl } from '@/auth/frontend'

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const returnUrl = next || '/'
  const loginUrl = buildLoginUrl(returnUrl)

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontSize: '80px',
          fontWeight: 600,
          lineHeight: 1,
          margin: 0,
          opacity: 0.4,
        }}
      >
        403
      </p>
      <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>
        Access denied
      </h1>
      <p
        style={{
          maxWidth: '480px',
          margin: 0,
          fontSize: '15px',
          lineHeight: '24px',
          opacity: 0.75,
        }}
      >
        You don&apos;t have permission to access this area. Only organization
        admins can use the CMS admin panel.
      </p>
      <a
        href={loginUrl}
        style={{
          marginTop: '16px',
          padding: '8px 16px',
          borderRadius: '4px',
          border: '1px solid rgba(255,255,255,0.4)',
          textDecoration: 'none',
        }}
      >
        Sign in with different account
      </a>
      <Link
        href={returnUrl}
        style={{
          textDecoration: 'none',
          fontSize: '15px',
          opacity: 0.6,
        }}
      >
        Go home
      </Link>
    </div>
  )
}
