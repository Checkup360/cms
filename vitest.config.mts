import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'text-summary', 'html', 'json', 'json-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        // Next.js routes/pages and generated/Payload config = framework glue
        'src/app/**',
        'src/migrations/**',
        'src/payload-types.ts',
        'src/payload.config.ts',
        // Presentational/declarative admin components (no business logic)
        'src/components/CustomListFeatures.client.tsx',
        'src/components/TitleCell.tsx',
        'src/components/ContentCategoriesCell.tsx',
      ],
    },
  },
})
