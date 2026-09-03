'use client'
import React, { useEffect, useState } from 'react'

function getWebUrl(): string {
  if (process.env.NEXT_PUBLIC_WEB_ORIGIN) {
    return process.env.NEXT_PUBLIC_WEB_ORIGIN
  }
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:5173`
    }
    if (hostname.startsWith('cms.')) {
      return `${protocol}//${hostname.replace(/^cms\./, 'web.')}`
    }
    return `${protocol}//${hostname}`
  }
  return 'http://localhost:5173'
}

function getApiOrigin(): string {
  if (process.env.NEXT_PUBLIC_API_ORIGIN) {
    return process.env.NEXT_PUBLIC_API_ORIGIN
  }
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:8000`
    }
    if (hostname.startsWith('cms.')) {
      return `${protocol}//${hostname.replace(/^cms\./, 'api.')}`
    }
    return `${protocol}//${hostname}`
  }
  return 'http://localhost:8000'
}

export default function LogoutButton() {
  const [webUrl, setWebUrl] = useState('http://localhost:5173')

  useEffect(() => {
    setWebUrl(getWebUrl())
  }, [])

  const handleLogout = async () => {
    const apiOrigin = getApiOrigin()
    const targetWebUrl = getWebUrl()

    // 1. Invalidate backend auth cookie
    try {
      await fetch(`${apiOrigin}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      console.error('Backend logout failed:', err)
    }

    // 2. Invalidate Payload CMS local session
    try {
      await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      console.error('CMS logout failed:', err)
    } finally {
      // 3. Clear auth cookies on document.cookie
      document.cookie = 'auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
      document.cookie = 'auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure'
      document.cookie = 'payload-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'

      // 4. Redirect to web app login page
      window.location.href = `${targetWebUrl}/login`
    }
  }

  return (
    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <a
        href={webUrl}
        className="nav__link"
        style={{
          color: 'var(--theme-text)',
          padding: '10px 15px',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          opacity: 0.8,
          textDecoration: 'none',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.8'
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        <span className="nav__label" style={{ display: 'inline' }}>Back to App</span>
      </a>

      <button
        onClick={handleLogout}
        type="button"
        className="nav__link"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--theme-text)',
          cursor: 'pointer',
          padding: '10px 15px',
          width: '100%',
          textAlign: 'left',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          opacity: 0.8,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.8'
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="nav__icon"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span className="nav__label" style={{ display: 'inline' }}>Logout</span>
      </button>
    </div>
  )
}
