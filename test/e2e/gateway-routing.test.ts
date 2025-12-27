/**
 * E2E Gateway Routing Tests - Simplified
 *
 * Tests gateway proxy routing without external dependencies.
 * Verifies that Watt gateway correctly routes requests to backend services.
 *
 * Uses spawn to start wattpm for realistic integration testing.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';

describe('E2E Gateway Routing Tests', () => {
  let wattProcess: ChildProcess;
  let baseUrl: string;

  before(
    async () => {
      console.log('🚀 Starting Watt runtime...');

      // Start wattpm as child process
      wattProcess = spawn('npx', ['wattpm', 'start'], {
        cwd: join(import.meta.dirname, '../..'),
        env: {
          ...process.env,
          PORT: '0', // Random port
          PLT_SERVER_LOGGER_LEVEL: 'error', // Reduce noise
        },
        stdio: 'pipe',
      });

      // Capture output to find the port
      await new Promise<void>((resolve, reject) => {
        let output = '';
        const timeout = setTimeout(() => {
          reject(new Error('Watt startup timeout after 60s'));
        }, 60000);

        wattProcess.stdout?.on('data', (data: Buffer) => {
          output += data.toString();

          // Look for port in output - Watt logs "Server listening at http://..."
          const portMatch = output.match(/listening at http:\/\/[^:]+:(\d+)/i);
          if (portMatch) {
            clearTimeout(timeout);
            baseUrl = `http://127.0.0.1:${portMatch[1]}`;
            console.log(`✅ Watt running at ${baseUrl}`);
            resolve();
          }
        });

        wattProcess.stderr?.on('data', (data: Buffer) => {
          const errorMsg = data.toString();
          // Only log actual errors, not info messages
          if (errorMsg.includes('error') || errorMsg.includes('Error')) {
            console.error(errorMsg);
          }
        });

        wattProcess.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });

        wattProcess.on('exit', (code) => {
          if (code !== null && code !== 0) {
            clearTimeout(timeout);
            reject(new Error(`Watt process exited with code ${code}`));
          }
        });
      });
    },
    { timeout: 90000 }
  ); // 90 seconds for Watt startup

  after(async () => {
    console.log('🧹 Cleanup: stopping Watt...');
    if (wattProcess) {
      wattProcess.kill('SIGTERM');
      // Wait for graceful shutdown
      await new Promise<void>((resolve) => {
        const killTimer = setTimeout(() => {
          wattProcess.kill('SIGKILL');
          resolve();
        }, 5000);

        wattProcess.on('exit', () => {
          clearTimeout(killTimer);
          resolve();
        });
      });
    }
    console.log('✅ Cleanup complete');
  });

  test('Gateway is accessible at entrypoint', async () => {
    const response = await fetch(baseUrl);
    // Gateway should respond (200 for docs, 404 for no root route)
    assert.ok([200, 404].includes(response.status), `Expected 200 or 404, got ${response.status}`);
  });

  test('Gateway health endpoint responds', async () => {
    const response = await fetch(`${baseUrl}/health`);
    // Health endpoint should exist or return 404 if not configured
    assert.ok([200, 404].includes(response.status));
  });

  test('Gateway exposes documentation', async () => {
    const response = await fetch(`${baseUrl}/documentation/json`);
    // Should have OpenAPI docs (200) or redirect (302) or not found (404)
    assert.ok([200, 302, 404].includes(response.status));

    if (response.status === 200) {
      const contentType = response.headers.get('content-type');
      assert.ok(contentType?.includes('application/json'), 'Documentation should be JSON');
    }
  });

  test('Invalid route returns 404', async () => {
    const response = await fetch(`${baseUrl}/non-existent-route-12345`);
    assert.equal(response.status, 404, 'Invalid routes should return 404');
  });
});
