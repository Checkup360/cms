import * as migration_20260813_225004_init from './20260813_225004_init';

export const migrations = [
  {
    up: migration_20260813_225004_init.up,
    down: migration_20260813_225004_init.down,
    name: '20260813_225004_init'
  },
];
