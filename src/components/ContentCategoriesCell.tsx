'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

import { useContentCategories } from './contentCategoriesClient'

/** Shows article categories by name in the list view, like a select field. */
export default function ContentCategoriesCell({ cellData }: DefaultCellComponentProps) {
  const { categories, isLoaded } = useContentCategories()
  const keys: string[] = Array.isArray(cellData) ? cellData.map(String) : []
  if (keys.length === 0) return <span>&lt;No Categories&gt;</span>
  // Avoid flashing raw keys while names load; keys are only a failure fallback
  if (!isLoaded) return <span aria-busy="true" />

  const labels = new Map(categories.map((category) => [category.key, category.label]))
  return <span>{keys.map((key) => labels.get(key) ?? key).join(', ')}</span>
}
