import { join } from 'node:path';
import { create } from '@platformatic/gateway';
import type { PlatformaticGatewayConfig } from '@platformatic/gateway';
import { test } from 'node:test';

type testfn = Parameters<typeof test>[0];
type TestContext = Parameters<Exclude<testfn, undefined>>[0];

export async function getServer(t: TestContext) {
  // Config minima per test standalone - NON leggere watt.json
  const config: PlatformaticGatewayConfig = {
    server: {
      hostname: '127.0.0.1',
      port: 0, // Porta random per evitare conflitti
      logger: { level: 'error' },
    },
    watch: false,
    // NON caricare plugins per test unitari (auth-jwt richiederebbe Keycloak)
    gateway: {
      applications: [], // Nessuna applicazione - test solo gateway base
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
