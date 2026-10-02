'use client'

import { useConfig } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

export type ContentCategory = {
  key: string
  label: string
  active: boolean
}

// One request per page load, shared by the list cells and the edit field
const requests = new Map<string, Promise<ContentCategory[]>>()

function loadContentCategories(endpoint: string): Promise<ContentCategory[]> {
  let request = requests.get(endpoint)
  if (!request) {
    request = fetch(endpoint, { credentials: 'include' })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status))
        return response.json() as Promise<{ categories: ContentCategory[] }>
      })
      .then((data) => data.categories)
    // A failed request can be retried on the next render
    request.catch(() => requests.delete(endpoint))
    requests.set(endpoint, request)
  }
  return request
}

export function useContentCategories() {
  const { config } = useConfig()
  const endpoint = `${config.serverURL ?? ''}${config.routes.api}/pages/content-categories`
  const [categories, setCategories] = useState<ContentCategory[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadContentCategories(endpoint)
      .then((loaded) => !cancelled && setCategories(loaded))
      .catch(() => !cancelled && setLoadError('Categories could not be loaded.'))
      .finally(() => !cancelled && setIsLoaded(true))
    return () => {
      cancelled = true
    }
  }, [endpoint])

  return { categories, isLoaded, loadError }
}
