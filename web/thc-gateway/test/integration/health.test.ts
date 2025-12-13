import test from 'node:test';
import assert from 'node:assert';
import { getServer } from '../helper.js';

/**
 * Test di integrazione: health check del gateway
 *
 * Acceptance Criteria:
 * - Il gateway deve rispondere su /health/ready
 * - Il gateway deve rispondere su /health/live
 * - Entrambi devono ritornare 200 OK con { status: 'ok' }
 */

void test('Gateway /health/ready', async (t) => {
  const app = await getServer(t);

  const res = await app.inject({
    method: 'GET',
    url: '/health/ready',
  });

  assert.strictEqual(res.statusCode, 200, 'should return 200 OK');
  const body = res.json();
  assert.strictEqual(body.status, 'ok', 'status should be ok');
});

void test('Gateway /health/live', async (t) => {
  const app = await getServer(t);

  const res = await app.inject({
    method: 'GET',
    url: '/health/live',
  });

  assert.strictEqual(res.statusCode, 200, 'should return 200 OK');
  const body = res.json();
  assert.strictEqual(body.status, 'ok', 'status should be ok');
});
