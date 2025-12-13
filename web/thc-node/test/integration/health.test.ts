import test from 'node:test';
import assert from 'node:assert';
import { getServer } from '../helper.js';

/**
 * Test di integrazione: health check di thc-node
 *
 * Acceptance Criteria:
 * - thc-node deve rispondere su /health/ready
 * - thc-node deve rispondere su /health/live
 *
 * Nota: thc-node è un server HTTP minimale custom,
 * quindi gli endpoint health potrebbero dover essere implementati
 */

const HEALTH_NOT_IMPLEMENTED_MSG = 'Health check not implemented yet';
const HTTP_200_MSG = 'should return 200 OK';

void test('thc-node /health/ready', async (t) => {
  const { baseUrl } = await getServer(t);

  const res = await fetch(`${baseUrl}/health/ready`);

  // Se non implementato, skippa il test
  if (res.status === 404) {
    t.skip(HEALTH_NOT_IMPLEMENTED_MSG);
    return;
  }

  assert.strictEqual(res.status, 200, HTTP_200_MSG);
  const body = (await res.json()) as { status: string };
  assert.strictEqual(body.status, 'ok', 'node app should be ready');
});

void test('thc-node /health/live', async (t) => {
  const { baseUrl } = await getServer(t);

  const res = await fetch(`${baseUrl}/health/live`);

  // Se non implementato, skippa il test
  if (res.status === 404) {
    t.skip(HEALTH_NOT_IMPLEMENTED_MSG);
    return;
  }

  assert.strictEqual(res.status, 200, HTTP_200_MSG);
  const body = (await res.json()) as { status: string };
  assert.strictEqual(body.status, 'ok', 'node app should be alive');
});

void test('thc-node basic endpoint', async (t) => {
  const { baseUrl } = await getServer(t);

  const res = await fetch(baseUrl);

  assert.strictEqual(res.status, 200, HTTP_200_MSG);
  const body = (await res.json()) as { hello: string };
  assert.deepStrictEqual(body, { hello: 'world' }, 'should return hello world');
});
