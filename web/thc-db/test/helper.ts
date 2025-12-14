import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { create } from '@platformatic/db';
import { test } from 'node:test';
import { startTestDatabase, stopTestDatabase } from './integration/test-db.js';

type testfn = Parameters<typeof test>[0];
type TestContext = Parameters<Exclude<testfn, undefined>>[0];

/**
 * Create Platformatic DB server for tests
 * Uses PostgreSQL with Testcontainers to avoid SQLite ESM issues
 * See: docs/BUG_REPORT_PLATFORMATIC_SQLITE_ESM.md
 */
export async function getServer(t: TestContext) {
  // Use PostgreSQL with Testcontainers instead of SQLite
  const connectionString = await startTestDatabase();

  // We go up two folder because this files executes in the dist folder
  const config = JSON.parse(await readFile(join(import.meta.dirname, '..', 'watt.json'), 'utf8'));

  config.server ||= {};
  config.server.logger ||= {};
  config.server.logger.level = 'warn';
  config.watch = false;

  config.migrations.autoApply = true;
  config.types.autogenerate = false;
  config.db.connectionString = connectionString;

  const server = await create(join(import.meta.dirname, '../'), config);
  await server.start({});
  t.after(() => server.stop());

  return server.getApplication();
}

/**
 * Cleanup function to stop PostgreSQL container after all tests
 * Call this in test suite teardown
 */
export async function cleanupTestDatabase() {
  await stopTestDatabase();
}
