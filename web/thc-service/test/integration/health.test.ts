import test from 'node:test';
import assert from 'node:assert';
import { getServer } from '../helper.js';

/**
 * Test di integrazione: health check di thc-service
 *
 * Acceptance Criteria:
 * - thc-service deve rispondere su /health/ready
 * - thc-service deve rispondere su /health/live
 */

void test('thc-service /health/live', async (t) => {
  const app = await getServer(t);

  const res = await app.inject({
    method: 'GET',
    url: '/health/live',
  });

  assert.strictEqual(res.statusCode, 200, 'should return 200 OK');
  const body = res.json();
  assert.strictEqual(body.status, 'ok', 'status should be ok');
  assert.strictEqual(body.service, 'thc-service', 'service name should be thc-service');
  assert.ok(body.timestamp, 'timestamp should be present');
  assert.ok(new Date(body.timestamp).getTime() > 0, 'timestamp should be valid ISO8601');
});

void test('thc-service /health/ready', async (t) => {
  const app = await getServer(t);

  const res = await app.inject({
    method: 'GET',
    url: '/health/ready',
  });

  assert.strictEqual(res.statusCode, 200, 'should return 200 OK');
  const body = res.json();
  assert.strictEqual(body.status, 'ready', 'status should be ready');
  assert.strictEqual(body.service, 'thc-service', 'service name should be thc-service');
  assert.ok(body.timestamp, 'timestamp should be present');
  assert.ok(body.checks, 'checks should be present');
  assert.strictEqual(body.checks.service, 'ok', 'service check should be ok');
});
