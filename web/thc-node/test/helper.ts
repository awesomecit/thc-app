import { create } from '../index.js';
import { test } from 'node:test';
import type { Server } from 'node:http';

type testfn = Parameters<typeof test>[0];
type TestContext = Parameters<Exclude<testfn, undefined>>[0];

export async function getServer(
  t: TestContext
): Promise<{ server: Server; port: number; baseUrl: string }> {
  const server = create();

  // Trova una porta disponibile
  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Could not get server address');
  }

  const port = address.port;
  const baseUrl = `http://localhost:${port}`;

  t.after(() => {
    return new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  return { server, port, baseUrl };
}
