import { postgresAdapter } from '@payloadcms/db-postgres'
import {
  lexicalEditor,
  HeadingFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
  UploadFeature,
  AlignFeature,
  BlockquoteFeature,
  HorizontalRuleFeature,
  IndentFeature,
  RelationshipFeature,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Authors } from './collections/Authors'
import { Pages } from './collections/Pages'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const getDatabaseUrl = (): string => {
  if (process.env.DATABASE_URI) {
    return process.env.DATABASE_URI
  }
  const user = encodeURIComponent(process.env.POSTGRES_USER || 'postgres')
  const password = encodeURIComponent(process.env.POSTGRES_PASSWORD || 'postgres')
  const host =
    process.env.POSTGRES_HOST ||
    (process.env.NODE_ENV === 'production' ? 'db' : '127.0.0.1')
  const port = process.env.POSTGRES_PORT || '5432'
  const baseDb = process.env.POSTGRES_DB || 'checkup360'
  const dbName = baseDb.endsWith('_cms') ? baseDb : `${baseDb}_cms`
  return `postgres://${user}:${password}@${host}:${port}/${dbName}`
}

const allowedOrigins: string[] = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
    ]

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      logout: {
        Button: './components/LogoutButton',
      },
    },
  },
  collections: [Users, Media, Authors, Pages],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => {
      const modifiedFeatures = defaultFeatures.map((feature) => {
        if (feature.key === 'relationship') {
          return RelationshipFeature({
            enabledCollections: ['pages', 'authors'],
          })
        }
        if (feature.key === 'unorderedList') {
          return {
            ...feature,
            feature: {
              ...feature.feature,
              ClientFeature: './components/CustomListFeatures.client#UnorderedListFeatureClient',
            },
          }
        }
        if (feature.key === 'orderedList') {
          return {
            ...feature,
            feature: {
              ...feature.feature,
              ClientFeature: './components/CustomListFeatures.client#OrderedListFeatureClient',
            },
          }
        }
        if (feature.key === 'checklist') {
          return {
            ...feature,
            feature: {
              ...feature.feature,
              ClientFeature: './components/CustomListFeatures.client#ChecklistFeatureClient',
            },
          }
        }
        return feature
      })

      return [
        ...modifiedFeatures,
        HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }),
        FixedToolbarFeature(),
        InlineToolbarFeature(),
        BlockquoteFeature(),
        HorizontalRuleFeature(),
        IndentFeature(),
        AlignFeature(),
        UploadFeature({
          collections: {
            media: {
              fields: [],
            },
          },
        }),
      ]
    },
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: getDatabaseUrl(),
    },
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
    prodMigrations: migrations,
  }),
  cors: allowedOrigins,
  csrf: allowedOrigins,
  sharp,
  plugins: [],
})
