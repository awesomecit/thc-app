/**
 * Basic import test for @thc/auth package
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('@thc/auth package exports', () => {
  it('should export default auth plugin', async () => {
    const authModule = await import('../dist/index.js');
    assert.ok(authModule.default, 'default export should exist');
    assert.strictEqual(typeof authModule.default, 'function', 'default should be a function');
  });

  it('should export jwtPlugin', async () => {
    const authModule = await import('../dist/index.js');
    assert.ok(authModule.jwtPlugin, 'jwtPlugin should be exported');
  });

  it('should export keycloakPlugin', async () => {
    const authModule = await import('../dist/index.js');
    assert.ok(authModule.keycloakPlugin, 'keycloakPlugin should be exported');
  });

  it('should export SessionManager', async () => {
    const authModule = await import('../dist/index.js');
    assert.ok(authModule.SessionManager, 'SessionManager should be exported');
  });
});
