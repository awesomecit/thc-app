import test from 'node:test';
import assert from 'node:assert';
import { getServer } from '../helper.js';

/**
 * Test di integrazione: Correlation ID middleware
 *
 * Acceptance Criteria (BDD):
 * - Generate UUID v4 if X-Request-ID header is missing
 * - Preserve existing X-Request-ID from client
 * - Add X-Request-ID to response headers
 * - requestId should appear in logs (verified via response header)
 *
 * Note: Il plugin request-id viene caricato automaticamente da Platformatic
 * tramite la configurazione plugins.paths in watt.json
 */

const REQUEST_ID_HEADER = 'x-request-id';
const HTTP_200_MSG = 'should return 200 OK';
const HEALTH_LIVE_ENDPOINT = '/health/live';

void test('Gateway generates X-Request-ID if not provided', async (t) => {
  const app = await getServer(t);

  const res = await app.inject({
    method: 'GET',
    url: HEALTH_LIVE_ENDPOINT,
  });

  assert.strictEqual(res.statusCode, 200, HTTP_200_MSG);
  assert.ok(res.headers[REQUEST_ID_HEADER], 'X-Request-ID header should be present');
  assert.match(
    res.headers[REQUEST_ID_HEADER] as string,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    'X-Request-ID should be a valid UUID v4'
  );
});

void test('Gateway preserves existing X-Request-ID', async (t) => {
  const app = await getServer(t);

  const existingRequestId = 'req-existing-123';
  const res = await app.inject({
    method: 'GET',
    url: HEALTH_LIVE_ENDPOINT,
    headers: {
      [REQUEST_ID_HEADER]: existingRequestId,
    },
  });

  assert.strictEqual(res.statusCode, 200, HTTP_200_MSG);
  assert.strictEqual(
    res.headers[REQUEST_ID_HEADER],
    existingRequestId,
    'X-Request-ID should be preserved from request'
  );
});

void test('X-Request-ID is included in response for all endpoints', async (t) => {
  const app = await getServer(t);

  const endpoints = ['/health/live', '/health/ready'];

  for (const endpoint of endpoints) {
    const res = await app.inject({
      method: 'GET',
      url: endpoint,
    });

    assert.ok(
      res.headers[REQUEST_ID_HEADER],
      `X-Request-ID header should be present for ${endpoint}`
    );
  }
});

void test('Each request gets a unique X-Request-ID', async (t) => {
  const app = await getServer(t);

  const requestIds: string[] = [];

  for (let i = 0; i < 3; i++) {
    const res = await app.inject({
      method: 'GET',
      url: HEALTH_LIVE_ENDPOINT,
    });

    const requestId = res.headers[REQUEST_ID_HEADER] as string;
    assert.ok(requestId, `Request ${i + 1} should have X-Request-ID`);
    requestIds.push(requestId);
  }

  // Check all requestIds are unique
  const uniqueIds = new Set(requestIds);
  assert.strictEqual(uniqueIds.size, requestIds.length, 'All X-Request-IDs should be unique');
});
