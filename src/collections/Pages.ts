import type { CollectionConfig, Where } from 'payload'

import { organizationCmsScoped, organizationScoped } from '../auth/access'

const DEFAULT_CATEGORY_WEIGHT = 0.2
const RECENCY_HALF_LIFE_DAYS = 30

const MAX_SEARCH_LENGTH = 100

type RecommendedParams = {
  page: number
  limit: number
  riskWeights: Record<string, number>
  organizationId: string | null
  category: string | null
  search: string | null
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  return Math.max(1, parseInt(value || String(fallback), 10) || fallback)
}

function parseRiskWeights(weightsParam: string | null): Record<string, number> {
  if (!weightsParam) return {}
  try {
    return JSON.parse(weightsParam)
  } catch {
    const riskWeights: Record<string, number> = {}
    for (const pair of weightsParam.split(',')) {
      const [key, value] = pair.split(':')
      const weight = parseFloat(value ?? '')
      if (key && !isNaN(weight)) riskWeights[key.trim().toLowerCase()] = weight
    }
    return riskWeights
  }
}

function parseRecommendedParams(searchParams: URLSearchParams): RecommendedParams {
  const category = searchParams.get('category')?.trim().toLowerCase() || null
  const search = searchParams.get('search')?.trim().slice(0, MAX_SEARCH_LENGTH) || null
  return {
    page: parsePositiveInteger(searchParams.get('page'), 1),
    limit: parsePositiveInteger(searchParams.get('limit'), 10),
    riskWeights: parseRiskWeights(searchParams.get('weights')),
    organizationId: searchParams.get('organization'),
    category,
    search,
  }
}

function buildRecommendedWhere(
  organizationId: string | null,
  category: string | null = null,
  search: string | null = null,
): Where | undefined {
  const conditions: Where[] = []
  if (organizationId) conditions.push({ organization: { equals: organizationId } })
  if (category) conditions.push({ diseaseTypes: { in: [category] } })
  if (search) {
    conditions.push({ or: [{ title: { like: search } }, { summary: { like: search } }] })
  }
  if (conditions.length === 0) return undefined
  if (conditions.length === 1) return conditions[0]
  return { and: conditions }
}

function relevanceScore(doc: any, riskWeights: Record<string, number>, nowMs: number): number {
  const types: string[] = Array.isArray(doc.diseaseTypes) ? doc.diseaseTypes : []
  const weights = types.map((type) => {
    const weight = riskWeights[type.toLowerCase()]
    return typeof weight === 'number' ? weight : DEFAULT_CATEGORY_WEIGHT
  })
  const maxWeight = weights.length > 0 ? Math.max(...weights) : DEFAULT_CATEGORY_WEIGHT

  const diffDays = Math.max(0, (nowMs - publicationTime(doc, nowMs)) / (1000 * 60 * 60 * 24))
  const recencyFactor = 1 / (1 + diffDays / RECENCY_HALF_LIFE_DAYS)
  return maxWeight * (1 + recencyFactor)
}

function publicationTime(doc: any, nowMs: number): number {
  const rawDate = doc.publishedAt || doc.createdAt
  return rawDate ? new Date(rawDate).getTime() : nowMs
}

function rankByRelevance(docs: any[], riskWeights: Record<string, number>): any[] {
  const nowMs = Date.now()
  return docs
    .map((doc) => ({
      doc,
      score: relevanceScore(doc, riskWeights, nowMs),
      timestamp: publicationTime(doc, nowMs),
    }))
    .sort((a, b) => b.score - a.score || b.timestamp - a.timestamp)
    .map((item) => item.doc)
}

function paginate(docs: any[], page: number, limit: number) {
  const totalDocs = docs.length
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit))
  const start = (page - 1) * limit
  return {
    docs: docs.slice(start, start + limit),
    totalDocs,
    limit,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    prevPage: page > 1 ? page - 1 : null,
    nextPage: page < totalPages ? page + 1 : null,
  }
}

function collectCategories(docs: any[]): string[] {
  const categories = new Set<string>()
  for (const doc of docs) {
    for (const type of Array.isArray(doc.diseaseTypes) ? doc.diseaseTypes : []) {
      categories.add(String(type).toLowerCase())
    }
  }
  return [...categories].sort()
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['coverImage', 'title', 'diseaseTypes', 'publishedAt', 'createdAt'],
  },
  access: {
    create: organizationCmsScoped,
    read: organizationScoped,
    update: organizationCmsScoped,
    delete: organizationCmsScoped,
  },
  endpoints: [
    {
      path: '/recommended',
      method: 'get',
      handler: async (req: any) => {
        try {
          const url = new URL(req.url, 'http://localhost')
          const params = parseRecommendedParams(url.searchParams)
          const organizationId = (req.user as any)?.organizationId || params.organizationId

          const [filteredResult, categoriesResult] = await Promise.all([
            req.payload.find({
              collection: 'pages',
              req,
              where: buildRecommendedWhere(organizationId, params.category, params.search),
              limit: 0,
              depth: 2,
            }),
            req.payload.find({
              collection: 'pages',
              req,
              where: buildRecommendedWhere(organizationId),
              limit: 0,
              depth: 0,
              select: { diseaseTypes: true },
            }),
          ])

          const rankedDocs = rankByRelevance(filteredResult.docs || [], params.riskWeights)
          return Response.json({
            ...paginate(rankedDocs, params.page, params.limit),
            categories: collectCategories(categoriesResult.docs || []),
          })
        } catch (error: any) {
          return Response.json(
            { error: 'Failed to calculate recommended pages', message: error?.message },
            { status: 500 }
          )
        }
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        const user = req.user as { organizationId?: string | null } | null
        if (user?.organizationId) {
          data.organization = user.organizationId
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'coverImage',
      label: 'Cover Image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Cover or featured image for the article/page.',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        components: {
          Cell: './components/TitleCell',
        },
      },
    },
    {
      name: 'summary',
      label: 'Summary / Subtitle',
      type: 'textarea',
      admin: {
        description: 'Brief summary or excerpt displayed on article cards and under the title.',
      },
    },
    {
      name: 'author',
      label: 'Author',
      type: 'relationship',
      relationTo: 'authors',
      admin: {
        description: 'Author of the article/page.',
      },
    },
    {
      name: 'publishedAt',
      label: 'Publication Date',
      type: 'date',
      admin: {
        description: 'Visible publication date of the article. If empty, creation date is used.',
      },
    },
    {
      name: 'readTime',
      label: 'Read Time (minutes)',
      type: 'number',
      min: 1,
      admin: {
        description: 'Custom estimated reading time in minutes (optional). If empty, it will be calculated automatically from content.',
      },
    },
    {
      name: 'content',
      type: 'richText',
    },
    {
      name: 'diseaseTypes',
      label: 'Disease Types / Categories',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'General Health', value: 'general' },
        { label: 'Diabetes', value: 'diabetes' },
        { label: 'Sleep Apnea', value: 'sleep_apnea' },
        { label: 'Depression & Mental Health', value: 'depression' },
        { label: 'Metabolic Syndrome', value: 'metabolic_syndrome' },
        { label: 'Obesity (EOSS)', value: 'eoss' },
        { label: 'Cardiovascular Disease', value: 'cardiovascular' },
      ],
      admin: {
        description: 'Categories to help organize, prioritize, and recommend content to members.',
      },
    },
    {
      name: 'organization',
      type: 'text',
      index: true,
      admin: {
        hidden: true,
        disableListColumn: true,
        disableListFilter: true,
      },
    },
  ],
}
