import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Checkup360 content management system.',
  title: 'Checkup360 - CMS',
  icons: { icon: '/favicon.svg' },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
