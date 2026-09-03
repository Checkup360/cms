'use client'
import React from 'react'

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      document.cookie = 'auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
      document.cookie = 'auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure'
      window.location.href = '/admin'
    }
  }

  const webUrl = process.env.NEXT_PUBLIC_WEB_ORIGIN || 'http://localhost:5173'
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_ORIGIN || 'http://localhost:5174'

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
        <span className="nav__label" style={{ display: 'inline' }}>Volver a la App</span>
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
