'use client'

import React, { useMemo } from 'react'
import { SelectInput, useField } from '@payloadcms/ui'
import type { OptionObject, TextFieldClientComponent } from 'payload'

import { useContentCategories, type ContentCategory } from './contentCategoriesClient'

const INACTIVE_SUFFIX = ' (inactive in your organization)'

function buildOptions(categories: ContentCategory[], selected: string[]): OptionObject[] {
  const byKey = new Map(categories.map((category) => [category.key, category]))
  const options = categories
    .filter((category) => category.active)
    .map((category) => ({ label: category.label, value: category.key }))

  // Keep categories the article already has, even if no longer enabled
  for (const key of selected) {
    const category = byKey.get(key)
    if (category?.active) continue
    options.push({ label: `${category?.label ?? key}${INACTIVE_SUFFIX}`, value: key })
  }
  return options
}

/**
 * Category picker for articles. Options come from the backend health topic
 * catalog: only topics enabled for the editor's organization can be added.
 */
const ContentCategoriesField: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue, showError } = useField<string[]>({ path })
  const { categories, isLoaded, loadError } = useContentCategories()
  const selected = useMemo(() => (Array.isArray(value) ? value : []), [value])
  const options = useMemo(() => buildOptions(categories, selected), [categories, selected])

  return (
    <SelectInput
      hasMany
      isClearable
      name={field.name}
      path={path}
      label={field.label}
      description={loadError ?? field.admin?.description}
      // Show names, never raw keys: values render once the categories load
      options={isLoaded ? options : []}
      value={isLoaded ? selected : []}
      placeholder={isLoaded ? undefined : 'Loading categories…'}
      showError={showError}
      readOnly={!isLoaded}
      onChange={(selection) => {
        const items = Array.isArray(selection) ? selection : selection ? [selection] : []
        setValue(items.map((item) => String(item.value)))
      }}
    />
  )
}

export default ContentCategoriesField
