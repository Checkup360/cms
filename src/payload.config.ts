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
import { Pages } from './collections/Pages'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
  collections: [Users, Media, Pages],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => {
      const modifiedFeatures = defaultFeatures.map((feature) => {
        if (feature.key === 'relationship') {
          return RelationshipFeature({
            enabledCollections: ['pages'],
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
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [],
})
