import { describe, it, expect } from 'vitest'
import type { NextRequest } from 'next/server'
import { buildLoginUrl, getPublicRequestUrl } from '@/auth/frontend'

describe('Frontend Auth Helpers', () => {
  describe('buildLoginUrl', () => {
    it('constructs login URL with next parameter pointing to returnUrl', () => {
      const returnUrl = 'http://localhost:3000/admin/collections/pages'
      const loginUrl = buildLoginUrl(returnUrl)

      const parsed = new URL(loginUrl)
      expect(parsed.pathname).toBe('/login')
      expect(parsed.searchParams.get('next')).toBe(returnUrl)
    })

    it('handles root or empty return URLs', () => {
      const returnUrl = 'http://localhost:3000/'
      const loginUrl = buildLoginUrl(returnUrl)

      const parsed = new URL(loginUrl)
      expect(parsed.searchParams.get('next')).toBe(returnUrl)
    })
  })

  describe('getPublicRequestUrl', () => {
    function createMockNextRequest(options: {
      url: string
      headers?: Record<string, string>
    }): NextRequest {
      const nextUrl = new URL(options.url)
      const headersMap = new Headers(options.headers || {})

      return {
        nextUrl: {
          pathname: nextUrl.pathname,
          search: nextUrl.search,
          host: nextUrl.host,
          protocol: nextUrl.protocol,
        },
        headers: headersMap,
      } as unknown as NextRequest
    }

    it('resolves URL from basic request without proxy headers', () => {
      const req = createMockNextRequest({
        url: 'http://localhost:3000/admin/pages?search=test',
      })

      const publicUrl = getPublicRequestUrl(req)
      expect(publicUrl).toBe('http://localhost:3000/admin/pages?search=test')
    })

    it('uses x-forwarded-host and x-forwarded-proto when behind a proxy', () => {
      const req = createMockNextRequest({
        url: 'http://internal-cms:3000/admin',
        headers: {
          'x-forwarded-host': 'cms.checkup360.com',
          'x-forwarded-proto': 'https',
        },
      })

      const publicUrl = getPublicRequestUrl(req)
      expect(publicUrl).toBe('https://cms.checkup360.com/admin')
    })

    it('handles comma-separated forwarded headers by taking the first entry', () => {
      const req = createMockNextRequest({
        url: 'http://internal-cms:3000/admin/authors',
        headers: {
          'x-forwarded-host': 'cms.checkup360.com, secondary.proxy.internal',
          'x-forwarded-proto': 'https, http',
        },
      })

      const publicUrl = getPublicRequestUrl(req)
      expect(publicUrl).toBe('https://cms.checkup360.com/admin/authors')
    })
  })
})
