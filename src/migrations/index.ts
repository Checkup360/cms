import * as migration_20260813_225004_init from './20260813_225004_init';
import * as migration_20260818_225617_add_authors from './20260818_225617_add_authors';

export const migrations = [
  {
    up: migration_20260813_225004_init.up,
    down: migration_20260813_225004_init.down,
    name: '20260813_225004_init',
  },
  {
    up: migration_20260818_225617_add_authors.up,
    down: migration_20260818_225617_add_authors.down,
    name: '20260818_225617_add_authors'
  },
];
