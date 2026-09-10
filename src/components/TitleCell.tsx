'use client'

import React from 'react'
import { Link, useConfig } from '@payloadcms/ui'
import type { DefaultCellComponentProps } from 'payload'

export default function TitleCell({ cellData, rowData, collectionSlug }: DefaultCellComponentProps) {
  const { config } = useConfig()
  const adminRoute = config?.routes?.admin || '/admin'
  const id = rowData?.id
  const href = id ? `${adminRoute}/collections/${collectionSlug}/${id}` : '#'

  return (
    <Link
      href={href}
      prefetch={false}
      style={{
        fontWeight: 500,
        color: 'inherit',
        textDecoration: 'none',
      }}
    >
      {cellData || '(Sin título)'}
    </Link>
  )
}
