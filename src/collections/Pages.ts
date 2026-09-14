import type { CollectionConfig } from 'payload'

import { organizationCmsScoped, organizationScoped } from '../auth/access'

const DEFAULT_CATEGORY_WEIGHT = 0.2
const RECENCY_HALF_LIFE_DAYS = 30

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
          const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1)
          const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10) || 10)
          const weightsParam = url.searchParams.get('weights')

          let riskWeights: Record<string, number> = {}
          if (weightsParam) {
            try {
              riskWeights = JSON.parse(weightsParam)
            } catch {
              for (const pair of weightsParam.split(',')) {
                const [k, v] = pair.split(':')
                if (k && v) {
                  const num = parseFloat(v)
                  if (!isNaN(num)) riskWeights[k.trim().toLowerCase()] = num
                }
              }
            }
          }

          // Fetch all pages available to this organization context
          const userOrg = (req.user as any)?.organizationId
          const queryOrg = url.searchParams.get('organization')
          const orgId = userOrg || queryOrg

          const where: Record<string, any> = {}
          if (orgId) {
            where.organization = { equals: orgId }
          }

          const result = await req.payload.find({
            collection: 'pages',
            req,
            where: Object.keys(where).length > 0 ? where : undefined,
            limit: 0,
            depth: 2,
          })

          const docs = result.docs || []
          const nowMs = Date.now()

          // Score each document according to category weights and publication recency
          const scoredDocs = docs.map((doc: any) => {
            const types = Array.isArray(doc.diseaseTypes) ? doc.diseaseTypes : []
            
            let maxWeight = DEFAULT_CATEGORY_WEIGHT
            if (types.length > 0) {
              const weightsFound = types.map((t: string) => {
                const key = t.toLowerCase()
                return typeof riskWeights[key] === 'number'
                  ? riskWeights[key]
                  : DEFAULT_CATEGORY_WEIGHT
              })
              maxWeight = Math.max(...weightsFound)
            }

            const rawDate = doc.publishedAt || doc.createdAt
            const pubTime = rawDate ? new Date(rawDate).getTime() : nowMs
            const diffDays = Math.max(0, (nowMs - pubTime) / (1000 * 60 * 60 * 24))
            const recencyFactor = 1 / (1 + diffDays / RECENCY_HALF_LIFE_DAYS)

            const finalScore = maxWeight * (1 + recencyFactor)

            return {
              doc,
              score: finalScore,
              timestamp: pubTime,
            }
          })

          // Sort descending by score, tie-break by newer publication date
          scoredDocs.sort((a: any, b: any) => b.score - a.score || b.timestamp - a.timestamp)

          const totalDocs = scoredDocs.length
          const totalPages = Math.max(1, Math.ceil(totalDocs / limit))
          const start = (page - 1) * limit
          const paginatedDocs = scoredDocs.slice(start, start + limit).map((item: any) => item.doc)

          return Response.json({
            docs: paginatedDocs,
            totalDocs,
            limit,
            page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: page < totalPages ? page + 1 : null,
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
