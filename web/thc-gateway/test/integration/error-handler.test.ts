/**
 * Error Handler Integration Tests
 *
 * BDD scenarios for centralized error handling:
 * - Validation errors (400) return details array
 * - Not found errors (404) return NOT_FOUND code
 * - Internal errors (500) do NOT include stack trace in response
 * - Custom business errors use statusCode property
 * - Sensitive data (connection strings, paths) not exposed to client
 * - All errors include requestId for correlation
 *
 * Test Strategy:
 * - Use test-errors routes to trigger specific error types
 * - Verify response format, status codes, error codes
 * - Ensure sensitive data is masked in 5xx responses
 * - Verify requestId appears in all error responses
 */

import test from 'node:test';
import assert from 'node:assert';
import { getServer } from '../helper.js';

const CUSTOM_REQUEST_ID = 'test-error-req-123';
const INTERNAL_ERROR_MSG = 'Internal server error';
const NOT_FOUND_CODE = 'NOT_FOUND';
const INTERNAL_ERROR_CODE = 'INTERNAL_ERROR';
const EXPECT_500_MSG = 'should return 500 Internal Server Error';
const TEST_NOT_FOUND_URL = '/test-errors/not-found';

/**
 * BDD Scenario: Validation error (400) returns details array
 */
void test('Validation error returns 400 with code and details', async (t) => {
  const app = await getServer(t);

  const res = await app.inject({
    method: 'GET',
    url: '/test-errors/validation',
    headers: { 'x-request-id': CUSTOM_REQUEST_ID },
  });

  assert.strictEqual(res.statusCode, 400, 'should return 400 Bad Request');

  const body = res.json();
  const ERROR_MSG = 'response should have error object';
  assert.ok(body.error, ERROR_MSG);
  assert.strictEqual(body.error.code, 'VALIDATION_ERROR', 'error code should be VALIDATION_ERROR');
  assert.ok(body.error.message, 'error message should be present');
  assert.ok(Array.isArray(body.error.details), 'details should be an array');
  assert.ok(body.error.details.length > 0, 'details array should not be empty');
  assert.strictEqual(
    body.error.requestId,
    CUSTOM_REQUEST_ID,
    'requestId should match custom header'
  );
});

/**
 * BDD Scenario: Not found error (404) returns NOT_FOUND code
 */

void test('Not found error returns 404 with NOT_FOUND code', async (t) => {
  const app = await getServer(t);

  const res = await app.inject({
    method: 'GET',
    url: TEST_NOT_FOUND_URL,
    headers: { 'x-request-id': CUSTOM_REQUEST_ID },
  });

  assert.strictEqual(res.statusCode, 404, 'should return 404 Not Found');

  const body = res.json();
  assert.strictEqual(body.error.code, NOT_FOUND_CODE, 'error code should be NOT_FOUND');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Test assertion on dynamic error message
  assert.ok(body.error.message.includes('not found'), 'message should indicate resource not found');
  assert.strictEqual(
    body.error.requestId,
    CUSTOM_REQUEST_ID,
    'requestId should match custom header'
  );
});

/**
 * BDD Scenario: Unauthorized error (401)
 */
void test('Unauthorized error returns 401 with UNAUTHORIZED code', async (t) => {
  const app = await getServer(t);

  const res = await app.inject({
    method: 'GET',
    url: '/test-errors/unauthorized',
  });

  assert.strictEqual(res.statusCode, 401, 'should return 401 Unauthorized');

  const body = res.json();
  assert.strictEqual(body.error.code, 'UNAUTHORIZED', 'error code should be UNAUTHORIZED');
  assert.ok(body.error.requestId, 'requestId should be generated automatically');
});

/**
 * BDD Scenario: Forbidden error (403)
 */
void test('Forbidden error returns 403 with FORBIDDEN code', async (t) => {
  const app = await getServer(t);

  const res = await app.inject({
    method: 'GET',
    url: '/test-errors/forbidden',
  });

  assert.strictEqual(res.statusCode, 403, 'should return 403 Forbidden');

  const body = res.json();
  assert.strictEqual(body.error.code, 'FORBIDDEN', 'error code should be FORBIDDEN');
});

/**
 * BDD Scenario: Conflict error (409)
 */
void test('Conflict error returns 409 with CONFLICT code', async (t) => {
  const app = await getServer(t);

  const res = await app.inject({
    method: 'GET',
    url: '/test-errors/conflict',
  });

  assert.strictEqual(res.statusCode, 409, 'should return 409 Conflict');

  const body = res.json();
  assert.strictEqual(body.error.code, 'CONFLICT', 'error code should be CONFLICT');
});

/**
 * BDD Scenario: Internal error (500) does NOT include stack trace
 */

