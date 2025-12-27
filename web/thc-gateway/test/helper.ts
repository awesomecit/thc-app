import { join } from 'node:path';
import { create } from '@platformatic/gateway';
import type { PlatformaticGatewayConfig } from '@platformatic/gateway';
import { test } from 'node:test';

type testfn = Parameters<typeof test>[0];
type TestContext = Parameters<Exclude<testfn, undefined>>[0];

export async function getServer(t: TestContext) {
  // Config che carica i plugin reali per test di integrazione
  const config: PlatformaticGatewayConfig = {
    server: {
      hostname: '127.0.0.1',
      port: 0, // Porta random per evitare conflitti
      logger: { level: 'error' },
    },
    watch: false,
    plugins: {
      paths: [join(import.meta.dirname, '..', 'plugins')],
    },
    gateway: {
      applications: [], // Nessuna applicazione esterna - solo gateway
    },
  };

  const projectRoot = join(import.meta.dirname, '..');

  try {
    const server = await create(projectRoot, config);
    await server.start({});
    t.after(() => server.stop());
    return server.getApplication();
  } catch (err) {
    console.error('Gateway creation failed:', err);
    throw err;
  }
}
