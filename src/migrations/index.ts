import * as migration_20260813_225004_init from './20260813_225004_init';
import * as migration_20260818_225617_add_authors from './20260818_225617_add_authors';
import * as migration_20260818_232032_add_pages_summary_published_readtime from './20260818_232032_add_pages_summary_published_readtime';
import * as migration_20260911_151501_update_pages_disease_types from './20260911_151501_update_pages_disease_types';
import * as migration_20261002_192851_dynamic_content_categories from './20261002_192851_dynamic_content_categories';

export const migrations = [
  {
    up: migration_20260813_225004_init.up,
    down: migration_20260813_225004_init.down,
    name: '20260813_225004_init',
  },
  {
    up: migration_20260818_225617_add_authors.up,
    down: migration_20260818_225617_add_authors.down,
    name: '20260818_225617_add_authors',
  },
  {
    up: migration_20260818_232032_add_pages_summary_published_readtime.up,
    down: migration_20260818_232032_add_pages_summary_published_readtime.down,
    name: '20260818_232032_add_pages_summary_published_readtime',
  },
  {
    up: migration_20260911_151501_update_pages_disease_types.up,
    down: migration_20260911_151501_update_pages_disease_types.down,
    name: '20260911_151501_update_pages_disease_types',
  },
  {
    up: migration_20261002_192851_dynamic_content_categories.up,
    down: migration_20261002_192851_dynamic_content_categories.down,
    name: '20261002_192851_dynamic_content_categories'
  },
];