void test('Internal error returns 500 WITHOUT stack trace in response', async (t) => {
  const app = await getServer(t);

  const res = await app.inject({
    method: 'GET',
    url: '/test-errors/generic',
    headers: { 'x-request-id': CUSTOM_REQUEST_ID },
  });

  assert.strictEqual(res.statusCode, 500, EXPECT_500_MSG);

  const body = res.json();
  assert.strictEqual(body.error.code, INTERNAL_ERROR_CODE, 'error code should be INTERNAL_ERROR');
  assert.strictEqual(body.error.message, INTERNAL_ERROR_MSG, 'message should be generic');
  assert.ok(!body.error.stack, 'stack trace should NOT be exposed to client');
  assert.ok(!body.error.details, 'error details should NOT be exposed');
  assert.strictEqual(
    body.error.requestId,
    CUSTOM_REQUEST_ID,
    'requestId should be present for correlation'
  );
});

/**
 * BDD Scenario: Database error (500) masks connection string
 */
void test('Database error returns 500 with masked connection string', async (t) => {
  const app = await getServer(t);

  const res = await app.inject({
    method: 'GET',
    url: '/test-errors/database',
  });

  assert.strictEqual(res.statusCode, 500, EXPECT_500_MSG);

  const body = res.json();
  const bodyText = JSON.stringify(body);

  assert.strictEqual(body.error.code, 'DATABASE_ERROR', 'error code should be DATABASE_ERROR');
  assert.strictEqual(
    body.error.message,
    INTERNAL_ERROR_MSG,
    'message should be generic, NOT original error'
  );

  // Verify sensitive data is NOT in response
  assert.ok(!bodyText.includes('postgres://'), 'response should NOT contain connection protocol');
  assert.ok(!bodyText.includes('password'), 'response should NOT contain password');
  assert.ok(!bodyText.includes('admin'), 'response should NOT contain username');
  assert.ok(!bodyText.includes('5432'), 'response should NOT contain port');
});

/**
 * BDD Scenario: Generic 5xx error masks sensitive data (API keys, file paths)
 */
void test('Generic 5xx error masks sensitive data (API keys, paths)', async (t) => {
  const app = await getServer(t);

  const res = await app.inject({
    method: 'GET',
    url: '/test-errors/generic',
  });

  assert.strictEqual(res.statusCode, 500, EXPECT_500_MSG);

  const body = res.json();
  const bodyText = JSON.stringify(body);

  // Verify sensitive data is NOT in response
  assert.ok(!bodyText.includes('sk_live_'), 'response should NOT contain API key');
  assert.ok(!bodyText.includes('/var/secrets'), 'response should NOT contain file path');
  assert.ok(!bodyText.includes('api.key'), 'response should NOT contain file name');
});

/**
 * BDD Scenario: RequestId appears in all error responses
 */
void test('RequestId appears in all error responses', async (t) => {
  const app = await getServer(t);

  const endpoints = [
    '/test-errors/validation',
    TEST_NOT_FOUND_URL,
    '/test-errors/unauthorized',
    '/test-errors/database',
  ];

  const EXPECTED_MSG = 'should include requestId in error response';
  for (const endpoint of endpoints) {
    const res = await app.inject({
      method: 'GET',
      url: endpoint,
      headers: { 'x-request-id': CUSTOM_REQUEST_ID },
    });

    const body = res.json();
    assert.strictEqual(body.error.requestId, CUSTOM_REQUEST_ID, `${endpoint} ${EXPECTED_MSG}`);
  }
});

/**
 * BDD Scenario: @fastify/sensible errors handled correctly
 */
void test('@fastify/sensible reply.notFound() returns standard format', async (t) => {
  const app = await getServer(t);

  const res = await app.inject({
    method: 'GET',
    url: '/test-errors/sensible-404',
  });

  assert.strictEqual(res.statusCode, 404, 'should return 404 Not Found');

  const body = res.json();
  assert.strictEqual(body.error.code, NOT_FOUND_CODE, 'error code should be NOT_FOUND');
  assert.ok(body.error.requestId, 'requestId should be present');
});

/**
 * BDD Scenario: Error response structure is consistent
 */
void test('Error responses follow consistent structure', async (t) => {
  const app = await getServer(t);

  const res = await app.inject({
    method: 'GET',
    url: TEST_NOT_FOUND_URL,
  });

  const body = res.json();

  // Verify required fields
  assert.ok(body.error, 'response should have error object');
  assert.ok(body.error.code, 'error should have code');
  assert.ok(body.error.message, 'error should have message');
  assert.ok(body.error.requestId, 'error should have requestId');

  // Verify no extra fields at error level (except details for validation)
  const allowedFields = ['code', 'message', 'requestId', 'details'];
  const actualFields = Object.keys(body.error);
  for (const field of actualFields) {
    assert.ok(allowedFields.includes(field), `unexpected field in error object: ${field}`);
  }
});
