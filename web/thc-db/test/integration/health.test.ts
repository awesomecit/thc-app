import test, { after } from 'node:test';
import assert from 'node:assert';
import { getServer, cleanupTestDatabase } from '../helper.js';

/**
 * Test di integrazione: health check di thc-db
 *
 * Acceptance Criteria:
 * - thc-db deve rispondere su /health/ready
 * - thc-db deve rispondere su /health/live
 * - /health/ready deve verificare la connessione al database
 *
 * Uses PostgreSQL with Testcontainers to avoid SQLite ESM issues.
 * See: docs/BUG_REPORT_PLATFORMATIC_SQLITE_ESM.md
 */

// Cleanup PostgreSQL container after all tests
after(async () => {
  await cleanupTestDatabase();
});

void test('thc-db /health/ready', async (t) => {
  const app = await getServer(t);

  const res = await app.inject({
    method: 'GET',
    url: '/health/ready',
  });

  assert.strictEqual(res.statusCode, 200, 'should return 200 OK');
  const body = res.json();
  assert.strictEqual(body.status, 'ok', 'db should be ready');
});

void test('thc-db /health/live', async (t) => {
  const app = await getServer(t);

  const res = await app.inject({
    method: 'GET',
    url: '/health/live',
  });

  assert.strictEqual(res.statusCode, 200, 'should return 200 OK');
  const body = res.json();
  assert.strictEqual(body.status, 'ok', 'application should be alive');
});
